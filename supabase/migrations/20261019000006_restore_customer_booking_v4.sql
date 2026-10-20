CREATE OR REPLACE FUNCTION public.create_customer_booking_v4(p_category text, p_service_name text, p_booking_amount numeric, p_payment_method text, p_address text, p_selected_items jsonb DEFAULT '[]'::jsonb, p_readiness jsonb DEFAULT '{}'::jsonb, p_latitude double precision DEFAULT NULL::double precision, p_longitude double precision DEFAULT NULL::double precision)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_service_id uuid;
  v_booking public.bookings;
  v_amount numeric := greatest(coalesce(p_booking_amount,0),0);
  v_payment text := case when lower(coalesce(p_payment_method,''))='cash' then 'cash' else 'online' end;
  v_items jsonb := coalesce(p_selected_items,'[]'::jsonb);
  v_address text := nullif(btrim(coalesce(p_address,'')),'');
  v_clean_service text := btrim(coalesce(p_service_name,''));
begin
  if v_uid is null then raise exception 'Login required'; end if;

  if not exists(
    select 1 from public.user_roles
    where user_id=v_uid and role='customer'
  ) then raise exception 'Customer profile required'; end if;

  if btrim(coalesce(p_category,''))='' or v_clean_service='' then
    raise exception 'Category and service required';
  end if;
  if v_address is null or lower(v_address) in ('customer address','customer service address') then
    raise exception 'Full service address required';
  end if;
  if p_latitude is null or p_longitude is null then
    raise exception 'Customer location pin required';
  end if;
  if p_latitude < -90 or p_latitude > 90 or p_longitude < -180 or p_longitude > 180 then
    raise exception 'Invalid customer location pin';
  end if;

  if jsonb_typeof(v_items)='array' and jsonb_array_length(v_items)=1 then
    v_clean_service := coalesce(nullif(btrim(v_items->0->>'name'),''),v_clean_service);
  end if;

  select b.* into v_booking
  from public.bookings b
  where b.customer_id=v_uid
    and b.status='searching'
    and b.provider_id is null
    and b.created_at >= now() - interval '5 minutes'
    and lower(btrim(coalesce(b.category,'')))=lower(btrim(p_category))
    and lower(btrim(coalesce(b.service_name,'')))=lower(btrim(v_clean_service))
    and coalesce(b.booking_amount,0)=v_amount
    and coalesce(b.payment_method,'online')=v_payment
    and coalesce(b.address,'')=coalesce(v_address,'')
    and coalesce(b.selected_items,'[]'::jsonb)=v_items
  order by b.created_at desc
  limit 1;

  if v_booking.id is not null then
    update public.bookings
       set booking_readiness=coalesce(p_readiness,'{}'::jsonb),
           latitude=p_latitude,
           longitude=p_longitude,
           updated_at=now()
     where id=v_booking.id
     returning * into v_booking;
    return v_booking;
  end if;

  if jsonb_typeof(v_items)='array' and jsonb_array_length(v_items)=1 then
    select sc.id into v_service_id
    from public.service_catalog sc
    join public.service_categories c on c.id=sc.category_id
    where sc.active=true
      and c.active=true
      and lower(btrim(c.category_name))=lower(btrim(p_category))
      and lower(btrim(sc.service_name))=lower(btrim(v_clean_service))
    order by sc.sort_order,sc.created_at
    limit 1;
  end if;

  insert into public.bookings(
    customer_id,category,service_name,quantity,unit_price,booking_amount,
    payment_method,address,status,service_id,selected_items,
    booking_readiness,latitude,longitude
  )
  values(
    v_uid,btrim(p_category),v_clean_service,1,v_amount,v_amount,
    v_payment,v_address,'searching',v_service_id,v_items,
    coalesce(p_readiness,'{}'::jsonb),p_latitude,p_longitude
  )
  returning * into v_booking;

  insert into public.booking_status_events(booking_id,actor_id,status,note)
  values(v_booking.id,v_uid,'searching','Customer booking created');

  return v_booking;
end;
$function$
