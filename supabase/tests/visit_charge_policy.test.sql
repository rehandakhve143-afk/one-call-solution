-- Isolated visit-charge policy regression checks.
-- Policy-only tests: do not assert that booking settlement is implemented.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(8);
CREATE OR REPLACE FUNCTION pg_temp.ocs_visit_charge_for_distance(p_km numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $policy$
 SELECT CASE WHEN p_km IS NULL OR p_km<1 OR p_km>12 THEN NULL
             WHEN p_km<=6 THEN 199::numeric
             ELSE 249::numeric END
$policy$;
SELECT is(pg_temp.ocs_visit_charge_for_distance(1),199::numeric,'1 km visit charge is 199');
SELECT is(pg_temp.ocs_visit_charge_for_distance(3),199::numeric,'3 km visit charge is 199');
SELECT is(pg_temp.ocs_visit_charge_for_distance(6),199::numeric,'6 km visit charge is 199');
SELECT is(pg_temp.ocs_visit_charge_for_distance(6.01),249::numeric,'Beyond 6 km visit charge is 249');
SELECT is(pg_temp.ocs_visit_charge_for_distance(9),249::numeric,'9 km visit charge is 249');
SELECT is(pg_temp.ocs_visit_charge_for_distance(12),249::numeric,'12 km visit charge is 249');
SELECT is(pg_temp.ocs_visit_charge_for_distance(13),NULL::numeric,'Beyond 12 km requires separate policy');
SELECT is(pg_temp.ocs_visit_charge_for_distance(NULL),NULL::numeric,'Unknown distance must not be charged automatically');
SELECT * FROM finish();
ROLLBACK;
