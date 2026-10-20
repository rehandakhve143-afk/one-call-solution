-- Customer-to-provider live backend RPC contract (no real users or money).
-- These exact signatures were checked against production pg_proc on 2026-10-20.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(11);
SELECT has_function('public','create_customer_booking_v4',ARRAY['text','text','numeric','text','text','jsonb','jsonb','double precision','double precision'],'customer booking RPC matches live signature');
SELECT has_function('public','accept_booking_v3',ARRAY['uuid'],'provider acceptance RPC matches live signature');
SELECT has_function('public','provider_booking_action',ARRAY['uuid','text','text'],'provider OTP and completion RPC matches live signature');
SELECT has_function('public','confirm_cash_received_v1',ARRAY['uuid'],'cash receipt RPC matches live signature');
SELECT has_function('public','apply_provider_commission_v1',ARRAY['uuid','numeric'],'nine-percent commission RPC matches live signature');
SELECT has_table('public','bookings','bookings table exists for continuous booking flow');
-- Guard against future regression of the production SP accept dependencies.
SELECT has_table('public','provider_service_locations','SP location table is present');
SELECT has_table('public','provider_onboarding','SP approval table is present');
SELECT has_table('public','provider_transport_profiles','Transport provider table is present');
SELECT has_table('public','provider_skills','SP skills table is present');
SELECT has_function('public','ocs_sp_wallet_new_jobs_allowed_v1','SP wallet acceptance gate is present');
SELECT * FROM finish();
ROLLBACK;
