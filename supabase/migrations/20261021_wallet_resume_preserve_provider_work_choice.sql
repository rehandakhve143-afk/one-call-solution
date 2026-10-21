-- Align source control with the verified production wallet-unblock correction.
-- Recharge clears a wallet hold, but never changes the provider's Work ON/OFF choice.
CREATE OR REPLACE FUNCTION public.ocs_sp_try_wallet_resume_v1(p_provider_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE ps public.provider_status; v_ready boolean;
BEGIN
 SELECT * INTO ps FROM public.provider_status WHERE provider_id=p_provider_id FOR UPDATE;
 IF ps.provider_id IS NULL OR NOT (ps.admin_paused AND ps.admin_pause_reason='wallet'
          AND ps.wallet_auto_resume AND coalesce(ps.wallet_balance,0)>=200) THEN RETURN false; END IF;
 v_ready:=public.ocs_sp_work_ready_v1(p_provider_id);
 IF NOT v_ready THEN RETURN false; END IF;
 UPDATE public.provider_status SET admin_paused=false,admin_pause_reason=null,
 wallet_auto_resume=false,updated_at=now() WHERE provider_id=p_provider_id;
 INSERT INTO public.ocs_sp_work_control_log(provider_id,changed_by,action,previous_work_on,new_work_on,previous_hold,new_hold,note)
 VALUES(p_provider_id,NULL,'wallet_auto_resume',ps.available_for_work,ps.available_for_work,ps.admin_pause_reason,NULL,'Verified wallet recharge removed wallet hold; provider Work ON/OFF preference preserved');
 INSERT INTO public.ocs_notifications(id,user_id,type,title,body)
 VALUES(nextval('public.ocs_notifications_id_seq'::regclass),p_provider_id,'wallet_resumed','OCS Wallet Hold Removed',
 'Wallet hold ended after recharge. Turn Work ON yourself to receive new jobs if currently OFF.');
 RETURN true;
END;
$function$;
