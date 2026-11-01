# OCS wallet isolation — integrated migration gate (REVIEW ONLY)

**Status:** DRAFT / NOT APPLIED TO PRODUCTION. The review SQL files already on this branch are proposals, not an executed migration.

## Verified read-only production facts (2026-11-01)
- `provider_status.wallet_hold`: BOOLEAN NOT NULL DEFAULT false.
- `ocs_wallet_commission_hold`: enabled AFTER INSERT trigger on `public.wallet_transactions`.
- `accept_booking_v3` checks `available_for_work`, `admin_paused`, then `ocs_sp_wallet_new_jobs_allowed_v1()`.
- `ocs_sp_work_ready_v1` checks approved role/onboarding/skill/location; it does not check the three independent gates.
- Existing review files: `ocs-wallet-trigger-resume-patch.sql`, `ocs-wallet-new-job-eligibility.sql`, `ocs-wallet-admin-status-isolation.sql`.

## Integration blockers before a single executable migration
1. Do not execute the independent review SQL files piecemeal. Package in one migration after schema baseline and backup/restore verification.
2. `finalize_wallet_topup_service_v1`: insert the verified recharge transaction before attempting resume; check external payment signature verification and authorization elsewhere before enabling this path.
3. `ocs_admin_verify_idbi_wallet_recharge_v1`: read `provider_status` **after** resume for response flags. Do not use the pre-recharge `v_ps` snapshot. Distinguish wallet-only blocked from overall new-job eligibility.
4. `accept_booking_v3`: check wallet hold explicitly and use independent gates. Preserve existing acceptance locks, slots, KYC and matching rules.
5. Preserve admin hold and manual Work ON/OFF through commission and recharge; never auto-enable Work.
6. Check `ocs_admin_sp_work_control_v1` semantics: admin 'off' currently also changes manual Work OFF in the review patch. This may violate flag ownership; review before apply.
7. `ocs_sp_try_wallet_resume_v1` currently requires a recorded recharge and balance >= 200. Keep verification requirement; do not clear hold on a merely edited wallet balance.
8. Confirm all callers, grants, trigger ordering, and the actual restored baseline. Test with disposable seeded provider and real UUID, not literal 'test-sp'.

## Four isolated test cases (must run, not just inspect)
- T1: Post-recharge wallet 250, commission 180, resulting wallet 70 -> wallet_hold TRUE, admin_paused FALSE, available_for_work TRUE. Use real commission path, or debit balance before inserting commission transaction; transaction INSERT alone does not debit.
- T2: Verified recharge produces balance >= 200 with wallet_hold TRUE, admin_paused TRUE, Work OFF -> wallet_hold FALSE, admin_paused TRUE, Work OFF.
- T3: Same verified recharge with admin_paused FALSE and Work OFF -> wallet_hold FALSE, Work OFF.
- T4: Authenticated approved SP with positive wallet and wallet_hold TRUE -> new-job eligibility FALSE; check auth.uid() is the seeded provider.
- Add control cases: welcome bonus grace before first recharge, no bonus/zero balance, exactly 200, duplicate commission, duplicate bank UTR, admin-only hold, pending accepted jobs unchanged, and concurrent acceptance.

## Execution status
- Local `supabase db reset`: NOT RUN (Supabase CLI and Docker are not installed in this execution environment).
- Local `supabase test db`: NOT RUN (same blocker).
- T1/T2/T3/T4: NOT RUN; do not mark PASS.
- Production database: READ-ONLY; no schema or wallet data mutated.
- Backup + restore verification: NOT VERIFIED; release gate FAIL.
- PR remains DRAFT. Do not mark Ready or merge until actual isolated tests and backup restore PASS.

## Intended local validation commands (after restoring isolated schema)
```bash
supabase db reset
supabase test db
```
Use the repository's existing local Supabase configuration and a real test harness; do not point these commands at production. Record stdout, migration SHA, test evidence and restored backup evidence in PR before merge.
