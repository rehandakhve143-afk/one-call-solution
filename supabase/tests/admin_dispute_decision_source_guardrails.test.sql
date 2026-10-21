-- Isolated source-level policy test of admin dispute decision guardrails.
-- The live RPC is not yet restored to the isolated schema; do not mistake this for an E2E test.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(6);
CREATE OR REPLACE FUNCTION pg_temp.dispute_outcome_allowed(p_outcome text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $policy$
 SELECT coalesce(p_outcome IN ('refund_review','provider_payment_review','partial_settlement_review','no_payment_adjustment','further_review'),false)
$policy$;
SELECT ok(pg_temp.dispute_outcome_allowed('refund_review'),'Refund review outcome allowed');
SELECT ok(pg_temp.dispute_outcome_allowed('no_payment_adjustment'),'No adjustment outcome allowed');
SELECT ok(pg_temp.dispute_outcome_allowed('further_review'),'Further review outcome allowed');
SELECT ok(NOT pg_temp.dispute_outcome_allowed('refund_paid'),'Paid refund outcome not allowed');
SELECT ok(NOT pg_temp.dispute_outcome_allowed('auto_transfer'),'Automatic transfer outcome not allowed');
SELECT ok(NOT pg_temp.dispute_outcome_allowed(NULL),'Null decision blocked');
SELECT * FROM finish();
ROLLBACK;
