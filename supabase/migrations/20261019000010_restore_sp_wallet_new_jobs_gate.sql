-- Align isolated provider status schema with production before defining wallet gate.
ALTER TABLE public.provider_status ADD COLUMN IF NOT EXISTS admin_paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.provider_status ADD COLUMN IF NOT EXISTS wallet_warning_sent_at timestamptz;
ALTER TABLE public.provider_status ADD COLUMN IF NOT EXISTS admin_pause_reason text;
ALTER TABLE public.provider_status ADD COLUMN IF NOT EXISTS wallet_auto_resume boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.ocs_sp_wallet_new_jobs_allowed_v1()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT EXISTS (
 SELECT 1 FROM public.provider_status ps
 WHERE ps.provider_id=auth.uid()
 AND NOT coalesce(ps.admin_paused,false)
 AND (
  (NOT EXISTS(SELECT 1 FROM public.wallet_transactions w WHERE w.provider_id=ps.provider_id AND w.kind='recharge')
   AND EXISTS(SELECT 1 FROM public.wallet_transactions w WHERE w.provider_id=ps.provider_id AND w.kind='welcome_bonus')
   AND coalesce(ps.wallet_balance,0)>0)
  OR
  (EXISTS(SELECT 1 FROM public.wallet_transactions w WHERE w.provider_id=ps.provider_id AND w.kind='recharge')
   AND coalesce(ps.wallet_balance,0)>=200)
 )
 ) $function$
