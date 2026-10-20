-- Reschedule workflow using isolated synthetic identities, rolled back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(12);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('e2222222-2222-4222-8222-222222222222','reschedule-customer@test.invalid','{"role":"customer"}'::jsonb),
       ('e3333333-3333-4333-8333-333333333333','reschedule-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role)
VALUES ('e2222222-2222-4222-8222-222222222222','customer'),
       ('e3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address)
VALUES ('e2222222-2222-4222-8222-222222222222','e3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','working','Reschedule test address');
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','e2222222-2222-4222-8222-222222222222',true);
SELECT throws_ok(
 $res$ SELECT public.request_reschedule_v1((SELECT id FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),now()-interval '1 day','past') $res$,
 'P0001','future schedule required','Past reschedule dates rejected'
);
SELECT lives_ok(
 $res$ SELECT public.request_reschedule_v1((SELECT id FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),now()+interval '2 days','Return visit') $res$,
 'Customer requests a future reschedule'
);
SELECT is((SELECT status FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),'reschedule_pending','Booking waits for approval');
SELECT is((SELECT count(*)::integer FROM public.booking_reschedule_requests WHERE requested_by='e2222222-2222-4222-8222-222222222222'::uuid),1,'One reschedule request recorded');
SELECT throws_ok(
 $res$ SELECT public.respond_reschedule_v1((SELECT id FROM public.booking_reschedule_requests WHERE requested_by='e2222222-2222-4222-8222-222222222222'::uuid),'approved') $res$,
 'P0001','requester cannot decide own request','Customer cannot approve own request'
);
SELECT set_config('request.jwt.claim.sub','e3333333-3333-4333-8333-333333333333',true);
SELECT lives_ok(
 $res$ SELECT public.respond_reschedule_v1((SELECT id FROM public.booking_reschedule_requests WHERE requested_by='e2222222-2222-4222-8222-222222222222'::uuid),'approved') $res$,
 'Assigned SP approves the reschedule'
);
SELECT is((SELECT status FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),'rescheduled','Approved booking is rescheduled');
SELECT is((SELECT visit_charge FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),0::numeric,'Rescheduled visit has zero visit charge');
SELECT lives_ok(
 $res$ SELECT public.resume_rescheduled_booking_v1((SELECT id FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid)) $res$,
 'Assigned SP resumes rescheduled booking'
);
SELECT is((SELECT status FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),'accepted','Resumed booking returns to accepted');
SELECT is((SELECT start_otp FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid),NULL::text,'Resumed booking requires fresh OTP');
SELECT is((SELECT count(*)::integer FROM public.booking_status_events WHERE booking_id=(SELECT id FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid) AND status='rescheduled'),1,'Reschedule approval event recorded');
SELECT * FROM finish();
ROLLBACK;
