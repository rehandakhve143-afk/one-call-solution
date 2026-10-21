-- Real isolated customer booking RPC integration; test identities and rows roll back.
-- No production access, live payment, or simulated browser.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(44);
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
  $$ SELECT public.accept_booking_v3((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)) $$,
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
  $$ SELECT public.provider_booking_action((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'on_way',NULL) $$,
  'Assigned SP starts travelling'
);
SELECT lives_ok(
  $$ SELECT public.provider_booking_action((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'reached',NULL) $$,
  'Assigned SP arrives and creates start OTP'
);
SELECT is(
  (SELECT length(start_otp) FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  6,
  'Real OTP has six digits'
);
SELECT lives_ok(
  $$ SELECT public.provider_booking_action(
    (SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
    'start',
    (SELECT start_otp FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)
  ) $$,
  'SP starts work using generated OTP'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'working',
  'Correct OTP transitions booking to working'
);
SELECT lives_ok(
  $$ SELECT public.provider_booking_action((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'complete',NULL) $$,
  'SP requests work completion'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'completion_requested',
  'Full isolated booking reaches completion_requested'
);
-- Isolated test-only stand-in for reward use lookup. No production schema change.
CREATE TABLE IF NOT EXISTS public.customer_booking_reward_uses (
  booking_id uuid NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL,
  amount numeric NOT NULL DEFAULT 0
);
-- Provider confirms an actual cash-marked ledger item via the authenticated RPC.
INSERT INTO public.booking_payments(booking_id,customer_id,provider_id,purpose,method,amount,status)
SELECT id,customer_id,provider_id,'job','cash',239,'cash_marked'
FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid;
-- Unassigned SP cannot confirm the customer's cash ledger.
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('f4444444-4444-4444-8444-444444444444','ocs-unassigned-sp@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role)
VALUES ('f4444444-4444-4444-8444-444444444444','service_provider');
SELECT set_config('request.jwt.claim.sub','f4444444-4444-4444-8444-444444444444',true);
SELECT throws_ok(
  $other_sp$ SELECT public.confirm_cash_received_v1((SELECT id FROM public.booking_payments
    WHERE status='cash_marked' AND customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)) $other_sp$,
  'P0001','assigned provider required','Unassigned SP cannot confirm another SP cash payment'
);
SELECT is((SELECT status FROM public.booking_payments WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'cash_marked','Unassigned SP leaves payment pending');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),0,'Unassigned SP cannot debit assigned provider wallet');
SELECT set_config('request.jwt.claim.sub','f3333333-3333-4333-8333-333333333333',true);
-- Booking customer is not the assigned provider and cannot confirm cash.
SELECT set_config('request.jwt.claim.sub','f2222222-2222-4222-8222-222222222222',true);
SELECT throws_ok(
  $customer_cash$ SELECT public.confirm_cash_received_v1((SELECT id FROM public.booking_payments
    WHERE status='cash_marked' AND customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)) $customer_cash$,
  'P0001','assigned provider required','Customer cannot impersonate provider for cash confirmation'
);
SELECT is((SELECT status FROM public.booking_payments WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),'cash_marked','Customer cash attempt leaves payment unchanged');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),0,'Customer cash attempt creates no provider commission');
SELECT set_config('request.jwt.claim.sub','f3333333-3333-4333-8333-333333333333',true);
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT lives_ok(
  $$ SELECT public.confirm_cash_received_v1((SELECT id FROM public.booking_payments
       WHERE status='cash_marked' AND customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)) $$,
  'Assigned SP confirms direct cash receipt'
);
SELECT is(
  (SELECT status FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'completed',
  'Cash confirmation completes the booking'
);
SELECT is(
  (SELECT current_booking_id FROM public.provider_status WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid),
  NULL::uuid,
  'Completed job releases provider current slot'
);
SELECT is(
  (SELECT commission_amount FROM public.booking_payments
   WHERE status='cash_confirmed' AND customer_id='f2222222-2222-4222-8222-222222222222'::uuid ORDER BY created_at DESC LIMIT 1),
  21.51::numeric,
  'Cash confirmation records 9 percent fee'
);
SELECT throws_ok(
  $tag$ SELECT public.confirm_cash_received_v1((SELECT id FROM public.booking_payments
       WHERE status='cash_confirmed' AND customer_id='f2222222-2222-4222-8222-222222222222'::uuid
       ORDER BY created_at DESC LIMIT 1)) $tag$,
  'P0001',
  'cash payment not pending',
  'Repeated confirmation is rejected without charging again'
);
SELECT is(
  (SELECT count(*)::integer FROM public.wallet_transactions
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),
  1,
  'Repeated cash confirmation never duplicates commission'
);
SELECT is(
  (SELECT status FROM public.booking_payments
   WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),
  'cash_confirmed',
  'Cash receipt is confirmed'
);
SELECT is(
  (SELECT wallet_balance FROM public.provider_status
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid),
  78.49::numeric,
  'Welcome wallet less nine percent commission'
);
SELECT is(
  (SELECT count(*)::integer FROM public.wallet_transactions
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),
  1,
  'Cash receipt creates one commission ledger entry'
);
SELECT is(
  (SELECT coalesce(sum(amount),0) FROM public.wallet_transactions
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),
  (-21.51)::numeric,
  'Commission ledger records Rs 21.51 debit'
);
SELECT is(
  (SELECT count(*)::integer FROM public.booking_status_events
   WHERE booking_id=(SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1)
     AND status='completed'),
  1,
  'Booking completed event recorded exactly once'
);
-- Re-enter the real commission function after settlement: ledger and balance must stay stable.
SELECT is(
  public.apply_provider_commission_v1(
    (SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),239),
  21.51::numeric,
  'Replayed commission returns the original fee'
);
SELECT is(
  (SELECT wallet_balance FROM public.provider_status
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid),
  78.49::numeric,
  'Commission replay cannot debit wallet twice'
);
SELECT is(
  (SELECT count(*)::integer FROM public.wallet_transactions
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),
  1,
  'Commission replay cannot duplicate ledger rows'
);
-- Malicious/accidental replay with a different amount must not create a second debit.
SELECT is(
  public.apply_provider_commission_v1(
    (SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),2000),
  180::numeric,
  'Changed amount replay returns the requested fee without a new debit'
);
SELECT is(
  (SELECT wallet_balance FROM public.provider_status
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid),
  78.49::numeric,
  'Changed amount replay leaves wallet unchanged'
);
SELECT is(
  (SELECT count(*)::integer FROM public.wallet_transactions
   WHERE provider_id='f3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),
  1,
  'Changed amount replay creates no extra commission row'
);
-- Rating is only accepted after payment completes the same booking.
SELECT set_config('request.jwt.claim.sub','f2222222-2222-4222-8222-222222222222',true);
SELECT lives_ok(
  $rating$ SELECT public.submit_provider_rating_v1((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),5,'Excellent service') $rating$,
  'Booking customer rates the completed job'
);
SELECT is((SELECT stars FROM public.provider_ratings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid),5,'Five-star rating saved');
SELECT is((public.provider_rating_summary_v1('f3333333-3333-4333-8333-333333333333'::uuid)->>'count')::integer,1,'SP rating summary counts one review');
SELECT lives_ok(
  $rating$ SELECT public.submit_provider_rating_v1((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),4,'Updated review') $rating$,
  'Same customer may update their booking rating'
);
SELECT is((SELECT count(*)::integer FROM public.provider_ratings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid),1,'Rating update does not duplicate reviews');
SELECT throws_ok(
  $rating$ SELECT public.submit_provider_rating_v1((SELECT id FROM public.bookings WHERE customer_id='f2222222-2222-4222-8222-222222222222'::uuid LIMIT 1),6,'Invalid') $rating$,
  'P0001','rating must be 1 to 5','Ratings above five are rejected'
);
SELECT * FROM finish();
ROLLBACK;
