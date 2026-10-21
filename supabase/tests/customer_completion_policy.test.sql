-- Isolated customer completion decision policy only; no live payment effects.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);
CREATE FUNCTION pg_temp.completion_next_status(p_current text,p_is_customer boolean,p_amount numeric,p_paid numeric,p_reward numeric)
RETURNS text LANGUAGE sql IMMUTABLE AS $policy$
 SELECT CASE WHEN p_current IS DISTINCT FROM 'completion_requested' OR p_is_customer IS DISTINCT FROM true THEN NULL
 WHEN coalesce(p_paid,0)+coalesce(p_reward,0)>=greatest(coalesce(p_amount,0),0) THEN 'completed'
 ELSE 'payment_pending' END
$policy$;
SELECT is(pg_temp.completion_next_status('completion_requested',true,100,100,0),'completed','Customer secured payment covered');
SELECT is(pg_temp.completion_next_status('completion_requested',true,100,50,50),'completed','Customer payment and reward covered');
SELECT is(pg_temp.completion_next_status('completion_requested',true,100,0,0),'payment_pending','Unpaid direct payment stays pending');
SELECT is(pg_temp.completion_next_status('completion_requested',true,100,50,0),'payment_pending','Partial payment stays pending');
SELECT is(pg_temp.completion_next_status('completion_requested',false,100,100,0),NULL::text,'Provider cannot confirm for customer');
SELECT is(pg_temp.completion_next_status('support_review',true,100,100,0),NULL::text,'Disputed booking cannot be auto-completed');
SELECT is(pg_temp.completion_next_status('not_completed',true,100,100,0),NULL::text,'Not completed visit cannot be auto-completed');
SELECT is(pg_temp.completion_next_status('completed',true,100,100,0),NULL::text,'Duplicate completion blocked');
SELECT * FROM finish();
ROLLBACK;
