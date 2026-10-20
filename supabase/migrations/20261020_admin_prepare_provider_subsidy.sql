-- Create a subsidy payable record only for an actual applied customer reward.
-- Admin-only. This does not transfer money, credit wallet, or mark booking paid.
CREATE OR REPLACE FUNCTION public.ocs_admin_prepare_provider_subsidy_v1(
 p_booking_id uuid, p_purpose text DEFAULT 'job'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_provider uuid; v_gross numeric; v_amount numeric; v_row public.ocs_provider_subsidy_disbursements;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'OCS Admin only'; END IF;
 IF p_purpose NOT IN ('job','visit') THEN RAISE EXCEPTION 'Unsupported reward purpose'; END IF;
 SELECT provider_id,booking_amount INTO v_provider,v_gross FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF v_provider IS NULL THEN RAISE EXCEPTION 'Booking has no assigned provider'; END IF;
 SELECT coalesce(sum(amount),0) INTO v_amount FROM public.customer_booking_reward_uses
 WHERE booking_id=p_booking_id AND purpose=p_purpose AND status='applied';
 IF v_amount<=0 OR v_amount>coalesce(v_gross,0) THEN RAISE EXCEPTION 'No valid applied customer reward for this booking'; END IF;
 INSERT INTO public.ocs_provider_subsidy_disbursements(booking_id,provider_id,purpose,amount)
 VALUES(p_booking_id,v_provider,p_purpose,v_amount)
 ON CONFLICT(booking_id,purpose) DO NOTHING;
 SELECT * INTO v_row FROM public.ocs_provider_subsidy_disbursements WHERE booking_id=p_booking_id AND purpose=p_purpose;
 IF v_row.provider_id<>v_provider OR v_row.amount<>v_amount THEN RAISE EXCEPTION 'Existing subsidy does not match booking rewards'; END IF;
 RETURN jsonb_build_object('id',v_row.id,'booking_id',v_row.booking_id,'amount',v_row.amount,'status',v_row.status);
END;
$function$;
REVOKE ALL ON FUNCTION public.ocs_admin_prepare_provider_subsidy_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ocs_admin_prepare_provider_subsidy_v1(uuid,text) TO authenticated,service_role;
