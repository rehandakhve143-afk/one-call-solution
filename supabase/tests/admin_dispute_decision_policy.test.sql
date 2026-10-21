-- Isolated policy coverage mirroring the production admin decision validations.
-- No admin decision RPC is invoked and no funds move.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(9);
CREATE FUNCTION pg_temp.valid_decision(p_outcome text,p_note text,p_refund numeric,p_provider numeric,p_collected numeric)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $policy$
 SELECT coalesce(btrim(p_outcome) IN ('refund_review','provider_payment_review','partial_settlement_review','no_payment_adjustment','further_review'),false)
 AND coalesce(length(btrim(p_note)) BETWEEN 15 AND 2000,false)
 AND coalesce(p_refund>=0 AND p_provider>=0 AND p_collected>=0 AND p_refund<=p_collected,false)
$policy$;
SELECT ok(pg_temp.valid_decision('further_review','Additional investigation required',0,0,0),'Further review permitted');
SELECT ok(pg_temp.valid_decision('refund_review','Review verified payment evidence',100,0,100),'Refund proposal within collected amount');
SELECT ok(pg_temp.valid_decision('no_payment_adjustment','No payment changes are justified',0,0,0),'No payment adjustment permitted');
SELECT ok(NOT pg_temp.valid_decision('refund_review','Review verified payment evidence',101,0,100),'Refund beyond collected amount blocked');
SELECT ok(NOT pg_temp.valid_decision('refund_review','Too short',0,0,100),'Insufficient admin reasoning blocked');
SELECT ok(NOT pg_temp.valid_decision('approve_payout','Review verified payment evidence',0,0,100),'Unrecognized payout outcome blocked');
SELECT ok(NOT pg_temp.valid_decision('refund_review','Review verified payment evidence',-1,0,100),'Negative refund blocked');
SELECT ok(NOT pg_temp.valid_decision('provider_payment_review','Review verified payment evidence',0,-1,100),'Negative provider payment blocked');
SELECT ok(NOT pg_temp.valid_decision('refund_review',NULL,0,0,100),'Missing decision note blocked');
SELECT * FROM finish();
ROLLBACK;
