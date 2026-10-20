-- Reschedule backend contract, isolated database only.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(3);
SELECT has_function('public','request_reschedule_v1',ARRAY['uuid','timestamp with time zone','text'],'Customer reschedule request RPC exists');
SELECT has_function('public','respond_reschedule_v1',ARRAY['uuid','text'],'Reschedule response RPC exists');
SELECT has_function('public','resume_rescheduled_booking_v1',ARRAY['uuid'],'Rescheduled booking resume RPC exists');
SELECT * FROM finish();
ROLLBACK;
