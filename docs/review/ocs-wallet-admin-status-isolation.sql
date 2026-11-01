-- REVIEW ONLY: Do not deploy alone. Coordinate with eligibility, commission and recharge functions.
-- Admin controls preserve three independent gates: work preference, admin hold, wallet hold.
CREATE OR REPLACE FUNCTION public.ocs_admin_sp_work_control_v1(p_provider_id uuid,p_action text,p_note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE ps public.provider_status; ns public.provider_status; a text:=lower(btrim(coalesce(p_action,'')));
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin only'; END IF;
 SELECT * INTO ps FROM public.provider_status WHERE provider_id=p_provider_id FOR UPDATE;
 IF ps.provider_id IS NULL THEN RAISE EXCEPTION 'Provider not found'; END IF;
 IF a NOT IN ('on','off','wallet_hold','release_hold') THEN RAISE EXCEPTION 'Invalid work action'; END IF;
 IF a='on' AND NOT public.ocs_sp_work_ready_v1(p_provider_id) THEN RAISE EXCEPTION 'KYC, skill and location required'; END IF;
 IF a='wallet_hold' AND coalesce(ps.wallet_balance,0)>=200 THEN RAISE EXCEPTION 'Wallet balance is not below minimum'; END IF;
 UPDATE public.provider_status SET
 available_for_work=CASE WHEN a='on' THEN true WHEN a='off' THEN false ELSE available_for_work END,
 admin_paused=CASE WHEN a='off' THEN true WHEN a='release_hold' THEN false ELSE admin_paused END,
 admin_pause_reason=CASE WHEN a='off' THEN 'manual' WHEN a='release_hold' THEN NULL ELSE admin_pause_reason END,
 wallet_hold=CASE WHEN a='wallet_hold' THEN true ELSE wallet_hold END,
 updated_at=now()
 WHERE provider_id=p_provider_id RETURNING * INTO ns;
 INSERT INTO public.ocs_sp_work_control_log(provider_id,changed_by,action,previous_work_on,new_work_on,previous_hold,new_hold,note)
 VALUES(p_provider_id,auth.uid(),a,ps.available_for_work,ns.available_for_work,ps.admin_pause_reason,ns.admin_pause_reason,left(coalesce(p_note,''),500));
 RETURN jsonb_build_object('available_for_work',ns.available_for_work,'admin_paused',ns.admin_paused,'wallet_hold',ns.wallet_hold);
END;
$function$;

-- Wallet status reports independent hold flags, never promises automatic Work ON.
CREATE OR REPLACE FUNCTION public.ocs_sp_wallet_new_job_status_v1()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE uid uuid:=auth.uid(); ps public.provider_status; s public.ocs_direct_payment_settings; due numeric:=0; bal numeric; bonus boolean; recharged boolean; wallet_ok boolean; blocked boolean; recharge_ready boolean;
BEGIN
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=uid AND role='service_provider') THEN RAISE EXCEPTION 'SP login required'; END IF;
 SELECT * INTO ps FROM public.provider_status WHERE provider_id=uid;
 IF ps.provider_id IS NULL THEN RAISE EXCEPTION 'SP wallet missing'; END IF;
 SELECT * INTO s FROM public.ocs_direct_payment_settings WHERE singleton=true;
 SELECT coalesce(due_amount,0) INTO due FROM public.ocs_provider_commission_dues WHERE provider_id=uid;
 SELECT EXISTS(SELECT 1 FROM public.wallet_transactions WHERE provider_id=uid AND kind='welcome_bonus') INTO bonus;
 SELECT EXISTS(SELECT 1 FROM public.wallet_transactions WHERE provider_id=uid AND kind='recharge') INTO recharged;
 bal:=coalesce(ps.wallet_balance,0);
 wallet_ok:=((NOT recharged AND bonus AND bal>0) OR (recharged AND bal>=200));
 blocked:=coalesce(ps.wallet_hold,false) OR NOT wallet_ok;
 recharge_ready:=coalesce(s.collections_enabled AND s.bank_verified AND s.tax_reviewed AND s.commission_terms_reviewed AND nullif(btrim(coalesce(s.business_upi_id,'')),'') IS NOT NULL,false);
 RETURN jsonb_build_object(
 'wallet_balance',bal,'welcome_bonus_policy',100,'starter_bonus_grace',bonus AND NOT recharged AND bal>0,
 'minimum_for_new_jobs',200,'need_to_recharge',CASE WHEN bonus AND NOT recharged AND bal>0 THEN 0 ELSE greatest(200-bal,0) END,
 'commission_due',due,'wallet_low',bal<200,'rule_configured',true,'rule_active',true,
 'new_jobs_wallet_blocked',blocked,'manual_admin_blocked',coalesce(ps.admin_paused,false),
 'admin_wallet_hold',false,'wallet_hold',coalesce(ps.wallet_hold,false),
 'work_on',coalesce(ps.available_for_work,false),
 'new_jobs_available',wallet_ok AND NOT blocked AND NOT coalesce(ps.admin_paused,false) AND coalesce(ps.available_for_work,false) AND public.ocs_sp_work_ready_v1(uid),
 'recharge_available',recharge_ready,'auto_unblock_after_verified_recharge',true,
 'message',CASE WHEN coalesce(ps.admin_paused,false) THEN 'Admin hold requires separate release.'
 WHEN blocked THEN 'New jobs held. Recharge wallet; accepted jobs continue.'
 WHEN NOT coalesce(ps.available_for_work,false) THEN 'Turn Work ON manually to receive new jobs.'
 ELSE 'Wallet eligible, subject to KYC and work status.' END);
END;
$function$;
