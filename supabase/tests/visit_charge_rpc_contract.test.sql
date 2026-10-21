-- Test actual read-only visit-charge RPC in isolated DB.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(7);
SELECT has_function('public','ocs_visit_charge_quote_v1',ARRAY['numeric'],'Visit charge quote RPC exists');
SELECT is(public.ocs_visit_charge_quote_v1(1),199::numeric,'1 km costs 199');
SELECT is(public.ocs_visit_charge_quote_v1(6),199::numeric,'6 km costs 199');
SELECT is(public.ocs_visit_charge_quote_v1(6.01),249::numeric,'6.01 km costs 249');
SELECT is(public.ocs_visit_charge_quote_v1(12),249::numeric,'12 km costs 249');
SELECT is(public.ocs_visit_charge_quote_v1(13),NULL::numeric,'Out of range not quoted');
SELECT is(public.ocs_visit_charge_quote_v1(NULL),NULL::numeric,'Unknown distance not quoted');
SELECT * FROM finish();
ROLLBACK;
