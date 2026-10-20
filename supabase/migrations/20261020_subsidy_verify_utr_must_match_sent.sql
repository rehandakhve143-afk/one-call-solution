-- Admin-only verified-bank-transfer recording. No bank transfer, wallet credit, or booking completion.
CREATE OR REPLACE FUNCTION public.ocs_admin_verify_provider_subsidy_v1(
 p_disbursement_id uuid, p_bank_utr text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_row public.ocs_provider_subsidy_disbursements;
 v_provider uuid; v_reward numeric; v_utr text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'OCS Admin only'; END IF;
 v_utr := upper(regexp_replace(btrim(coalesce(p_bank_utr,'')),'[ -]','','g'));
 IF v_utr !~ '^[A-Z0-9]{8,35}$' THEN RAISE EXCEPTION 'Valid actual bank UTR required'; END IF;
 SELECT * INTO v_row FROM public.ocs_provider_subsidy_disbursements
 WHERE id=p_disbursement_id FOR UPDATE;
 IF v_row.id IS NULL THEN RAISE EXCEPTION 'Disbursement not found'; END IF;
 IF v_row.status='verified' THEN
   IF v_row.bank_utr=v_utr THEN RETURN jsonb_build_object('status','verified','already_verified',true); END IF;
   RAISE EXCEPTION 'Already verified with different UTR';
 END IF;
 IF v_row.status<>'sent' THEN RAISE EXCEPTION 'Bank transfer must be marked sent before independent verification'; END IF;
 IF v_row.bank_utr IS DISTINCT FROM v_utr THEN RAISE EXCEPTION 'Verification UTR must match recorded sent transfer'; END IF;
 SELECT provider_id INTO v_provider FROM public.bookings WHERE id=v_row.booking_id;
 IF v_provider IS NULL OR v_provider<>v_row.provider_id THEN RAISE EXCEPTION 'Booking provider mismatch'; END IF;
 SELECT coalesce(sum(amount),0) INTO v_reward FROM public.customer_booking_reward_uses
 WHERE booking_id=v_row.booking_id AND purpose=v_row.purpose AND status='applied';
 IF v_reward<=0 OR v_reward<>v_row.amount THEN RAISE EXCEPTION 'Reward amount mismatch'; END IF;
 IF EXISTS (SELECT 1 FROM public.ocs_provider_subsidy_disbursements
 WHERE bank_utr=v_utr AND id<>v_row.id AND status='verified') THEN RAISE EXCEPTION 'Bank UTR already verified'; END IF;
 UPDATE public.ocs_provider_subsidy_disbursements
 SET status='verified',bank_utr=v_utr,verified_by=auth.uid(),verified_at=now(),updated_at=now()
 WHERE id=v_row.id;
 RETURN jsonb_build_object('status','verified','booking_id',v_row.booking_id,'amount',v_row.amount);
END;
$function$;
CREATE UNIQUE INDEX IF NOT EXISTS ocs_provider_subsidy_verified_utr_once
ON public.ocs_provider_subsidy_disbursements(bank_utr) WHERE status='verified';
REVOKE ALL ON FUNCTION public.ocs_admin_verify_provider_subsidy_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ocs_admin_verify_provider_subsidy_v1(uuid,text) TO authenticated,service_role;
