CREATE OR REPLACE FUNCTION public.accept_booking_v3(p_booking_id uuid)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  b public.bookings;
  ps public.provider_status;
  loc public.provider_service_locations;
  v_distance numeric;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if not exists(select 1 from public.user_roles where user_id=auth.uid() and role='service_provider')
    then raise exception 'service_provider role required'; end if;
  if not exists(select 1 from public.provider_onboarding where provider_id=auth.uid() and status='approved')
    then raise exception 'OCS Admin approval required before accepting jobs'; end if;

  select * into ps from public.provider_status where provider_id=auth.uid() for update;
  if ps.provider_id is null then raise exception 'provider status missing'; end if;
  if not ps.available_for_work then raise exception 'provider unavailable'; end if;
  if ps.admin_paused then raise exception 'new jobs paused by OCS Admin'; end if;
  if not public.ocs_sp_wallet_new_jobs_allowed_v1() then raise exception 'OCS Wallet below Rs 200. New jobs paused. Recharge wallet to auto-unblock.'; end if;
  select * into b from public.bookings where id=p_booking_id for update;
  if b.id is null or b.status<>'searching' or b.provider_id is not null then
    raise exception 'booking no longer available';
  end if;
  if b.customer_id=auth.uid() then raise exception 'service provider cannot accept own customer booking'; end if;
  if b.request_type='quote' and nullif(b.booking_readiness->>'preferred_provider_id','') is not null and b.booking_readiness->>'preferred_provider_id'<>auth.uid()::text then raise exception 'Request reserved for another SP'; end if;

  if lower(btrim(coalesce(b.category,'')))='tempo / goods transport' then
    if ps.current_booking_id is not null then
      raise exception 'Transport vehicle is Busy on current trip';
    end if;
    if not exists (
      select 1 from public.provider_transport_profiles tp
      where tp.provider_id=auth.uid()
        and tp.active=true
        and btrim(coalesce(tp.driving_licence,''))<>''
        and btrim(coalesce(tp.rc_number,''))<>''
        and btrim(coalesce(tp.insurance_number,''))<>''
        and lower(btrim(tp.vehicle_type))=
            lower(btrim(coalesce(b.booking_readiness->>'vehicle_type','')))
    ) then
      raise exception 'Transport request does not match your verified vehicle/KYC';
    end if;
  end if;

  select * into loc from public.provider_service_locations where provider_id=auth.uid();
  if loc.provider_id is null or loc.latitude is null or loc.longitude is null or coalesce(loc.radius_km,0)<=0 then
    raise exception 'SP service location pin required before accepting a new job';
  end if;
  if b.latitude is null or b.longitude is null then
    raise exception 'Customer location pin missing';
  end if;
  if b.latitude is not null and b.longitude is not null and loc.provider_id is not null then
    v_distance := round((
      6371 * acos(
        least(1,greatest(-1,
          cos(radians(b.latitude))*cos(radians(loc.latitude))*
          cos(radians(loc.longitude)-radians(b.longitude))+
          sin(radians(b.latitude))*sin(radians(loc.latitude))
        ))
      )
    )::numeric,1);
    if v_distance>coalesce(loc.radius_km,12) then raise exception 'booking is outside provider service radius'; end if;
  end if;

  if coalesce(b.request_type,'fixed')='quote' then
    if not exists (
      select 1 from public.provider_skills s
      where s.provider_id=auth.uid()
        and s.approved=true and s.verification_status='approved' and s.enabled_by_provider=true
        and lower(btrim(coalesce(s.category,'')))=lower(btrim(coalesce(b.category,'')))
        and (
          lower(btrim(coalesce(b.category,'')))<>'custom / other'
          or lower(btrim(coalesce(s.service_name,'')))=lower(btrim(coalesce(b.service_name,'')))
        )
    ) then raise exception 'requested work not approved for provider'; end if;
  elsif jsonb_typeof(coalesce(b.selected_items,'[]'::jsonb))='array'
        and jsonb_array_length(coalesce(b.selected_items,'[]'::jsonb))>0 then
    if exists (
      select 1 from jsonb_array_elements(coalesce(b.selected_items,'[]'::jsonb)) item
      where not exists (
        select 1 from public.provider_skills s
        where s.provider_id=auth.uid()
          and s.approved=true and s.verification_status='approved' and s.enabled_by_provider=true
          and lower(btrim(coalesce(s.category,'')))=lower(btrim(coalesce(b.category,'')))
          and lower(btrim(coalesce(s.service_name,'')))=lower(btrim(coalesce(item->>'name','')))
      )
    ) then raise exception 'all requested services are not approved for provider'; end if;
  else
    if not exists (
      select 1 from public.provider_skills s
      where s.provider_id=auth.uid()
        and s.approved=true and s.verification_status='approved' and s.enabled_by_provider=true
        and lower(btrim(coalesce(s.category,'')))=lower(btrim(coalesce(b.category,'')))
        and (
          (b.service_id is not null and s.service_id=b.service_id)
          or (
            b.service_id is null
            and lower(btrim(coalesce(s.service_name,'')))=lower(btrim(coalesce(b.service_name,'')))
          )
        )
    ) then raise exception 'service not approved for provider'; end if;
  end if;

  if b.request_type='quote' AND lower(btrim(coalesce(b.category,'')))<>'tempo / goods transport' then
    update public.bookings set provider_id=auth.uid(),status='discussion',updated_at=now() where id=b.id returning * into b;
    insert into public.booking_status_events(booking_id,status,actor_id,note) values(b.id,'discussion',auth.uid(),'SP joined quote discussion; work slot free');
    return b;
  end if;
  if ps.current_booking_id is null then
    update public.provider_status set current_booking_id=b.id,updated_at=now() where provider_id=auth.uid();
    update public.bookings set provider_id=auth.uid(),status='accepted',updated_at=now()
     where id=b.id returning * into b;
  elsif ps.next_booking_id is null and b.request_type<>'quote' then
    update public.provider_status set next_booking_id=b.id,updated_at=now() where provider_id=auth.uid();
    update public.bookings set next_provider_id=auth.uid(),status='next_accepted',updated_at=now()
     where id=b.id returning * into b;
  else
    raise exception 'current and next slots full';
  end if;

  insert into public.booking_status_events(booking_id,status,actor_id,note)
  values(b.id,b.status,auth.uid(),
    case when b.request_type='quote' then 'Provider accepted Get Quote request'
         else 'Provider accepted booking' end);
  return b;
end;
$function$
