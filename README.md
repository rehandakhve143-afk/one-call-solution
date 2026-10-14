# One Call Solution

**Live app entry:** `index.html`

**Authoritative business rules:** `OCS_FINAL_RULES.md`

Important:
- **Current service fare flow:** Customer pays assigned SP / Driver / Tempo provider DIRECTLY by Cash or independently verified provider-owned UPI; Provider confirms actual receipt; 9% OCS commission is charged to their wallet/due ledger. OCS does not collect service fares or remit 91%.
- **Paid windows/listings/slider ads:** Pay to verified OCS business IDBI account. Listings go LIVE only after server-verified bank receipt or approved OCS-owned gateway payment; screenshot/UTR alone is not confirmation. OCS IDBI bank collection verification is pending and does not block normal bookings.
- **No mandatory Razorpay Route, RazorpayX or service payment gateway required for provider-direct job flow.** Legacy online checkout/settlement is not the active provider-direct model.
- Home Services commission = **9%**
- SP Welcome Bonus = **₹100 OCS Wallet credit**
- **Launch:** approved SP can start and receive NEW jobs on ₹100 welcome bonus; ₹200 minimum NEW-job gate currently OFF until announced
- **₹200 withdrawal reserve** remains protected; only eligible funds above ₹200, excluding non-withdrawable bonuses/rewards, can be considered for transfer when payout API is active
- Future ₹200 minimum applies only when explicitly enabled; existing accepted jobs continue. No fixed ₹500 Company Due threshold
- Visit charge = **₹199 (1–6 km)** / **₹249 (>6–12 km)**
- Local Shop = **₹99 / 28 days**
- Property Single = **₹199 / 28 days**
- Property Builder = **₹499 / 28 days**

Files with names such as `old`, `backup`, `complete-3`, or earlier `FINAL` versions are reference/test builds unless explicitly promoted to `index.html`.

Deployment note (12 Oct 2026): Check that the public Netlify production deployment uses the newest GitHub commit before claiming changes are live. GitHub commits alone do not prove deployment. Automated RazorpayX bank payouts remain unverified/pending.
