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
