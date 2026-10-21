-- Isolated real database guard: not-completed bookings must not be marked cash paid.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(6);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('d2222222-2222-4222-8222-222222222222','unfinished-customer@test.invalid','{"role":"customer"}'::jsonb),
('d3333333-3333-4333-8333-333333333333','unfinished-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role) VALUES
('d2222222-2222-4222-8222-222222222222','customer'),
('d3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address,visit_charge,work_not_completed_reason)
VALUES ('d2222222-2222-4222-8222-222222222222','d3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','not_completed','Unfinished visit address',199,'Customer not available');
INSERT INTO public.booking_payments(booking_id,customer_id,provider_id,purpose,method,amount,status)
SELECT id,customer_id,provider_id,'job','cash',239,'cash_marked' FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid;
SELECT has_trigger('public','booking_payments','ocs_cash_dispute_guard','Cash guard trigger exists');
SELECT throws_ok($blocked$ UPDATE public.booking_payments SET status='cash_confirmed' WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid $blocked$,'P0001','job completion required','Not-completed booking cannot be marked paid');
SELECT is((SELECT status FROM public.booking_payments WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),'cash_marked','Cash payment unchanged');
SELECT is((SELECT visit_charge FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),199::numeric,'Visit charge unchanged');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='d3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),0,'No commission created');
SELECT is((SELECT status FROM public.bookings WHERE customer_id='d2222222-2222-4222-8222-222222222222'::uuid),'not_completed','Booking stays not completed');
SELECT * FROM finish();
ROLLBACK;
