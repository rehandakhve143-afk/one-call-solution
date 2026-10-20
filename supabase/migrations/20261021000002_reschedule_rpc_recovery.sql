-- Restore the existing live reschedule RPC contract to clean isolated databases.
CREATE TABLE IF NOT EXISTS public.booking_reschedule_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id uuid NOT NULL REFERENCES public.bookings(id),
 requested_by uuid NOT NULL REFERENCES public.profiles(id),
 requested_role text NOT NULL,
 new_scheduled_at timestamptz NOT NULL,
 reason text,
 status text NOT NULL DEFAULT 'pending',
 responded_by uuid REFERENCES public.profiles(id),
 responded_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS booking_reschedule_one_pending_idx ON public.booking_reschedule_requests(booking_id) WHERE status='pending';
ALTER TABLE public.booking_reschedule_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_reschedule_requests FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.request_reschedule_v1(p_booking_id uuid,p_new_scheduled_at timestamptz,p_reason text DEFAULT NULL)
RETURNS public.booking_reschedule_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings; r public.booking_reschedule_requests; v_role text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 IF p_new_scheduled_at<=now() THEN RAISE EXCEPTION 'future schedule required'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF b.id IS NULL OR b.status<>'working' THEN RAISE EXCEPTION 'reschedule allowed only while working'; END IF;
 IF b.customer_id=auth.uid() THEN v_role:='customer';
 ELSIF b.provider_id=auth.uid() THEN v_role:='service_provider';
 ELSE RAISE EXCEPTION 'booking access denied'; END IF;
 IF EXISTS(SELECT 1 FROM public.booking_reschedule_requests x WHERE x.booking_id=b.id AND x.status='pending') THEN RAISE EXCEPTION 'reschedule already pending'; END IF;
 INSERT INTO public.booking_reschedule_requests(booking_id,requested_by,requested_role,new_scheduled_at,reason)
 VALUES(b.id,auth.uid(),v_role,p_new_scheduled_at,nullif(btrim(coalesce(p_reason,'')),'')) RETURNING * INTO r;
 UPDATE public.bookings SET status='reschedule_pending',visit_charge=0,updated_at=now() WHERE id=b.id;
 INSERT INTO public.booking_status_events(booking_id,status,actor_id,note) VALUES(b.id,'reschedule_pending',auth.uid(),'Reschedule requested for '||p_new_scheduled_at::text);
 RETURN r;
END;
$function$;
CREATE OR REPLACE FUNCTION public.respond_reschedule_v1(p_request_id uuid,p_decision text)
RETURNS public.booking_reschedule_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.booking_reschedule_requests; b public.bookings; v_decision text:=lower(coalesce(p_decision,''));
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 IF v_decision NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'invalid decision'; END IF;
 SELECT * INTO r FROM public.booking_reschedule_requests WHERE id=p_request_id FOR UPDATE;
 IF r.id IS NULL OR r.status<>'pending' THEN RAISE EXCEPTION 'reschedule request not pending'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=r.booking_id FOR UPDATE;
 IF NOT (b.customer_id=auth.uid() OR b.provider_id=auth.uid()) THEN RAISE EXCEPTION 'booking access denied'; END IF;
 IF r.requested_by=auth.uid() THEN RAISE EXCEPTION 'requester cannot decide own request'; END IF;
 UPDATE public.booking_reschedule_requests SET status=v_decision,responded_by=auth.uid(),responded_at=now() WHERE id=r.id RETURNING * INTO r;
 IF v_decision='approved' THEN
 UPDATE public.bookings SET status='rescheduled',start_otp=null,visit_charge=0,updated_at=now() WHERE id=b.id;
 ELSE UPDATE public.bookings SET status='working',updated_at=now() WHERE id=b.id;
 END IF;
 INSERT INTO public.booking_status_events(booking_id,status,actor_id,note) VALUES(b.id,CASE WHEN v_decision='approved' THEN 'rescheduled' ELSE 'working' END,auth.uid(),'Reschedule '||v_decision);
 RETURN r;
END;
$function$;
CREATE OR REPLACE FUNCTION public.resume_rescheduled_booking_v1(p_booking_id uuid)
RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 UPDATE public.bookings SET status='accepted',start_otp=null,updated_at=now()
 WHERE id=p_booking_id AND provider_id=auth.uid() AND status='rescheduled' RETURNING * INTO b;
 IF b.id IS NULL THEN RAISE EXCEPTION 'rescheduled booking not available'; END IF;
 INSERT INTO public.booking_status_events(booking_id,status,actor_id,note)
 VALUES(b.id,'accepted',auth.uid(),'Rescheduled visit made current; fresh travel and OTP required');
 RETURN b;
END;
$function$;
REVOKE ALL ON FUNCTION public.request_reschedule_v1(uuid,timestamptz,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.respond_reschedule_v1(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.resume_rescheduled_booking_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_reschedule_v1(uuid,timestamptz,text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.respond_reschedule_v1(uuid,text) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.resume_rescheduled_booking_v1(uuid) TO authenticated,service_role;
