-- Isolated booking test: no duplicate visit charge and no automatic collection.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('c2222222-2222-4222-8222-222222222222','visit-customer@test.invalid','{"role":"customer"}'::jsonb),
       ('c3333333-3333-4333-8333-333333333333','visit-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role)
VALUES ('c2222222-2222-4222-8222-222222222222','customer'),
       ('c3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address)
VALUES ('c2222222-2222-4222-8222-222222222222','c3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','working','Visit test address');
SELECT lives_ok(
 $visit$ SELECT public.ocs_mark_visit_not_completed_v1((SELECT id FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid),6,'Customer unavailable','c3333333-3333-4333-8333-333333333333'::uuid) $visit$,
 'Server records not completed visit'
);
SELECT is((SELECT status FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid),'not_completed','Booking enters not completed');
SELECT is((SELECT visit_charge FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid),199::numeric,'6 km visit charge is 199');
SELECT is((SELECT work_not_completed_reason FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid),'Customer unavailable','Reason preserved');
SELECT throws_ok(
 $visit$ SELECT public.ocs_mark_visit_not_completed_v1((SELECT id FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid),12,'Repeat charge','c3333333-3333-4333-8333-333333333333'::uuid) $visit$,
 'P0001','invalid booking state','Duplicate visit charge rejected'
);
SELECT is((SELECT visit_charge FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid),199::numeric,'Duplicate attempt cannot change charge');
SELECT is((SELECT count(*)::integer FROM public.booking_status_events WHERE booking_id=(SELECT id FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid) AND status='not_completed'),1,'Exactly one visit event');
SELECT is((SELECT count(*)::integer FROM public.booking_payments WHERE booking_id=(SELECT id FROM public.bookings WHERE customer_id='c2222222-2222-4222-8222-222222222222'::uuid)),0,'No automatic payment created');
SELECT * FROM finish();
ROLLBACK;
