-- Isolated policy checks for safe dispute resolution amounts.
-- This is policy validation, NOT a claim that admin settlement RPC exists in isolated CI.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(7);
CREATE OR REPLACE FUNCTION pg_temp.refund_proposal_allowed(p_refund numeric,p_paid numeric)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $policy$
 SELECT p_refund IS NOT NULL AND p_paid IS NOT NULL AND p_refund>=0 AND p_paid>=0 AND p_refund<=p_paid
$policy$;
SELECT ok(pg_temp.refund_proposal_allowed(0,0),'Zero refund proposal allowed without collection');
SELECT ok(pg_temp.refund_proposal_allowed(100,239),'Partial refund proposal within verified collection');
SELECT ok(pg_temp.refund_proposal_allowed(239,239),'Full refund proposal capped at verified collection');
SELECT ok(NOT pg_temp.refund_proposal_allowed(240,239),'Over-collection refund proposal blocked');
SELECT ok(NOT pg_temp.refund_proposal_allowed(1,0),'No refund proposed without verified collection');
SELECT ok(NOT pg_temp.refund_proposal_allowed(-1,239),'Negative refund proposal blocked');
SELECT ok(NOT pg_temp.refund_proposal_allowed(NULL,239),'Missing amount blocked');
SELECT * FROM finish();
ROLLBACK;
