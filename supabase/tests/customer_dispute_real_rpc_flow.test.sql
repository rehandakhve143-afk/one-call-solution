-- Customer dispute integration on a synthetic booking; transaction rolls back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(6);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('d2222222-2222-4222-8222-222222222222','dispute-customer@test.invalid','{"role":"customer"}'::jsonb),
       ('d3333333-3333-4333-8333-333333333333','dispute-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role)
VALUES ('d2222222-2222-4222-8222-222222222222','customer'),
       ('d3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address)
VALUES ('d2222222-2222-4222-8222-222222222222','d3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','completion_requested','Dispute test address');
SELECT set_config('request.jwt.claim.role','authenticated',true);
SELECT set_config('request.jwt.claim.sub','d3333333-3333-4333-8333-333333333333',true);
SELECT throws_ok(
 $dispute$ SELECT public.customer_dispute_completion_v2((SELECT id FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),'Provider attempt') $dispute$,
 'P0001','invalid booking state','SP cannot dispute as customer');
SELECT set_config('request.jwt.claim.sub','d2222222-2222-4222-8222-222222222222',true);
SELECT lives_ok(
 $dispute$ SELECT public.customer_dispute_completion_v2((SELECT id FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),'Work not completed') $dispute$,
 'Customer disputes completion');
SELECT is((SELECT status FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),'support_review','Dispute enters support review');
SELECT is((SELECT note FROM public.booking_status_events WHERE actor_id='d2222222-2222-4222-8222-222222222222'::uuid AND status='support_review' LIMIT 1),'Work not completed','Dispute reason audited');
SELECT throws_ok(
 $dispute$ SELECT public.customer_dispute_completion_v2((SELECT id FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),'Duplicate') $dispute$,
 'P0001','invalid booking state','Duplicate dispute rejected');
SELECT is((SELECT customer_completion_confirmed FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),false,'Dispute does not confirm completion');
SELECT * FROM finish();
ROLLBACK;
