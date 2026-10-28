-- Start OTP is four digits; login OTP remains six digits.
-- Keep the existing authorization, expiry, attempt lockout and state guards intact.
-- PRE-DEPLOY: verify a restorable Supabase backup or PITR is available.
-- ROLLBACK: restore the exact original provider_booking_action function definition
-- captured by SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname='provider_booking_action';
-- This migration does not alter existing booking rows or login OTP.

DO $migration$
DECLARE fn oid; original text; patched text;
BEGIN
 SELECT p.oid INTO fn FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='provider_booking_action'
 AND pg_get_function_identity_arguments(p.oid)='p_booking_id uuid, p_action text, p_start_otp text';
 IF fn IS NULL THEN RAISE EXCEPTION 'provider_booking_action signature not found'; END IF;
 original:=pg_get_functiondef(fn);
 IF original LIKE '%floor(random()*9000)+1000%' AND original NOT LIKE '%floor(random()*900000)+100000%' THEN
   RAISE NOTICE 'Four-digit Start OTP already configured';
   RETURN;
 END IF;
 IF original NOT LIKE '%floor(random()*900000)+100000%' THEN
   RAISE EXCEPTION 'Unknown Start OTP generator; refusing unsafe replacement';
 END IF;
 patched:=replace(original,
   'lpad((floor(random()*900000)+100000)::int::text,6,''0'')',
   'lpad((floor(random()*9000)+1000)::int::text,4,''0'')');
 IF patched=original THEN RAISE EXCEPTION 'OTP replacement did not match'; END IF;
 EXECUTE patched;
END
$migration$;
