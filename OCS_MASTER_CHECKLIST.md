# OCS — Master Implementation and Release Checklist
Updated: 2026-10-17. This file tracks verified evidence, not promises. Update each item only after checking code, DB or actual deployment.

## Locked business decisions
- Customer pays SP/Driver/Transport directly, via their own payment arrangement; OCS does not collect the full job amount.
- OCS earns 9% per completed job, charged against provider wallet; IDBI is the intended receiving bank for verified wallet recharges and listing payments.
- Verified new provider: ₹100 nonwithdrawable welcome bonus; no compulsory upfront recharge.
- Before first verified recharge: eligible with positive bonus-backed balance; completed job can bring wallet negative. After first verified recharge: new jobs require wallet >= ₹200.
- Wallet hold blocks only **new** jobs; already accepted work continues. Recharge auto-resume must not override KYC, admin or safety holds.
- Rules apply consistently to SP, Driver and Goods Transport. Preserve audit logs and date-wise history.
- 6-digit OTP, same account role switch, mobile-first interface, and self-service paid business listings.
- Pilot geography before all-India rollout. No launch approval without genuine end-to-end testing.

## Verified technical progress
- [x] Supabase: shared SP wallet eligibility gate adjusted for first-bonus vs recharged accounts.
- [x] Supabase: IDBI recharge admin status return bug corrected.
- [x] Supabase: Driver eligibility includes wallet gate.
- [x] Supabase: Transport offer submission includes wallet gate.
- [x] Supabase: commission-trigger wallet hold respects first-recharge distinction.
- [x] GitHub: provider-dashboard.html, driver-provider.html and transport-driver.html updated to reflect server wallet eligibility.
- [x] GitHub Actions Pages deployment for commit d682e71db6193f354fe320e23cddb183c109703f succeeded on 2026-10-17 (run 39052704244). Mock booking and mobile Chromium workflow steps passed.
- [x] GitHub Pages deployed checklist commit c5f6863715d99f84fb5cce489af0abc55280ca4c successfully (GitHub Actions).
- [x] Supabase migrations `transport_wallet_eligibility_helper` and `guard_transport_quote_accept_with_provider_wallet` applied successfully. Read-only verification confirms `customer_accept_transport_offer_v1` calls `ocs_transport_provider_wallet_eligible_v1`. This is database verification, not a live customer booking test.

- [x] Supabase migration `restrict_direct_execution_of_wallet_trigger_functions`: removed anon/authenticated direct EXECUTE on welcome-credit and commission-hold trigger functions; read-only privilege checks returned false for both roles.

## Open technical and operational blockers
- [x] **Transport offer acceptance wallet guard (database)**: provider wallet is rechecked when customer accepts a quote; function verified in Supabase. Live transaction/booking behavior remains to be tested.
- [ ] **Real recharge**: verify actual IDBI bank credit/UTR before wallet credit; then test automatic wallet unblocking and notification with authorized real records. No fabricated transactions.
- [ ] **Actual end-to-end**: Customer → Provider accept → Start OTP → Complete → direct payment → 9% wallet debit → rating. Mock tests are not proof.
- [ ] **Driver and Transport end-to-end**: check each independently, including wallet holds and existing-job continuity.
- [ ] **Security**: audit RLS policies, exposed security-definer RPCs, permissions, identity/KYC access and provider/admin controls before launch.
- [ ] **Release alignment**: GitHub Pages has a verified successful deployment; Netlify production domain has previously been observed serving an older commit. Do not claim production updated without verifying the current published revision.
- [ ] **Bank account type and details**: do not repeatedly ask the owner. Retrieve previously confirmed details through approved context when genuinely necessary; never request OTP, PIN, password or complete account number in chat.

## Operating discipline
1. Inspect the existing code/DB first; do not ask the owner to repeat locked decisions.
2. Distinguish **code committed**, **DB migrated**, **deployed**, **mock tested**, and **live tested**.
3. Record every completed change with commit/migration and test evidence here.
4. Do not request repetitive screenshots or move testing between platforms without a clear verified reason.
5. Never report launch readiness until all release blockers are closed.
