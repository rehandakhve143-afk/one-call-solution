-- Run only against a disposable restored OCS test database.
-- Transactional assertions; this script never writes provider records.
BEGIN;
DO $$
DECLARE n integer; v boolean;
BEGIN
 SELECT count(*) INTO n FROM information_schema.columns
 WHERE table_schema='public' AND table_name='provider_status'
 AND column_name IN ('wallet_hold','admin_paused','available_for_work','wallet_balance');
 IF n<>4 THEN RAISE EXCEPTION 'FAIL: wallet isolation columns missing'; END IF;

 SELECT EXISTS(
   SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
   WHERE ns.nspname='public' AND p.proname='ocs_sp_wallet_new_jobs_allowed_v1'
   AND pg_get_functiondef(p.oid) LIKE '%wallet_hold%'
   AND pg_get_functiondef(p.oid) LIKE '%available_for_work%'
 ) INTO v;
 IF NOT v THEN RAISE EXCEPTION 'FAIL: eligibility does not check wallet hold and Work ON'; END IF;

 SELECT EXISTS(
   SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
   WHERE ns.nspname='public' AND p.proname='ocs_wallet_commission_hold_v1'
   AND pg_get_functiondef(p.oid) LIKE '%wallet_hold%'
   AND pg_get_functiondef(p.oid) NOT LIKE '%SET admin_paused%'
 ) INTO v;
 IF NOT v THEN RAISE EXCEPTION 'FAIL: commission trigger still conflates wallet/admin hold'; END IF;

 SELECT EXISTS(
   SELECT 1 FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
   WHERE ns.nspname='public' AND p.proname='ocs_sp_try_wallet_resume_v1'
   AND pg_get_functiondef(p.oid) LIKE '%wallet_hold=false%'
   AND pg_get_functiondef(p.oid) NOT LIKE '%SET admin_paused=false%'
 ) INTO v;
 IF NOT v THEN RAISE EXCEPTION 'FAIL: recharge resume may clear admin hold'; END IF;
 RAISE NOTICE 'PASS: wallet isolation static schema/function assertions';
END $$;
ROLLBACK;
-- Dynamic cases still mandatory: first-job welcome bonus, 9% debit,
-- recharge, manual OFF, admin hold, accepted jobs, duplicate commission.
