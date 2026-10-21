BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(4);
SELECT has_function('public','ocs_mark_visit_not_completed_v1',ARRAY['uuid','numeric','text','uuid'],'Server-only Not Completed RPC exists');
SELECT function_privs_are('public','ocs_mark_visit_not_completed_v1',ARRAY['uuid','numeric','text','uuid'],'authenticated',ARRAY[]::text[],'Customers and SP cannot directly set trusted distance');
SELECT has_column('public','bookings','visit_charge','Visit charge stored on booking');
SELECT has_column('public','bookings','work_not_completed_reason','Reason stored on booking');
SELECT * FROM finish();
ROLLBACK;
