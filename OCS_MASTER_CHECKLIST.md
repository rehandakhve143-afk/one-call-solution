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


- [x] 2026-10-19: Provider receipt flow now rejects payment snapshots belonging to a different booking (`provider-dashboard.html`, commit `40fe82b1`); static regression added (commit `5b29b6e6`). GitHub Actions static payment test passed; full mobile/deploy run and live E2E still pending.

- [x] 2026-10-19: Verified Netlify production deploy `6ad5a590fb10db3a5e5e64e0` is READY and matches GitHub main commit `9f8e4a5c`; GitHub Pages workflows succeeded. This confirms deployment, NOT live booking/OTP/payment/wallet E2E.

- [ ] Final direct-payment UX requirement (2026-10-19): SP, Driver, and Transport operators use their own external UPI/banking app scanner to receive customer payment. No OCS bank-account/UPI linking is required for service fare. After actual receipt provider confirms in OCS; debit 9% from wallet. Wallet recharge and listing payments remain separate. Audit all three flows for unnecessary mandatory bank setup and legacy full-fare gateway paths; do not claim implemented until verified.

- [x] 2026-10-19: SP, Driver, Transport direct Cash/personal UPI receipt wording and optional bank-linking guidance deployed. GitHub workflow success for commit `60dfe70d`; Netlify production deploy `6ad5a80dad335933e633d5b2` READY on matching commit. This is deployment/static and mocked testing only; live financial E2E remains open.

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

- [x] 2026-10-19: Supabase Edge Function `ocs-create-razorpay-order` deployed ACTIVE v5: `kind=booking` now rejected before Razorpay order creation, preserving `wallet_topup` and `paid_post` paths. Existing paid booking verification left intact for reconciliation. **No live checkout test claimed.**
- [ ] Audit all client payment callers to ensure direct-to-provider Cash/UPI flow and no broken legacy booking checkout buttons; verify with authenticated E2E.


## Owner-approved completion execution plan — 2026-10-19
**Status vocabulary:** CODED = source exists; MOCK PASS = automated mocked test passes; DEPLOYED = published revision verified; LIVE PASS = independently verified with authorized test identities. Never collapse these statuses into "done".

### P0 — Core release blockers (do these first)
- [ ] **A. Identity/auth:** customer + provider + admin isolated test sessions; 6-digit email/mobile OTP, resend, logout, role switch; prove session separation and permissions. PASS = real authorized login/logout on separate sessions, no cross-role access.
- [ ] **B. Customer dispatch:** location persistence, exact rate card, booking, provider matching, notification, accept/reject. PASS = persisted booking reaches intended eligible provider; declined job does not become accepted.
- [ ] **C. SP execution:** Start OTP, one active + one next job, add-on quote, complete/reschedule. PASS = server-side state transitions, rejected/wrong OTP fails, audit trail remains.
- [ ] **D. Direct provider payment:** customer pays provider personally via cash/UPI; provider confirms actual receipt; OCS does not collect full fare. PASS = receipt tied to correct booking, commission 9% debited **once**, no 91% settlement credit; no live money transfer without owner authorization.
- [ ] **E. Wallet eligibility:** ₹100 nonwithdrawable welcome, no compulsory onboarding recharge; before first verified recharge allow positive bonus and negative after job, hold new jobs at zero/negative; after first verified recharge require ₹200. PASS = wallet gates for SP/Driver/Transport; accepted jobs continue; verified recharge auto-resumes wallet hold only, preserving manual/admin/KYC/safety holds.
- [ ] **F. Driver independent E2E:** hourly/package rates including 14 hours, booking/accept/OTP/complete/direct receipt/wallet. PASS = authenticated driver scenario.
- [ ] **G. Goods Transport independent E2E:** pickup/drop, vehicle, photo, quotes, customer acceptance, complete/direct receipt/wallet. PASS = authenticated transport scenario.
- [ ] **H. Admin/security:** KYC approval, searchable date-wise job/payment histories, customer/provider controls, RLS and privileged RPC review. PASS = non-admin cannot invoke admin controls or access unrelated personal data.

### P1 — Listings and customer experience
- [ ] Self-posting and immediate paid activation for each approved listing window: Property Owner/Builder, Local Shop Electrical/Hardware, Modular Kitchen, Medical/Lab, Beauty, Welding/Sliding, Used/New Vehicle, Hotel/Restaurant and Ads. PASS = listing tied to correct owner, category, expiry, renewal, enquiry routing, and privacy; no false demo content for customers.
- [ ] Mobile UI review: consistent back navigation, search, location persistence, notifications, screen stability and no duplicate dashboards. PASS = multi-device manual/mobile browser scenarios.
- [ ] Verify posting payment and bank reconciliation independently of provider job fare. PASS = actual authorized settlement evidence and audit.

### P2 — Release
- [ ] Verify custom-domain release revision vs GitHub Pages; select funded hosting, HTTPS and domain; do not spend without permission.
- [ ] Full release test matrix (Customer, SP, Driver, Transport, Admin), backup/recovery, privacy policy and support.
- [ ] Android packaging, store listing and Play Store review after live E2E and compliance gates.

