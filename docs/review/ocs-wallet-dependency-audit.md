# OCS wallet integration: verified dependency audit (review only)

Source: live Supabase function definitions inspected 2026-11-01. No production change.

## Confirmed defects

1. `ocs_wallet_commission_hold_v1` sets `admin_paused=true` and `admin_pause_reason='wallet'` after commission deduction, conflating independent admin hold with wallet hold.
2. `ocs_admin_sp_work_control_v1` sets `available_for_work=false` on wallet hold and admin OFF, then clears `admin_paused` on ON/release. This can erase the manual Work preference and mix admin and wallet state.
3. `ocs_sp_try_wallet_resume_v1` clears `admin_paused` on verified recharge rather than only `wallet_hold`.
4. `ocs_sp_wallet_new_jobs_allowed_v1` does not explicitly check `wallet_hold`, `available_for_work`, or `ocs_sp_work_ready_v1`.
5. `ocs_sp_wallet_new_job_status_v1` still reports legacy wallet holds using `admin_pause_reason='wallet'`.

## Target invariant

`can_receive_new_jobs = work_enabled AND NOT wallet_hold AND NOT admin_hold AND KYC/skill/location_ready AND wallet_policy_eligible`.

Wallet policy: approved welcome-bonus recipient without first recharge may take new jobs while balance > 0; after first verified recharge minimum is ₹200. Existing accepted jobs must remain actionable.

## Required atomic release patch (not applied)

- Commission trigger: set only `wallet_hold`; never mutate manual Work ON/OFF or independent admin hold.
- Verified recharge/resume: clear only wallet hold after wallet policy eligibility; never enable Work automatically.
- Admin control: distinguish manual Work ON/OFF, independent admin hold, wallet hold; preserve admin hold on wallet recharge.
- New-job eligibility and status: evaluate all independent flags consistently.
- Check booking acceptance RPC and driver/transport equivalents for the same invariant.
- Test both paths (starter bonus and post-recharge), negative balance, existing accepted jobs, manual OFF, admin hold, concurrent acceptance, duplicate commission.
- Perform isolated database restore first, then release migration, regression and real multi-device test.

Do not apply the single-function SQL review patch alone: it would only partially align the system.
