-- Prevent a trusted caller from applying an arbitrary commission base.
-- A booking's authoritative price is its booking_amount, not a supplied override.
CREATE OR REPLACE FUNCTION public.ocs_commission_amount_guard_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $guard$
DECLARE v_amount numeric;
BEGIN
 IF NEW.kind='commission' AND NEW.booking_id IS NOT NULL THEN
   SELECT booking_amount INTO v_amount FROM public.bookings WHERE id=NEW.booking_id;
   IF v_amount IS NULL OR NEW.amount IS DISTINCT FROM -round(greatest(v_amount,0)*0.09,2) THEN
     RAISE EXCEPTION 'commission amount mismatch';
   END IF;
 END IF;
 RETURN NEW;
END;
$guard$;
DROP TRIGGER IF EXISTS ocs_commission_amount_guard ON public.wallet_transactions;
CREATE TRIGGER ocs_commission_amount_guard
BEFORE INSERT OR UPDATE OF amount,booking_id,kind ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.ocs_commission_amount_guard_v1();
