BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(4);
SELECT has_function('public','ocs_mark_visit_not_completed_v1',ARRAY['uuid','numeric','text','uuid'],'Server-only Not Completed RPC exists');
SELECT has_column('public','booking_status_events','actor_id','Visit record can identify provider');
SELECT has_column('public','bookings','visit_charge','Visit charge stored on booking');
SELECT has_column('public','bookings','work_not_completed_reason','Reason stored on booking');
SELECT * FROM finish();
ROLLBACK;
