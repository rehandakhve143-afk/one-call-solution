-- Read-only preflight for the Home Services 4-digit Start OTP deployment.
-- This does NOT change production data or functions.
-- Login OTP remains controlled separately by Supabase Auth (6 digits).
SELECT
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS signature,
  position('lpad((floor(random()*900000)+100000)::int::text,6,''0'')' in pg_get_functiondef(p.oid)) > 0 AS old_six_digit_generator,
  position('lpad((floor(random()*9000)+1000)::int::text,4,''0'')' in pg_get_functiondef(p.oid)) > 0 AS new_four_digit_generator,
  position('15 minutes' in pg_get_functiondef(p.oid)) > 0 AS lockout_15_minutes_present,
  position('10 minutes' in pg_get_functiondef(p.oid)) > 0 AS expiry_10_minutes_present
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'provider_booking_action'
  AND pg_get_function_identity_arguments(p.oid) = 'p_booking_id uuid, p_action text, p_start_otp text';

-- Rollback preparation: export the full original function definition to a
-- PRIVATE local file before applying the migration. Never commit a live DB
-- dump or sensitive booking data to this repository.
-- SELECT pg_get_functiondef(p.oid) FROM pg_proc p
-- JOIN pg_namespace n ON n.oid=p.pronamespace
-- WHERE n.nspname='public' AND p.proname='provider_booking_action';

-- Deployment gate: require a verified, restorable full database backup/dump.
-- A function definition alone is NOT a database backup.
