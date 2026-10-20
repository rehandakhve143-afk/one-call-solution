-- Real isolated customer booking RPC integration; test identities and rows roll back.
-- No production access, live payment, or simulated browser.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(4);
INSERT INTO auth.users (id,email,raw_user_meta_data)
VALUES ('f2222222-2222-4222-8222-222222222222','ocs-customer-integration@test.invalid','{"role":"customer"}'::jsonb);
INSERT INTO public.user_roles(user_id,role)
VALUES ('f2222222-2222-4222-8222-222222222222','customer');
SELECT set_config('request.jwt.claim.sub','f2222222-2222-4222-8222-222222222222',true);
SELECT lives_ok(
  $$ SELECT public.create_customer_booking_v4('Electrical','Fan',239,'cash','Isolated integration address','[]'::jsonb,'{}'::jsonb,19.0,73.0) $$,
  'Authenticated customer creates booking using actual RPC'
);
SELECT is(
  (SELECT count(*)::integer FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid),
  1,
  'Exactly one booking persisted in isolated transaction'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'searching',
  'Booking enters searching state'
);
SELECT is(
  (SELECT count(*)::integer FROM public.booking_status_events e JOIN public.bookings b ON b.id=e.booking_id WHERE b.customer_id='f2222222-2222-4222-8222-222222222222'::uuid AND e.status='searching'),
  1,
  'Booking creation records a searching event'
);
SELECT * FROM finish();
ROLLBACK;
