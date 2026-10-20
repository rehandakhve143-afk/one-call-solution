-- Restore booking fields used by the actual accept_booking_v3 RPC in isolated CI.
-- Additive and safe for existing databases; does not alter live booking records.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'fixed';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_readiness jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_id uuid;
