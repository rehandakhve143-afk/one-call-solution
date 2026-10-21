-- Real trigger integration: a disputed booking cannot have cash ledger marked confirmed,
-- even by a direct SQL update bypassing the payment RPC. All rows rolled back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(6);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('b2222222-2222-4222-8222-222222222222','trigger-customer@test.invalid','{"role":"customer"}'::jsonb),
('b3333333-3333-4333-8333-333333333333','trigger-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role) VALUES
('b2222222-2222-4222-8222-222222222222','customer'),
('b3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address)
VALUES ('b2222222-2222-4222-8222-222222222222','b3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','support_review','Trigger test address');
INSERT INTO public.booking_payments(booking_id,customer_id,provider_id,purpose,method,amount,status)
SELECT id,customer_id,provider_id,'job','cash',239,'cash_marked' FROM public.bookings WHERE customer_id='b2222222-2222-4222-8222-222222222222'::uuid;
SELECT has_trigger('public','booking_payments','ocs_cash_dispute_guard','Dispute guard trigger installed');
SELECT throws_ok($update$ UPDATE public.booking_payments SET status='cash_confirmed' WHERE customer_id='b2222222-2222-4222-8222-222222222222'::uuid $update$,'P0001','job completion required','Direct cash confirmation bypass blocked');
SELECT is((SELECT status FROM public.booking_payments WHERE customer_id='b2222222-2222-4222-8222-222222222222'::uuid),'cash_marked','Ledger unchanged after rejected update');
SELECT is((SELECT status FROM public.bookings WHERE customer_id='b2222222-2222-4222-8222-222222222222'::uuid),'support_review','Booking remains in dispute');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='b3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),0,'No wallet commission debited');
SELECT is((SELECT count(*)::integer FROM public.booking_status_events WHERE booking_id=(SELECT id FROM public.bookings WHERE customer_id='b2222222-2222-4222-8222-222222222222'::uuid) AND status='completed'),0,'No completed event generated');
SELECT * FROM finish();
ROLLBACK;
