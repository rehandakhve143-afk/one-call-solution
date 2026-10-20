-- Read-only admin list of applied rewards not yet prepared for settlement.
-- No transfer, wallet credit or financial mutation.
CREATE OR REPLACE FUNCTION public.ocs_admin_unprepared_rewards_v1(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_rows jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'OCS Admin only'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.booking_id),'[]'::jsonb) INTO v_rows
 FROM (
  SELECT r.booking_id,r.purpose,b.provider_id,
         sum(r.amount)::numeric(12,2) AS reward_amount,
         b.booking_amount AS gross_amount
  FROM public.customer_booking_reward_uses r
  JOIN public.bookings b ON b.id=r.booking_id
  WHERE r.status='applied' AND r.purpose IN ('job','visit')
    AND b.provider_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.ocs_provider_subsidy_disbursements d
      WHERE d.booking_id=r.booking_id AND d.purpose=r.purpose
    )
  GROUP BY r.booking_id,r.purpose,b.provider_id,b.booking_amount
  HAVING sum(r.amount)>0 AND sum(r.amount)<=b.booking_amount
  LIMIT least(greatest(coalesce(p_limit,50),1),100)
 ) x;
 RETURN v_rows;
END;
$function$;
REVOKE ALL ON FUNCTION public.ocs_admin_unprepared_rewards_v1(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ocs_admin_unprepared_rewards_v1(integer) TO authenticated,service_role;
