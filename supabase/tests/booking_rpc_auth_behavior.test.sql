-- Execute actual booking RPCs against isolated Supabase with no authenticated user.
-- These are behavior tests, not a simulated browser flow; no real user or payment.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);
SELECT throws_ok(
  $$ SELECT public.accept_booking_v3('00000000-0000-0000-0000-000000000001'::uuid) $$,
  'P0001',
  'login required',
  'SP cannot accept a booking without authentication'
);
SELECT throws_ok(
  $$ SELECT public.create_customer_booking_v4('Electrical','Fan',239,'cash','Test address','[]'::jsonb,'{}'::jsonb,19.0,73.0) $$,
  'P0001',
  'Login required',
  'Customer cannot create a booking without authentication'
);
SELECT throws_ok(
  $$ SELECT public.accept_booking_v3('00000000-0000-0000-0000-000000000002'::uuid) $$,
  'P0001',
  'login required',
  'A second unauthenticated booking acceptance is also rejected'
);
-- Authenticated JWT identities without a customer/SP role must also be rejected.
-- Isolated database only; no auth.users row, booking, or payment is created.
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
SELECT throws_ok(
  $$ SELECT public.create_customer_booking_v4('Electrical','Fan',239,'cash','Isolated test address','[]'::jsonb,'{}'::jsonb,19.0,73.0) $$,
  'P0001',
  'Customer profile required',
  'Authenticated identity without customer role cannot create booking'
);
SELECT throws_ok(
  $$ SELECT public.accept_booking_v3('00000000-0000-0000-0000-000000000003'::uuid) $$,
  'P0001',
  'service_provider role required',
  'Authenticated identity without SP role cannot accept booking'
);
SELECT set_config('request.jwt.claim.sub','',true);
SELECT throws_ok(
  $ SELECT public.customer_dispute_completion_v2('00000000-0000-0000-0000-000000000004'::uuid,'Unauthorized') $,
  'P0001','login required','Anonymous caller cannot open completion dispute'
);
SELECT throws_ok(
  $ SELECT public.confirm_cash_received_v1('00000000-0000-0000-0000-000000000005'::uuid) $,
  'P0001','login required','Anonymous caller cannot confirm direct cash'
);
SELECT throws_ok(
  $ SELECT public.submit_provider_rating_v1('00000000-0000-0000-0000-000000000006'::uuid,5,'Test') $,
  'P0001','login required','Anonymous caller cannot rate a provider'
);
SELECT * FROM finish();
ROLLBACK;
