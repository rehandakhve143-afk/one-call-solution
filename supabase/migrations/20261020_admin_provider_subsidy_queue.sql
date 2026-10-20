-- Read-only admin inspection of OCS-funded provider subsidy disbursements.
-- Does not mark transfers as paid or move money.
CREATE OR REPLACE FUNCTION public.ocs_admin_provider_subsidy_queue_v1(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_rows jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'OCS Admin only';
  END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb)
    INTO v_rows
  FROM (
    SELECT id,booking_id,provider_id,purpose,amount,status,bank_utr,
           verified_by,verified_at,created_at,updated_at
    FROM public.ocs_provider_subsidy_disbursements
    ORDER BY created_at DESC
    LIMIT least(greatest(coalesce(p_limit,50),1),100)
  ) x;
  RETURN v_rows;
END;
$function$;
REVOKE ALL ON FUNCTION public.ocs_admin_provider_subsidy_queue_v1(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ocs_admin_provider_subsidy_queue_v1(integer) TO authenticated, service_role;
