-- Coordinated booking-row lock on both sides of reward settlement.
-- Existing cash function locks bookings FOR UPDATE; sent recorder now locks same booking.
-- Block double reward compensation; abort payment confirmation rather than silently lose subsidy.
CREATE OR REPLACE FUNCTION public.confirm_cash_received_v1(p_payment_id uuid)
 RETURNS booking_payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  pmt public.booking_payments;
  b public.bookings;
  v_commission numeric;
  v_gross numeric:=0;
  v_reward numeric:=0;
  v_subsidy_exists boolean:=false;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into pmt from public.booking_payments where id=p_payment_id for update;
  if pmt.id is null or pmt.method<>'cash' or pmt.status<>'cash_marked' then raise exception 'cash payment not pending'; end if;

  select * into b from public.bookings where id=pmt.booking_id for update;
  if b.provider_id<>auth.uid() then raise exception 'assigned provider required'; end if;

  v_gross:=case when pmt.purpose='visit'
    then greatest(coalesce(b.visit_charge,0),0)
    else greatest(coalesce(b.booking_amount,0),0)
  end;

  select coalesce(sum(amount),0) into v_reward
  from public.customer_booking_reward_uses
  where booking_id=b.id
    and purpose=case when pmt.purpose='visit' then 'visit' else 'job' end
    and status='applied';

  -- Serialize subsidy decisions with the bank-disbursement workflow for this booking.
  PERFORM 1 FROM public.ocs_provider_subsidy_disbursements
   WHERE booking_id=b.id AND provider_id=b.provider_id
     AND purpose=case when pmt.purpose='visit' then 'visit' else 'job' end
   FOR UPDATE;

  if v_reward>0 then
    if exists (select 1 from public.ocs_provider_subsidy_disbursements d where d.booking_id=b.id and d.provider_id=b.provider_id and d.purpose=case when pmt.purpose='visit' then 'visit' else 'job' end and d.status in ('sent','verified')) then
      v_subsidy_exists:=true;
    else
      select exists(
      select 1 from public.wallet_transactions
      where provider_id=b.provider_id and booking_id=b.id and kind='customer_reward_subsidy'
    ) into v_subsidy_exists;
    end if;

    if not v_subsidy_exists then
      update public.provider_status
      set wallet_balance=round(coalesce(wallet_balance,0)+v_reward,2),updated_at=now()
      where provider_id=b.provider_id;

      insert into public.wallet_transactions(provider_id,booking_id,amount,kind)
      values(b.provider_id,b.id,v_reward,'customer_reward_subsidy');
    end if;
  end if;

  v_commission:=public.apply_provider_commission_v1(b.id,v_gross);

  update public.booking_payments
     set status='cash_confirmed',paid_at=now(),updated_at=now(),commission_amount=v_commission
   where id=pmt.id
   returning * into pmt;

  update public.bookings
     set status=case when pmt.purpose='visit' then 'cancelled_settled' else 'completed' end,
         updated_at=now()
   where id=b.id;

  update public.provider_status
     set current_booking_id=case when current_booking_id=b.id then null else current_booking_id end,
         updated_at=now()
   where provider_id=b.provider_id;

  insert into public.booking_status_events(booking_id,status,actor_id,note)
  values(b.id,case when pmt.purpose='visit' then 'cancelled_settled' else 'completed' end,auth.uid(),
    'Cash received confirmed');

  return pmt;
end;
$function$

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
 -- Always lock booking before subsidy row, matching confirm_cash_received_v1.
 SELECT booking_id INTO v_row.booking_id FROM public.ocs_provider_subsidy_disbursements WHERE id=p_disbursement_id;
 IF v_row.booking_id IS NULL THEN RAISE EXCEPTION 'Disbursement not found'; END IF;
 PERFORM 1 FROM public.bookings WHERE id=v_row.booking_id FOR UPDATE;
 SELECT * INTO v_row FROM public.ocs_provider_subsidy_disbursements WHERE id=p_disbursement_id FOR UPDATE;
 IF v_row.id IS NULL THEN RAISE EXCEPTION 'Disbursement not found'; END IF;
 IF v_row.status='sent' AND v_row.bank_utr=v_utr THEN RETURN jsonb_build_object('status','sent','already_recorded',true); END IF;
 IF v_row.status<>'pending' THEN RAISE EXCEPTION 'Transfer record cannot be overwritten'; END IF;
 SELECT provider_id INTO v_provider FROM public.bookings WHERE id=v_row.booking_id;
 IF v_provider IS DISTINCT FROM v_row.provider_id THEN RAISE EXCEPTION 'Provider mismatch'; END IF;
 SELECT coalesce(sum(amount),0) INTO v_reward FROM public.customer_booking_reward_uses
 WHERE booking_id=v_row.booking_id AND purpose=v_row.purpose AND status='applied';
 IF v_reward<=0 OR v_reward<>v_row.amount THEN RAISE EXCEPTION 'Reward mismatch'; END IF;
 IF EXISTS (SELECT 1 FROM public.wallet_transactions WHERE booking_id=v_row.booking_id AND provider_id=v_row.provider_id AND kind='customer_reward_subsidy') THEN RAISE EXCEPTION 'Reward already credited to wallet; bank transfer record blocked'; END IF;
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
