-- Defense in depth: refuse cash confirmation if a booking has entered support review.
-- No payment, wallet, or production data is modified by this migration itself.
CREATE OR REPLACE FUNCTION public.ocs_cash_dispute_guard_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $guard$
BEGIN
 IF NEW.status='cash_confirmed' AND OLD.status IS DISTINCT FROM 'cash_confirmed'
 AND EXISTS (
   SELECT 1 FROM public.bookings b
   WHERE b.id=NEW.booking_id AND b.status IN ('support_review','not_completed')
 ) THEN
   RAISE EXCEPTION 'job completion required';
 END IF;
 RETURN NEW;
END;
$guard$;
DROP TRIGGER IF EXISTS ocs_cash_dispute_guard ON public.booking_payments;
CREATE TRIGGER ocs_cash_dispute_guard
BEFORE UPDATE OF status ON public.booking_payments
FOR EACH ROW EXECUTE FUNCTION public.ocs_cash_dispute_guard_v1();
