-- Restore production commission RPC dependency in isolated schema.
-- Function body copied from current production definition; no real money transfers.
ALTER TABLE public.provider_status ADD COLUMN IF NOT EXISTS wallet_warning_sent_at timestamptz;
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_kind_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_kind_check
 CHECK (kind IN ('welcome_bonus','recharge','platform_charge','adjustment','commission','customer_reward_subsidy'));
CREATE UNIQUE INDEX IF NOT EXISTS wallet_commission_booking_once
 ON public.wallet_transactions(provider_id,booking_id,kind)
 WHERE booking_id IS NOT NULL AND kind='commission';
CREATE OR REPLACE FUNCTION public.apply_provider_commission_v1(p_booking_id uuid, p_amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE b public.bookings; ps public.provider_status; v_commission numeric:=round(greatest(coalesce(p_amount,0),0)*0.09,2); v_exists boolean;
BEGIN
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF b.id IS NULL OR b.provider_id IS NULL THEN RETURN 0; END IF;
 SELECT * INTO ps FROM public.provider_status WHERE provider_id=b.provider_id FOR UPDATE;
 IF ps.provider_id IS NULL THEN RAISE EXCEPTION 'Provider wallet not found'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.wallet_transactions WHERE provider_id=b.provider_id AND booking_id=b.id AND kind='commission') INTO v_exists;
 IF v_exists THEN RETURN v_commission; END IF;
 UPDATE public.provider_status SET wallet_balance=round(coalesce(wallet_balance,0)-v_commission,2),wallet_warning_sent_at=CASE WHEN coalesce(wallet_balance,0)-v_commission<100 THEN now() ELSE wallet_warning_sent_at END,updated_at=now() WHERE provider_id=b.provider_id;
 INSERT INTO public.wallet_transactions(provider_id,booking_id,amount,kind) VALUES(b.provider_id,b.id,-v_commission,'commission');
 RETURN v_commission;
END;
$function$;
REVOKE ALL ON FUNCTION public.apply_provider_commission_v1(uuid,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_provider_commission_v1(uuid,numeric) TO authenticated,service_role;
