-- REVIEW ONLY. NOT FOR DIRECT PRODUCTION EXECUTION.
-- Complete release requires admin-control/status/acceptance integration, restore, tests.
-- Starter bonus: positive balance before first recharge. Thereafter >= 200.
CREATE OR REPLACE FUNCTION public.ocs_wallet_commission_hold_v1()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
 IF NEW.kind='commission' AND NEW.amount<0 THEN
   UPDATE public.provider_status ps
      SET wallet_hold=true, updated_at=now()
    WHERE ps.provider_id=NEW.provider_id
      AND (
        (EXISTS(SELECT 1 FROM public.wallet_transactions wt WHERE wt.provider_id=NEW.provider_id AND wt.kind='recharge') AND coalesce(ps.wallet_balance,0)<200)
        OR
        (NOT EXISTS(SELECT 1 FROM public.wallet_transactions wt WHERE wt.provider_id=NEW.provider_id AND wt.kind='recharge') AND coalesce(ps.wallet_balance,0)<=0)
      );
 END IF;
 RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ocs_sp_try_wallet_resume_v1(p_provider_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE ps public.provider_status;
BEGIN
 SELECT * INTO ps FROM public.provider_status WHERE provider_id=p_provider_id FOR UPDATE;
 IF ps.provider_id IS NULL OR NOT coalesce(ps.wallet_hold,false) OR coalesce(ps.wallet_balance,0)<200
    OR NOT EXISTS(SELECT 1 FROM public.wallet_transactions WHERE provider_id=p_provider_id AND kind='recharge')
 THEN RETURN false; END IF;
 UPDATE public.provider_status SET wallet_hold=false, wallet_auto_resume=false, updated_at=now()
 WHERE provider_id=p_provider_id;
 INSERT INTO public.ocs_sp_work_control_log(provider_id,changed_by,action,previous_work_on,new_work_on,previous_hold,new_hold,note)
 VALUES(p_provider_id,NULL,'wallet_auto_resume',ps.available_for_work,ps.available_for_work,'wallet',NULL,'Verified recharge cleared wallet hold only; manual work and admin hold preserved');
 INSERT INTO public.ocs_notifications(id,user_id,type,title,body)
 VALUES(nextval('public.ocs_notifications_id_seq'::regclass),p_provider_id,'wallet_resumed','OCS Wallet Hold Removed',
 'Wallet hold ended after recharge. Turn Work ON yourself to receive new jobs if currently OFF.');
 RETURN true;
END;
$function$;

-- Keep manual Work OFF, admin hold, wallet hold independent.
-- Never execute these two function changes alone while old admin/status functions
-- and existing legacy wallet-pause flags remain unaligned.
