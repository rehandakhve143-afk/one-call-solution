-- Isolated real booking RPC guard: disputed/unfinished bookings cannot be completed through provider cash confirmation.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(6);
-- Test-only dependency used by wallet/reward lookup in the real RPC; rolled back.
CREATE TABLE IF NOT EXISTS public.customer_booking_reward_uses (booking_id uuid NOT NULL,purpose text NOT NULL,status text NOT NULL,amount numeric NOT NULL DEFAULT 0);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('a2222222-2222-4222-8222-222222222222','guard-customer@test.invalid','{"role":"customer"}'::jsonb),
('a3333333-3333-4333-8333-333333333333','guard-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role) VALUES
('a2222222-2222-4222-8222-222222222222','customer'),
('a3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address)
VALUES ('a2222222-2222-4222-8222-222222222222','a3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','completion_requested','Test address');
INSERT INTO public.booking_payments(booking_id,customer_id,provider_id,purpose,method,amount,status)
SELECT id,customer_id,provider_id,'job','cash',239,'cash_marked' FROM public.bookings WHERE customer_id='a2222222-2222-4222-8222-222222222222'::uuid;
SELECT set_config('request.jwt.claim.sub','a2222222-2222-4222-8222-222222222222',true);
SELECT lives_ok($dispute$ SELECT public.customer_dispute_completion_v2((SELECT id FROM public.bookings WHERE customer_id='a2222222-2222-4222-8222-222222222222'::uuid),'Work incomplete') $dispute$,'Customer opens real completion dispute');
SELECT is((SELECT status FROM public.bookings WHERE customer_id='a2222222-2222-4222-8222-222222222222'::uuid),'support_review','Disputed booking is on support review');
SELECT set_config('request.jwt.claim.sub','a3333333-3333-4333-8333-333333333333',true);
SELECT throws_ok($cash$ SELECT public.confirm_cash_received_v1((SELECT id FROM public.booking_payments WHERE customer_id='a2222222-2222-4222-8222-222222222222'::uuid)) $cash$,'P0001','job completion required','Cash confirmation cannot bypass dispute');
SELECT is((SELECT status FROM public.booking_payments WHERE customer_id='a2222222-2222-4222-8222-222222222222'::uuid),'cash_marked','Cash ledger unchanged after blocked confirmation');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='a3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),0,'No commission debited for disputed booking');
SELECT is((SELECT customer_completion_confirmed FROM public.bookings WHERE customer_id='a2222222-2222-4222-8222-222222222222'::uuid),false,'Customer completion not silently confirmed');
SELECT * FROM finish();
ROLLBACK;
