-- OCS-funded reward subsidy disbursement audit ledger.
-- Records liabilities and independently verified bank transfers; NEVER transfers funds.
-- No automatic credits or booking completion. All operations require a separately reviewed, admin-only RPC.
CREATE TABLE IF NOT EXISTS public.ocs_provider_subsidy_disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  provider_id uuid NOT NULL REFERENCES public.provider_status(provider_id),
  purpose text NOT NULL CHECK (purpose IN ('job','visit')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','verified','failed')),
  bank_utr text,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ocs_provider_subsidy_booking_purpose_once UNIQUE (booking_id,purpose),
  CONSTRAINT ocs_provider_subsidy_verified_proof CHECK (status <> 'verified' OR (bank_utr IS NOT NULL AND verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
ALTER TABLE public.ocs_provider_subsidy_disbursements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ocs_provider_subsidy_disbursements FROM anon, authenticated;
COMMENT ON TABLE public.ocs_provider_subsidy_disbursements IS 'Audit only. A row does not transfer money or authorize completion. Verified status requires independently checked bank evidence.';
