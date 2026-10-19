-- Option B: verified wallet recharge clears wallet hold only; never forces Work ON.
-- Apply to staging and verify before production rollout.
CREATE OR REPLACE FUNCTION public.ocs_sp_try_wallet_resume_v1(p_provider_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE ps public.provider_status;
BEGIN
 SELECT * INTO ps FROM public.provider_status WHERE provider_id=p_provider_id FOR UPDATE;
 IF ps.provider_id IS NULL OR NOT (
   ps.admin_paused AND ps.admin_pause_reason='wallet'
   AND ps.wallet_auto_resume AND coalesce(ps.wallet_balance,0)>=200
 ) THEN RETURN false; END IF;
 UPDATE public.provider_status
 SET admin_paused=false,admin_pause_reason=NULL,wallet_auto_resume=false,updated_at=now()
 WHERE provider_id=p_provider_id AND admin_paused=true AND admin_pause_reason='wallet';
 INSERT INTO public.ocs_sp_work_control_log
 (provider_id,changed_by,action,previous_work_on,new_work_on,previous_hold,new_hold,note)
 VALUES(p_provider_id,NULL,'wallet_hold_cleared',ps.available_for_work,ps.available_for_work,
 ps.admin_pause_reason,NULL,'Verified recharge cleared wallet hold; provider Work ON/OFF unchanged');
 INSERT INTO public.ocs_notifications(id,user_id,type,title,body)
 VALUES(nextval('public.ocs_notifications_id_seq'::regclass),p_provider_id,
 'wallet_resumed','OCS Wallet Unblocked',
 CASE WHEN coalesce(ps.available_for_work,false)
 THEN 'Wallet hold cleared. Your Work ON setting is unchanged.'
 ELSE 'Wallet hold cleared. Turn Work ON yourself when ready for new jobs.' END);
 RETURN true;
END;
$function$;