### Verified evidence and current limits
- 2026-10-19 GitHub Pages deployment and workflow succeeded for commit `cc418190`; this proves **mock/static CI and deploy**, not live payments.
- 2026-10-19 demo listing renewal notifications filtered in customer UI and unread badge aligned, commit `14f8cdda`; regression guard commit `cc418190` passed CI. Existing database demo records were not deleted.
- Existing Supabase test account/test booking tables are known to exist, but an attempt to inspect designated account counts was blocked by tool safety checks. Do not bypass safety checks or claim authenticated E2E PASS.
- **Next technical action:** use explicitly authorized isolated test identities and safe credentials through supported authenticated test tooling. Without that access, continue code/static/browser-mock regression and clearly flag live test BLOCKED.

### Live login and wallet audit — 2026-10-19 (read-only)
- Five designated internal test accounts all match `auth.users`; five email-confirmed and five have prior sign-in timestamps. Zero designated accounts had an unexpired `auth.sessions.not_after > now()` session at inspection. Historical sign-in does not establish a usable current session.
- Of five provider statuses, all Work OFF; two admin-paused. All five wallet balances positive but below ₹200 (wallet bands audit). Three provider onboarding records approved, one pending.
- Two designated test providers are approved, unpaused, positive-wallet, with recorded skills, service locations, and empty current/next job slots. These are *candidates*, not confirmed live-match eligible until authenticated Work ON and actual location/category matching.
- `accept_booking_v3`, `provider_booking_action`, and `confirm_cash_received_v1` allow authenticated EXECUTE but deny anon EXECUTE; `apply_provider_commission_v1` denies both anon and authenticated direct EXECUTE. Function-text inspection finds auth.uid() checks; accept function references wallet, booking action references OTP. These are code checks only, not proof of successful authorization paths.
- No verified provider top-ups or bank credits exist. No production data, payments, sessions, wallets or bookings were modified by this audit.
- **LIVE E2E BLOCKED:** fresh Customer + Provider authenticated sessions and authorized isolated booking are needed. Never simulate success by forging JWTs, bypassing OTP or inserting fabricated financial transactions.

### Owner authorization — 2026-10-19
- Owner authorized continuing ordinary OCS development, code corrections, safe backend updates, and nonfinancial tests without repeatedly requesting approval for each small change.
- Authorization is **not** proof that live authenticated tests, real bank payments, production data edits, paid purchases, or Play Store publication are safe or completed. Seek specific confirmation where material financial/security/publication consequences arise.
- Latest GitHub Pages workflows at inspection: commit `09af1624`, both workflow and Pages deployment SUCCESS. This confirms static/mock CI only.
- Confirmed `provider-dashboard.html` checks 4-digit Start Work OTP in its frontend; cross-module and server-side OTP verification remain open.
- Next priority: audit all real login/start OTP paths and direct payment client callers, fix concrete mismatches with regression tests; then isolated authenticated E2E.

### Provider Start OTP security verification — 2026-10-19
- [x] `provider_current_booking()` masks `start_otp`, `otp_attempts`, `otp_locked_until`, and `otp_expires_at` in the provider RPC result; verified function definition in Supabase.
- [x] `provider_booking_action()` has database attempt counting, expiry, lock, assigned-provider check, and masks `start_otp` on return. NULL-aware lock-expiry expression updated at both occurrences and verified in database definition.
- [x] Provider dashboard validates a 4-digit Start OTP and checks returned booking status before treating Start as successful (source inspection).
- [ ] Authenticated isolated 5-wrong-OTP / 15-minute-lock / correct-OTP E2E still unverified; do not mark LIVE PASS.
- [ ] Audit other RPCs and customer/provider read paths for sensitive OTP fields before launch.

### Wallet risk decision — 2026-10-19 (owner-approved planning update)
- **Keep current live wallet rules unchanged:** ₹100 non-withdrawable welcome bonus, no mandatory joining recharge, positive bonus wallet permits initial new jobs, zero/negative wallet holds only NEW jobs; accepted jobs continue. After first verified recharge, ₹200 minimum for new jobs. Admin/safety holds stay independent. Customer pays provider directly; OCS charges 9% to provider wallet once per completed booking.
- **Do not implement** mandatory 9% upfront freeze/pre-deduction, automatic customer platform fees, job-value caps, credit-limit changes, or new payment collection without separate product/legal review and owner approval. These are proposed options, NOT current policy.
- **Open risk:** direct Cash/UPI means OCS cannot guarantee collection of 9% on large jobs (₹5,000–₹20,000); ₹100 bonus does not cover ₹450–₹1,800 fees. Investigate tiered risk controls and verified payment options without penalizing new providers or blocking accepted jobs.
- **Compliance gate:** have a qualified Indian payments lawyer and tax professional assess actual advance-ledger/PPI structure, GST/invoicing, customer/provider agreements, cancellation/refunds, and any regulated payment partner before financial-flow changes. Neither all advances being PPI nor a fixed Razorpay Route turnover threshold is established here.
- **Next safe verification:** audit Driver eligibility, auto-unblock after verified recharge, once-only 9% commission, and completion/receipt evidence with read-only inspection or isolated nonfinancial tests. Do not change production wallet balances or customer transactions to test.
