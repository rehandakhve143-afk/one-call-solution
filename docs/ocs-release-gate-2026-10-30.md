# OCS release gate — 30 October 2026

This is a **review-only** checklist. Do not run changes against production without an independently verified, restorable backup.

## Verified
- Supabase provider_status has a separate wallet_hold boolean.
- There are 5 provider records and currently 0 wallet_hold or legacy wallet-paused records.
- 4-digit provider Start OTP generator was updated and database definition verified.
- GitHub encrypted-backup workflow exists; a successful full restore is **not** verified.

## Release blockers
1. Execute encrypted production backup and restore it into an isolated PostgreSQL 17 database. Record artifact/run ID, restore exit code, and row-count/schema checks. Never log secrets.
2. Refactor wallet logic **together**, preserving: manual work ON/OFF, independent admin hold, wallet eligibility and starter ₹100 grace, ₹200 threshold after recharge, and accepted jobs continuing.
3. Audit every wallet-related trigger and RPC: commission debit, wallet recharge, admin control, SP acceptance, Driver/Transport eligibility. No automatic work ON after recharge.
4. Prevent duplicate 9% commission with database idempotency constraints after checking historical data.
5. Test concurrent booking acceptance, OTP expiry/lock, completion and direct cash payment, commission once, wallet hold and unblock, existing accepted jobs, and manual/admin holds.
6. Test Driver, Transport, Business Windows and Admin records; verify production deployment points at the expected build.

## Current result
Database structure check only. **Not a live end-to-end PASS.**
