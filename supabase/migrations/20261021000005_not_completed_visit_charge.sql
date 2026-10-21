-- Provider records an unfinished visit; customer payment is NOT collected here.
-- Distance must be supplied by a trusted server workflow after verification.
CREATE OR REPLACE FUNCTION public.ocs_mark_visit_not_completed_v1(
 p_booking_id uuid, p_distance_km numeric, p_reason text, p_provider_id uuid
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $func$
DECLARE b public.bookings; v_charge numeric;
BEGIN
 IF p_provider_id IS NULL THEN RAISE EXCEPTION 'provider required'; END IF;
 IF nullif(btrim(coalesce(p_reason,'')),'') IS NULL THEN RAISE EXCEPTION 'reason required'; END IF;
 v_charge:=public.ocs_visit_charge_quote_v1(p_distance_km);
 IF v_charge IS NULL THEN RAISE EXCEPTION 'distance outside visit charge policy'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF b.id IS NULL OR b.provider_id IS DISTINCT FROM p_provider_id THEN RAISE EXCEPTION 'not assigned provider'; END IF;
 IF b.status NOT IN ('reached','working') THEN RAISE EXCEPTION 'invalid booking state'; END IF;
 UPDATE public.bookings SET status='not_completed',work_not_completed_reason=left(btrim(p_reason),500),visit_charge=v_charge,updated_at=now()
 WHERE id=b.id RETURNING * INTO b;
 INSERT INTO public.booking_status_events(booking_id,status,actor_id,note)
 VALUES(b.id,'not_completed',p_provider_id,'Visit charge recorded; pending customer confirmation');
 RETURN b;
END;
$func$;
REVOKE ALL ON FUNCTION public.ocs_mark_visit_not_completed_v1(uuid,numeric,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ocs_mark_visit_not_completed_v1(uuid,numeric,text,uuid) TO service_role;
