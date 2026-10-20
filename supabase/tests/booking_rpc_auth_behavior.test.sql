-- Execute actual booking RPCs against isolated Supabase with no authenticated user.
-- These are behavior tests, not a simulated browser flow; no real user or payment.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(3);
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
SELECT * FROM finish();
ROLLBACK;
