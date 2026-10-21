-- Read-only quote of the agreed OCS visit charge slabs.
-- Does not debit wallets, create payments, or change any booking.
CREATE OR REPLACE FUNCTION public.ocs_visit_charge_quote_v1(p_distance_km numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $quote$
 SELECT CASE
  WHEN p_distance_km IS NULL OR p_distance_km<1 OR p_distance_km>12 THEN NULL::numeric
  WHEN p_distance_km<=6 THEN 199::numeric
  ELSE 249::numeric
 END
$quote$;
REVOKE ALL ON FUNCTION public.ocs_visit_charge_quote_v1(numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ocs_visit_charge_quote_v1(numeric) TO authenticated,service_role;
