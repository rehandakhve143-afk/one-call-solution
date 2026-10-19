# OCS — Master Implementation and Release Checklist
Updated: 2026-10-19. This file tracks verified evidence, not promises. Update each item only after checking code, DB or actual deployment.

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

- [x] Supabase migration `hide_private_contact_fields_in_public_listing_metadata`: public listing RPC strips email and sensitive credential/identity keys; verified 19 records returned, 0 with `email`, while all 19 retained public `phone` fields. Further nested-metadata/privacy review remains open.

- [x] Supabase migration `direct_provider_payments_wallet_commission_only`: `apply_provider_commission_v1` now only debits 9% once per booking for both cash and online/direct provider payment. Old 91% `online_settlement` wallet credit path removed. Function text verified (`online_settlement` absent). No live booking/payment test performed.

- [x] Supabase migration `block_legacy_customer_job_gateway_payment_intents`: revoked direct anon/authenticated EXECUTE on legacy `create_booking_payment_intent_v1`; privilege verification returned authenticated=false, service_role=true. **Service-role/Edge Function payment paths are not yet blocked**, and old frontend callers may now fail; migrate them to verified direct-to-provider flow before live use.

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

### E2E verification audit — 2026-10-18
- GitHub Pages latest commit `163954c8` deploy workflow and Pages build both SUCCESS.
- Live database read-only audit: bookings 2 completed, 5 searching, 16 cancelled; completed bookings without commission = 0; duplicate commission booking IDs = 0; 2 commission transactions totaling -₹90; no `online_settlement` wallet transactions.
- No verified `recharge` wallet transaction exists. Cannot claim live bank recharge -> wallet auto-resume test.
- Existing `tests/booking-smoke.cjs` and `tests/sp-wallet-bank-browser.cjs` use mocked Supabase; they do not prove real E2E. Running them in this session was blocked by inability to fetch repository files into a local runner (GitHub DNS unavailable). No test suite execution claimed.
- **BLOCKED:** authenticated Customer -> Provider real booking, OTP, payment receipt (UPI/Cash), 9% debit, wallet recharge and auto-unblock still need isolated sandbox/test identities and a verified test transaction. Do not charge real users for tests.

### Final-complete order progress — 2026-10-18
- Added `tests/direct-payment-regression.cjs` (commit `0b5d6092`), asserting direct provider payment guidance in homepage/customer pages, provider cash receipt RPC presence, driver direct receipt guidance and demo-only QR labeling.
- Wired regression into `.github/workflows/pages.yml` (commit `178da3f2`) before deployment. Workflow queued at initial inspection; do not claim pass until GitHub Actions confirms.
- Still blocked for launch: live E2E with authorized separate identities, verified bank/UPI receipt, recharge auto-unblock, production domain alignment, and Play Store release requirements. Static checks are not substitutes for these.

- [x] 2026-10-18: SP direct-payment confirmation duplicate dialog removed; static regression test added; GitHub Pages workflow `e0aa1ce5` successful. This does **not** prove production Netlify or live payment E2E.
- [ ] Verify SP/Driver/Transport wallet recharge and commission with authenticated real-flow test; frontend wallet wording must be checked against pre-recharge ₹100 bonus / post-recharge ₹200 minimum.

- [x] 2026-10-18: Transport wallet screen wording corrected: no mandatory joining recharge, ₹100 welcome bonus first, new-job hold at zero/negative, ₹200 minimum after first verified recharge. GitHub commit `743b9eab`.

### Verification update — 2026-10-19
- [x] Automated GitHub Pages tests previously passed for commit `b31dbfb0` (static/mock tests only).
- [x] Read-only Supabase audit confirmed IDBI recharge verification has admin authorization, UTR and exact amount matching, duplicate prevention, dues recovery and conditional wallet auto-resume.
- [ ] No verified bank recharge in live records as of last audit; do not claim real recharge-to-unblock PASS.
- [ ] Complete authorized customer/provider/driver/transport real-flow testing and reconcile production Netlify release before launch.

- [x] 2026-10-19: Supabase migration `ocs_admin_work_on_respects_wallet_eligibility` applied and verified: admin `on` now requires pre-recharge positive welcome-bonus wallet or post-recharge wallet >= ₹200, in addition to KYC/skill/location. No real recharge E2E performed.
