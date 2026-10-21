-- Real trigger tests for authoritative booking commission; all fixtures roll back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('e2222222-2222-4222-8222-222222222222','commission-customer@test.invalid','{"role":"customer"}'::jsonb),
('e3333333-3333-4333-8333-333333333333','commission-provider@test.invalid','{"role":"service_provider"}'::jsonb);
INSERT INTO public.user_roles(user_id,role) VALUES
('e2222222-2222-4222-8222-222222222222','customer'),
('e3333333-3333-4333-8333-333333333333','service_provider');
INSERT INTO public.bookings(customer_id,provider_id,category,service_name,booking_amount,payment_method,status,address)
VALUES ('e2222222-2222-4222-8222-222222222222','e3333333-3333-4333-8333-333333333333','Electrical','Fan',239,'cash','completion_requested','Commission guard address');
SELECT has_trigger('public','wallet_transactions','ocs_commission_amount_guard','Commission amount guard installed');
SELECT throws_ok($bad$ INSERT INTO public.wallet_transactions(provider_id,booking_id,amount,kind)
SELECT provider_id,id,-180,'commission' FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid $bad$,
'P0001','commission amount mismatch','Wrong 9% commission rejected');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='e3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),0,'Rejected commission does not create a ledger entry');
SELECT lives_ok($good$ INSERT INTO public.wallet_transactions(provider_id,booking_id,amount,kind)
SELECT provider_id,id,-21.51,'commission' FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid $good$,'Correct 9% commission accepted');
SELECT throws_ok($tamper$ UPDATE public.wallet_transactions SET amount=-180 WHERE provider_id='e3333333-3333-4333-8333-333333333333'::uuid AND kind='commission' $tamper$,'P0001','commission amount mismatch','Existing commission cannot be tampered with');
SELECT is((SELECT amount FROM public.wallet_transactions WHERE provider_id='e3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),(-21.51)::numeric,'Original commission ledger amount preserved');
SELECT throws_ok($dup$ INSERT INTO public.wallet_transactions(provider_id,booking_id,amount,kind) SELECT provider_id,id,-21.51,'commission' FROM public.bookings WHERE customer_id='e2222222-2222-4222-8222-222222222222'::uuid $dup$,'23505',NULL,'Duplicate commission prevented');
SELECT is((SELECT count(*)::integer FROM public.wallet_transactions WHERE provider_id='e3333333-3333-4333-8333-333333333333'::uuid AND kind='commission'),1,'Single commission row remains');
SELECT * FROM finish();
ROLLBACK;
