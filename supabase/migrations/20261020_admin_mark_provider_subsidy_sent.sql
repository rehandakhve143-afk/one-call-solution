-- Admin-only record of externally executed transfer, never sends funds.
CREATE OR REPLACE FUNCTION public.ocs_admin_mark_provider_subsidy_sent_v1(
 p_disbursement_id uuid, p_bank_utr text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_row public.ocs_provider_subsidy_disbursements; v_utr text; v_provider uuid; v_reward numeric;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'OCS Admin only'; END IF;
 v_utr:=upper(regexp_replace(btrim(coalesce(p_bank_utr,'')),'[ -]','','g'));
 IF v_utr !~ '^[A-Z0-9]{8,35}$' THEN RAISE EXCEPTION 'Actual bank transfer UTR required'; END IF;
 SELECT * INTO v_row FROM public.ocs_provider_subsidy_disbursements WHERE id=p_disbursement_id FOR UPDATE;
 IF v_row.id IS NULL THEN RAISE EXCEPTION 'Disbursement not found'; END IF;
 IF v_row.status='sent' AND v_row.bank_utr=v_utr THEN RETURN jsonb_build_object('status','sent','already_recorded',true); END IF;
 IF v_row.status<>'pending' THEN RAISE EXCEPTION 'Transfer record cannot be overwritten'; END IF;
 SELECT provider_id INTO v_provider FROM public.bookings WHERE id=v_row.booking_id;
 IF v_provider IS DISTINCT FROM v_row.provider_id THEN RAISE EXCEPTION 'Provider mismatch'; END IF;
 SELECT coalesce(sum(amount),0) INTO v_reward FROM public.customer_booking_reward_uses
 WHERE booking_id=v_row.booking_id AND purpose=v_row.purpose AND status='applied';
 IF v_reward<=0 OR v_reward<>v_row.amount THEN RAISE EXCEPTION 'Reward mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM public.ocs_provider_subsidy_disbursements WHERE bank_utr=v_utr AND id<>v_row.id AND status IN ('sent','verified')) THEN
 RAISE EXCEPTION 'UTR already recorded'; END IF;
 UPDATE public.ocs_provider_subsidy_disbursements SET status='sent',bank_utr=v_utr,updated_at=now() WHERE id=v_row.id;
 RETURN jsonb_build_object('status','sent','verified',false);
END;
$function$;
CREATE UNIQUE INDEX IF NOT EXISTS ocs_provider_subsidy_sent_or_verified_utr_once
 ON public.ocs_provider_subsidy_disbursements(bank_utr) WHERE status IN ('sent','verified');
REVOKE ALL ON FUNCTION public.ocs_admin_mark_provider_subsidy_sent_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ocs_admin_mark_provider_subsidy_sent_v1(uuid,text) TO authenticated,service_role;
