-- OCS review-only patch: NOT applied to production.
-- Restricts new-job eligibility to manual Work ON, independent wallet/admin holds,
-- and the existing starter-bonus / post-recharge threshold policy.
-- Must be tested with production-equivalent isolated data before applying.
CREATE OR REPLACE FUNCTION public.ocs_sp_wallet_new_jobs_allowed_v1()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
 SELECT EXISTS (
   SELECT 1
   FROM public.provider_status ps
   WHERE ps.provider_id = auth.uid()
     AND coalesce(ps.available_for_work,false)
     AND NOT coalesce(ps.wallet_hold,false)
     AND NOT coalesce(ps.admin_paused,false)
     AND public.ocs_sp_work_ready_v1(ps.provider_id)
     AND (
       (
         NOT EXISTS (SELECT 1 FROM public.wallet_transactions w
                     WHERE w.provider_id=ps.provider_id AND w.kind='recharge')
         AND EXISTS (SELECT 1 FROM public.wallet_transactions w
                     WHERE w.provider_id=ps.provider_id AND w.kind='welcome_bonus')
         AND coalesce(ps.wallet_balance,0)>0
       )
       OR
       (
         EXISTS (SELECT 1 FROM public.wallet_transactions w
                 WHERE w.provider_id=ps.provider_id AND w.kind='recharge')
         AND coalesce(ps.wallet_balance,0)>=200
       )
     )
 );
$function$;
-- Do not treat this as a complete wallet migration: trigger, resume, status
-- and admin control paths must be aligned and regression-tested together.
