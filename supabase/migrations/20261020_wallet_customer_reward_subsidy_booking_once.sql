-- Applied to live Supabase on 2026-10-20 and verified in pg_indexes.
-- Enforce at most one OCS-funded reward subsidy ledger credit per provider and booking.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_customer_reward_subsidy_booking_once
ON public.wallet_transactions (provider_id, booking_id, kind)
WHERE booking_id IS NOT NULL AND kind = 'customer_reward_subsidy';
