-- Isolated DB regression: payment and subsidy ledger must retain security boundaries.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(10);
SELECT has_table('public','booking_payments','payment ledger exists');
SELECT has_table('public','wallet_transactions','wallet ledger exists');
SELECT has_table('public','ocs_provider_subsidy_disbursements','bank subsidy ledger exists');
SELECT has_function('public','confirm_cash_received_v1',ARRAY['uuid'],'cash confirmation RPC exists');
SELECT ok(EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='apply_provider_commission_v1'), 'commission RPC exists (signature-independent)');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE oid='public.booking_payments'::regclass),true,'payment ledger RLS enabled');
SELECT is((SELECT relrowsecurity FROM pg_class WHERE oid='public.ocs_provider_subsidy_disbursements'::regclass),true,'bank subsidy ledger RLS enabled');
SELECT has_index('public','booking_payments','booking_payments_provider_payment_uidx','provider payment reference unique index exists');
SELECT has_index('public','ocs_provider_subsidy_disbursements','ocs_provider_subsidy_booking_purpose_once','subsidy booking-purpose unique constraint exists');
SELECT has_function('public','is_admin',ARRAY[]::text[],'admin authorization function exists');
SELECT * FROM finish();
ROLLBACK;
