-- Recovery of the actual production provider action RPC for isolated CI only.
-- No OTPs, users, bookings or payment records are created by this migration.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS otp_locked_until timestamptz;
CREATE OR REPLACE FUNCTION public.provider_booking_action(p_booking_id uuid, p_action text, p_start_otp text DEFAULT NULL::text)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE b public.bookings; ns text; generated_otp text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF b.id IS NULL OR b.provider_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'not assigned provider'; END IF;
 IF p_action='on_way' AND b.status='accepted' THEN ns:='on_way';
 ELSIF p_action='reached' AND b.status='on_way' THEN
   ns:='reached';
   generated_otp:=lpad((floor(random()*900000)+100000)::int::text,6,'0');
 ELSIF p_action='start' AND b.status='reached' THEN
   IF b.otp_locked_until>now() THEN
     b.start_otp:=NULL; RETURN b;
   END IF;
   IF b.start_otp IS NULL OR b.otp_expires_at IS NULL OR b.otp_expires_at<=now() THEN
     RAISE EXCEPTION 'Start OTP expired; request a new OTP';
   END IF;
   IF p_start_otp IS DISTINCT FROM b.start_otp THEN
     UPDATE public.bookings SET otp_attempts=CASE WHEN otp_locked_until IS NOT NULL AND otp_locked_until<=now() THEN 1 ELSE otp_attempts+1 END,
       otp_locked_until=CASE WHEN (CASE WHEN otp_locked_until IS NOT NULL AND otp_locked_until<=now() THEN 1 ELSE otp_attempts+1 END)>=5 THEN now()+interval '15 minutes' ELSE NULL END
     WHERE id=b.id RETURNING * INTO b;
     b.start_otp:=NULL; RETURN b;
   END IF;
   ns:='working';
 ELSIF p_action='complete' AND b.status='working' THEN ns:='completion_requested';
 ELSE RAISE EXCEPTION 'invalid transition'; END IF;
 UPDATE public.bookings SET status=ns,
 start_otp=CASE WHEN ns='reached' THEN generated_otp WHEN ns='working' THEN NULL ELSE start_otp END,
 otp_expires_at=CASE WHEN ns='reached' THEN now()+interval '10 minutes' WHEN ns='working' THEN NULL ELSE otp_expires_at END,
 otp_attempts=CASE WHEN ns IN ('reached','working') THEN 0 ELSE otp_attempts END,
 otp_locked_until=CASE WHEN ns IN ('reached','working') THEN NULL ELSE otp_locked_until END,
 updated_at=now() WHERE id=b.id RETURNING * INTO b;
 INSERT INTO public.booking_status_events(booking_id,status,actor_id) VALUES(b.id,ns,auth.uid());
 b.start_otp:=NULL;
 RETURN b;
END
$function$
;
REVOKE ALL ON FUNCTION public.provider_booking_action(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.provider_booking_action(uuid,text,text) TO authenticated,service_role;
