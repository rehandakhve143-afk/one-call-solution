-- Restrict direct commission ledger mutation to trusted backend calls.
-- SECURITY DEFINER booking/payment RPCs can invoke this function internally;
-- authenticated clients must not directly supply arbitrary booking IDs/amounts.
-- This migration does not debit wallets or modify booking/payment records.
REVOKE ALL ON FUNCTION public.apply_provider_commission_v1(uuid,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_provider_commission_v1(uuid,numeric) TO service_role;
