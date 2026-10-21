-- Reproduce the verified production completion dispute contract in isolated CI.
CREATE OR REPLACE FUNCTION public.customer_dispute_completion_v2(p_booking_id uuid, p_reason text DEFAULT 'Customer did not confirm completion')
RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 UPDATE public.bookings SET status='support_review',updated_at=now()
 WHERE id=p_booking_id AND customer_id=auth.uid() AND status='completion_requested'
 RETURNING * INTO b;
 IF b.id IS NULL THEN RAISE EXCEPTION 'invalid booking state'; END IF;
 INSERT INTO public.booking_status_events(booking_id,status,actor_id,note)
 VALUES(b.id,'support_review',auth.uid(),left(coalesce(p_reason,'Customer completion dispute'),500));
 RETURN b;
END;
$function$;
REVOKE ALL ON FUNCTION public.customer_dispute_completion_v2(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.customer_dispute_completion_v2(uuid,text) TO authenticated,service_role;
