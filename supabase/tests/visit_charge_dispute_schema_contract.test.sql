-- Guardrails for Not Completed / Visit Charge implementation.
-- Contract only: does NOT assert that refunds or visit-charge settlement are implemented.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);
SELECT has_column('public','bookings','work_not_completed_reason','Not Completed reason is stored on booking');
SELECT has_column('public','bookings','visit_charge','Visit Charge amount is stored on booking');
SELECT has_column('public','bookings','customer_completion_confirmed','Customer completion confirmation is recorded');
SELECT has_column('public','bookings','status','Booking state exists for Not Completed flow');
SELECT has_column('public','bookings','provider_id','Assigned SP is recorded');
SELECT has_column('public','booking_status_events','note','Booking status audit note exists');
SELECT has_column('public','booking_status_events','actor_id','Booking status audit actor exists');
SELECT has_column('public','booking_payments','commission_amount','Payment commission ledger column exists');
SELECT * FROM finish();
ROLLBACK;
