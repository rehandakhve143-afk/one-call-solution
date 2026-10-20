-- Restore booking payment ledger table from production migration 20260924051741.
-- Schema-only recovery: no payment capture, settlement, or production writes.
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  purpose text NOT NULL CHECK (purpose IN ('job','visit','secure_hold','wallet_topup')),
  method text NOT NULL CHECK (method IN ('online','cash')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','pending','authorized','paid','cash_marked','cash_confirmed','failed','cancelled','refunded','partially_refunded')),
  provider_order_id text,
  provider_payment_id text,
  provider_signature text,
  commission_rate numeric NOT NULL DEFAULT 9,
  commission_amount numeric NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS booking_payments_provider_order_uidx ON public.booking_payments(provider_order_id) WHERE provider_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS booking_payments_provider_payment_uidx ON public.booking_payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;
REVOKE ALL ON public.booking_payments FROM anon, authenticated;
