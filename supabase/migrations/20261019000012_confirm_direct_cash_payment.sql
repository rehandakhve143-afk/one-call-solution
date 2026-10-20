-- Provider confirms customer-paid cash directly; OCS never collects the job amount.
-- Transactional, idempotent, provider-authorized and wallet commission once per booking.
CREATE OR REPLACE FUNCTION public.confirm_cash_received_v1(p_payment_id uuid)
RETURNS public.booking_payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE p public.booking_payments; b public.bookings; v_fee numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'login required'; END IF;
  SELECT * INTO p FROM public.booking_payments WHERE id=p_payment_id FOR UPDATE;
  IF p.id IS NULL OR p.method <> 'cash' THEN RAISE EXCEPTION 'cash payment not found'; END IF;
  SELECT * INTO b FROM public.bookings WHERE id=p.booking_id FOR UPDATE;
  IF b.id IS NULL OR b.provider_id IS DISTINCT FROM auth.uid()
     OR p.provider_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'assigned provider required';
  END IF;
  IF p.status='cash_confirmed' THEN RETURN p; END IF;
  IF p.status<>'cash_marked' THEN RAISE EXCEPTION 'cash payment not pending'; END IF;
  IF p.purpose<>'job' OR b.status<>'completion_requested' THEN
    RAISE EXCEPTION 'job completion required';
  END IF;
  IF p.amount IS DISTINCT FROM b.booking_amount THEN
    RAISE EXCEPTION 'payment amount mismatch';
  END IF;
  v_fee := public.apply_provider_commission_v1(b.id,p.amount);
  UPDATE public.booking_payments SET status='cash_confirmed',commission_amount=v_fee,
    paid_at=now(),updated_at=now() WHERE id=p.id RETURNING * INTO p;
  UPDATE public.bookings SET status='completed',updated_at=now() WHERE id=b.id;
  UPDATE public.provider_status SET current_booking_id=NULL,updated_at=now()
    WHERE provider_id=b.provider_id AND current_booking_id=b.id;
  INSERT INTO public.booking_status_events(booking_id,status,actor_id,note)
    VALUES(b.id,'completed',auth.uid(),'Direct cash received confirmed by provider');
  RETURN p;
END;
$function$;
REVOKE ALL ON FUNCTION public.confirm_cash_received_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.confirm_cash_received_v1(uuid) TO authenticated,service_role;
