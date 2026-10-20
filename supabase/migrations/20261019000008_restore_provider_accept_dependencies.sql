-- Isolated CI baseline for provider acceptance dependencies; no user data seeded.
CREATE TABLE IF NOT EXISTS public.provider_service_locations (
 provider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 latitude double precision NOT NULL,
 longitude double precision NOT NULL,
 radius_km numeric NOT NULL DEFAULT 12,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.provider_onboarding (
 provider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 service_area text NOT NULL DEFAULT '',
 service_radius_km numeric NOT NULL DEFAULT 12,
 selfie_path text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'pending',
 submitted_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz,
 reviewed_by uuid,
 rejection_reason text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.provider_transport_profiles (
 provider_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 driver_name text,
 vehicle_type text NOT NULL DEFAULT '',
 vehicle_number text NOT NULL DEFAULT '',
 capacity text,
 driving_licence text,
 rc_number text,
 insurance_number text,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.provider_skills (
 provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 skill text NOT NULL,
 approved boolean NOT NULL DEFAULT false,
 category text,
 service_name text,
 verification_status text NOT NULL DEFAULT 'pending',
 enabled_by_provider boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 service_id uuid REFERENCES public.service_catalog(id),
 PRIMARY KEY(provider_id,skill)
);
-- Core migration may have created a minimal provider_skills table first.
ALTER TABLE public.provider_skills ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.provider_skills ADD COLUMN IF NOT EXISTS service_name text;
ALTER TABLE public.provider_skills ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.provider_skills ADD COLUMN IF NOT EXISTS enabled_by_provider boolean NOT NULL DEFAULT true;
ALTER TABLE public.provider_skills ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.service_catalog(id);
ALTER TABLE public.provider_service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_transport_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_skills ENABLE ROW LEVEL SECURITY;
