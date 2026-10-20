-- Safety gate: bank subsidy already sent must never be credited again to provider wallet.
CREATE OR REPLACE FUNCTION public.ocs_reward_bank_already_sent_v1(p_booking_id uuid,p_provider_id uuid,p_purpose text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT EXISTS(
 SELECT 1 FROM public.ocs_provider_subsidy_disbursements d
 WHERE d.booking_id=p_booking_id AND d.provider_id=p_provider_id
 AND d.purpose=p_purpose AND d.status IN ('sent','verified')
 );
$$;
REVOKE ALL ON FUNCTION public.ocs_reward_bank_already_sent_v1(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ocs_reward_bank_already_sent_v1(uuid,uuid,text) TO service_role;
