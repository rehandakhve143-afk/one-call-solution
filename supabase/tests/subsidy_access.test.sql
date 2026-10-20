-- Isolated Supabase only: deny unauthenticated access to all subsidy operations.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
select has_function('public','ocs_admin_prepare_provider_subsidy_v1',array['uuid','text'],'prepare RPC exists');
select has_function('public','ocs_admin_provider_subsidy_queue_v1',array['integer'],'queue RPC exists');
select has_function('public','ocs_admin_mark_provider_subsidy_sent_v1',array['uuid','text'],'mark sent RPC exists');
select has_function('public','ocs_admin_verify_provider_subsidy_v1',array['uuid','text'],'verify RPC exists');
set local role anon;
select throws_ok($$select public.ocs_admin_prepare_provider_subsidy_v1('00000000-0000-0000-0000-000000000001'::uuid,'job')$$,'42501',null,'anon cannot prepare subsidy');
select throws_ok($$select public.ocs_admin_provider_subsidy_queue_v1(10)$$,'42501',null,'anon cannot read subsidy queue');
select throws_ok($$select public.ocs_admin_mark_provider_subsidy_sent_v1('00000000-0000-0000-0000-000000000001'::uuid,'TESTUTR12345')$$,'42501',null,'anon cannot mark sent');
select throws_ok($$select public.ocs_admin_verify_provider_subsidy_v1('00000000-0000-0000-0000-000000000001'::uuid,'TESTUTR12345')$$,'42501',null,'anon cannot verify');
reset role;
select * from finish();
rollback;
