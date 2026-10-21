-- Isolated backend contract for customer completion dispute.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(3);
SELECT has_function('public','customer_dispute_completion_v2',ARRAY['uuid','text'],'Customer completion dispute RPC exists');
SELECT has_column('public','bookings','status','Booking status can record support review');
SELECT has_column('public','booking_status_events','note','Customer dispute reason can be audited');
SELECT * FROM finish();
ROLLBACK;
