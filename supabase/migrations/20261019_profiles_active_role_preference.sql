-- Dashboard preference only; never an authorization claim.
-- Existing profiles.id is the authenticated user UUID.
-- Keep existing profiles.role, user_roles, and all RLS policies unchanged.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_role text;
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_role_allowed;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_role_allowed
  CHECK (active_role IS NULL OR active_role IN ('customer','sp','driver','transport'));
COMMENT ON COLUMN public.profiles.active_role IS
  'Last requested dashboard; NOT a permission or provider-category grant. Verify role and category server-side.';
