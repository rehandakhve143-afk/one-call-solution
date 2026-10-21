-- Real permission contract for the service-role-only visit record function.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(6);
SELECT has_function('public','ocs_mark_visit_not_completed_v1',ARRAY['uuid','numeric','text','uuid'],'Visit record RPC exists');
SELECT ok(NOT has_function_privilege('anon','public.ocs_mark_visit_not_completed_v1(uuid,numeric,text,uuid)','EXECUTE'),'Anonymous cannot execute visit record');
SELECT ok(NOT has_function_privilege('authenticated','public.ocs_mark_visit_not_completed_v1(uuid,numeric,text,uuid)','EXECUTE'),'Authenticated customer/SP cannot execute visit record');
SELECT ok(has_function_privilege('service_role','public.ocs_mark_visit_not_completed_v1(uuid,numeric,text,uuid)','EXECUTE'),'Only trusted service role may execute visit record');
SELECT ok(NOT has_function_privilege('anon','public.ocs_visit_charge_quote_v1(numeric)','EXECUTE'),'Anonymous cannot call quote');
SELECT ok(has_function_privilege('authenticated','public.ocs_visit_charge_quote_v1(numeric)','EXECUTE'),'Logged in users may view quote');
SELECT * FROM finish();
ROLLBACK;
