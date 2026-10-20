-- Real isolated customer booking RPC integration; test identities and rows roll back.
-- No production access, live payment, or simulated browser.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(15);
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
-- Provision a synthetic approved SP in the same rolled-back database transaction.
INSERT INTO auth.users (id,email,raw_user_meta_data)
VALUES ('f3333333-3333-4333-8333-333333333333','ocs-sp-integration@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role)
VALUES ('f3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.provider_onboarding(provider_id,status)
VALUES ('f3333333-3333-4333-8333-333333333333','approved');
INSERT INTO public.provider_service_locations(provider_id,latitude,longitude,radius_km)
VALUES ('f3333333-3333-4333-8333-333333333333',19.0,73.0,12);
INSERT INTO public.provider_skills(provider_id,skill,category,service_name,approved,verification_status,enabled_by_provider)
VALUES ('f3333333-3333-4333-8333-333333333333','Electrical:Fan','Electrical','Fan',true,'approved',true);
SELECT set_config('request.jwt.claim.sub','f3333333-3333-4333-8333-333333333333',true);
SELECT is(public.ocs_sp_wallet_new_jobs_allowed_v1(),true,'New SP welcome wallet allows initial job');
SELECT lives_ok(
  $ SELECT public.accept_booking_v3((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)) $,
  'Approved SP accepts actual customer booking'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'accepted',
  'Customer booking changes to accepted'
);
SELECT is(
  (SELECT current_booking_id FROM public.provider_status WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid),
  (SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'Accepted booking occupies SP current job slot'
);
-- Continue the SAME booking through the real provider OTP state machine.
SELECT lives_ok(
  $ SELECT public.provider_booking_action((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'on_way',NULL) $,
  'Assigned SP starts travelling'
);
SELECT lives_ok(
  $ SELECT public.provider_booking_action((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'reached',NULL) $,
  'Assigned SP arrives and creates start OTP'
);
SELECT is(
  (SELECT length(start_otp) FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  6,
  'Real OTP has six digits'
);
SELECT lives_ok(
  $ SELECT public.provider_booking_action(
    (SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
    'start',
    (SELECT start_otp FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)
  ) $,
  'SP starts work using generated OTP'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'working',
  'Correct OTP transitions booking to working'
);
SELECT lives_ok(
  $ SELECT public.provider_booking_action((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'complete',NULL) $,
  'SP requests work completion'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'completion_requested',
  'Full isolated booking reaches completion_requested'
);
SELECT * FROM finish();
ROLLBACK;
