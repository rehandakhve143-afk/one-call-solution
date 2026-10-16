# OCS Technical Update — 16 Oct 2026
Status: implementation specification, not deployed/tested.

## Locked rules
- SP signup requires no advance recharge. Verified SP gets one ₹100 nonwithdrawable welcome bonus.
- New-job eligibility requires at least ₹200 eligible wallet balance. Below ₹200 holds NEW jobs only; accepted jobs continue.
- Successful verified recharge automatically clears wallet hold, but never clears KYC, safety, or admin suspension.
- Commission 9%; online jobs must not deduct the same commission again from SP wallet. Cash jobs accrue commission in wallet ledger.
- One login supports Customer and SP role switching; SP selects only one service category.
- Review new labour rates toward >₹200, without silently overwriting previously approved rates.

## Technical implementation
1. Server-enforced wallet gate and atomic job acceptance; immutable transaction ledger and idempotent wallet credits.
2. Separate wallet hold, admin suspension, KYC hold, and work OFF; recharge only clears wallet hold.
3. Verify payment server-side before credit, completion or bank settlement; reconcile payouts with bank records.
4. Record booking ID, timestamps, OTP validation, approved quote revisions, payment, commission, rating and support.
5. Private KYC and bank records, role-based access, admin audit history.
6. No claim of automatic 91% bank payouts until integration and real settlement tests pass.

## Discussion pending
- Whether ₹100 promotional bonus counts toward ₹200 job gate: safer default is NO until agreed.
- Older rate-card entries at or below ₹200 require individual review.
- GST, refunds, payout timings and payment-provider integration require verification.

## Test before release
- 6-digit OTP, resend and role switch on two phones.
- SP approval, welcome bonus once, wallet hold and recharge unblock.
- Booking -> SP matching -> accept -> start OTP -> customer-approved add-on -> completion -> payment -> rating.
- 9% commission reconciliation for cash and online jobs; bank confirmation.
- Admin date-wise history and KYC privacy checks.
No feature is marked complete solely because this document was committed.