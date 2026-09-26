# One Call Solution — FINAL RULES (Authoritative)

Last audited: 27 Sep 2026

This file is the source of truth for business rules. If any HTML/demo file conflicts with this file, update the HTML/demo file — do not change these rules from an older build.

## 1) Home Services — Service Provider money rules
- Platform commission: **9%** from the **first completed job**.
- New verified Service Provider gets **₹100 OCS Wallet Welcome Bonus**.
- Welcome Bonus is **wallet credit, non-withdrawable**.
- **No fixed ₹200 minimum wallet balance.**
- **No fixed ₹500 Company Due threshold.**
- If the provider wallet becomes zero / negative after OCS charge, the Service Provider may still receive jobs by default. Show wallet warning/email reminders.
- OCS Admin may manually pause/temporarily block new-job access when required; recharge/payment can restore access. Do **not** permanently delete/close the provider account.
- Already accepted / ongoing jobs are **not cancelled** when Admin pauses new-job access.

## 2) Payments
- **Online payment is preferred/default.**
- **Cash is allowed as network/payment fallback.**
- Customer bank account details are **not mandatory** for normal booking/payment. Customer chooses supported payment method; collect bank details only when genuinely required for an exceptional refund/transfer flow.
- Service Provider bank details are **not required to create the basic SP profile**, but verified bank/payout details are **mandatory before OCS releases payout/settlement**.
- Online settlement: OCS receives the customer payment, retains the applicable **9% commission**, and settles the remaining **91%** to the Service Provider's verified payout account. Do **not** debit the SP wallet again for the same online job.
- Cash job: customer pays the Service Provider directly; applicable **9% OCS commission** is deducted from the Service Provider OCS Wallet. Wallet may reach ₹0 or go negative; Admin warning/email and manual hold rules apply.
- Customer may switch from Cash to OCS Online / Company QR / Payment Link.

## 2A) Customer Referral Rewards / OCS Wallet
- **Share & Earn ₹50** has **no fixed referral-count limit** for genuine referrals.
- Merely sharing the link, installing the app, or creating an account does **not** earn ₹50.
- Reward is credited only after the referred **new user completes their first successful paid Home Service booking** through OCS.
- Each qualifying referral credits **₹50 to the referring Customer's OCS Wallet**.
- Customer may use the **full available OCS Wallet balance** toward an eligible OCS service payment, limited only by the payable amount. There is **no per-booking redemption cap**.
- Customer reward balance is **not cash-withdrawable**; it is for eligible OCS payments inside the platform.

## 3) Visit charge / Start Service OTP / Work Not Completed
- Start Service OTP proves **arrival + work/inspection start only**. It is **not completion proof**.
- Visit charge slabs:
  - **1–6 km: ₹199**
  - **>6–12 km: ₹249**
- Work Not Completed must store a reason and follow the correct reason/fault flow.
- Do not apply an automatic customer visit charge for provider-side fault.
- Technical/material/price issues can be resolved mutually (reschedule with same provider, agreed visit charge, or no-charge close).
- Customer no-show / entry not provided is handled at Reached stage before Start Service OTP, with verified visit/distance logic.

## 4) Provider change / reschedule
- Customer **Change Service Provider** requires reason + confirmation.
- Put booking on **HOLD + OCS Support/Admin Review**.
- **Never auto-send to SP2.**
- Reassignment only after explicit OCS/Admin review/release.
- Pause & Reschedule keeps the **same Service Provider** unless officially released/reassigned.

## 5) Provider job queue / availability
- Maximum **1 Current Working Job + 1 Next Job**.
- Only one job can be Running / On the Way at a time.
- Future/Advance bookings are separate and allowed if timings do not clash.
- Available for Work OFF = no new jobs; accepted/ongoing jobs continue.

## 6) Registration / verification
- Customer: mobile number + email required; mobile OTP verification + email verification.
- Service Provider: mobile + email, profile, KYC, service area/radius, bank/payment details, verification.
- One Service Provider registration can select **multiple skills**.
- OCS verifies skills individually; jobs go only for approved/matching skills.
- Certificate/license and work photos/videos are optional where not legally required; phone/video/basic skill verification may be used.
- Service Provider activation is separate from paid business listings and requires verification/approval.

## 7) Home Service categories
Current Home Service categories include:
Electrical, Plumber, Carpenter, AC Service, Appliance Repair, Cleaning, Maid Service, Pest Control, CCTV, Gas Stove, Wi-Fi / TV Setup, Packers & Movers, Painter, Tiles / Stone, Waterproofing, False Ceiling / POP / Gypsum / PVC.

Provider registration also supports Cook / Cooking, Housekeeping / Home Helper and Other Home Service skills.

### Appliance Repair scope
Keep only:
- Washing Machine
- Refrigerator
- Chimney
- RO / Water Purifier

Do not re-add Microwave, TV Repair, Geyser, Air Cooler, Mixer/Grinder/Juicer or Induction into Appliance Repair. AC stays separate.

## 8) Home Service rate cards
Use the finalized OCS rate-card data. Do not replace fixed listed labour rates with a generic Get Quote flow.
- Fixed listed work = official listed rate.
- Get Quote work = provider sends in-app quote; customer accepts; accepted amount becomes official.
- Multiple items + quantities must be supported.
- Material/parts are separate wherever the rate card says labour-only.
- Do not restore old demo values such as **₹539** as a general service amount.

## 9) Local Shop
- Allowed shop categories: **Electrical Shop** and **Hardware Shop only**.
- Plan: **₹99 / 28 days**.
- Storefront: banner/logo/name/category/area/open status, Call, WhatsApp, Directions, Share, product search, gallery/popular products, offers, Ask for a Product.
- Full inventory is not mandatory.

## 10) Property
- Owner Single Post: **₹199 / 28 days**.
- Builder: **₹499 / 28 days**.
- Posting types include Flat, Bungalow, Row House, Land/Plot and Builder Project.
- Keep posting easy: details → location → price → media → contact → preview → payment → post.
- Latest property flow: successful payment + required verification → listing live for the plan validity.
- Single Property stays basic; Builder gets premium profile/project/chat/enquiry features.

## 10A) GST — paid ads / business listings
- This GST rule applies to **paid OCS advertising and business/window listings**, including Slider/Banner Ads, Post Your Ad, Local Shop, Property/Builder and other paid business listings.
- Current listed plan prices are the **base price before GST**.
- Add **18% GST** to the base price at payment. Example: Local Shop ₹99 + ₹17.82 GST = **₹116.82 payable**.
- Successful paid ad/listing payment should store: base price, GST rate, GST amount, final payable amount, payment reference and GST invoice record.
- **No routine Admin approval after payment.** Successful verified payment makes the paid Slider Ad / business listing / property post LIVE automatically for its purchased validity. Admin retains moderation controls such as Pause / Block / Remove.
- GST invoice should show the configured OCS legal business name, GSTIN, registered address, invoice number/date, taxable value, GST rate/amount and total.
- Every paid ad/listing must collect a valid **billing/invoice email**. After successful verified payment, the GST invoice is queued/sent to that email.
- The invoice/email must clearly show the purchased **plan duration** (for example 28 Days or 6 Months), validity start date and expiry/end date.
- **Admin FREE override = ₹0 payment and ₹0 GST.**
- Admin can mark a specific **Slider Ad, Property post, Shop/Business window listing or other paid window post** as FREE directly while creating it; no Razorpay step is required and it goes LIVE for the selected validity. Normal users cannot use this control.
- Admin also keeps the separate named FREE override list for selected business/person cases.
- This rule does **not** add 18% to normal Customer Home Service booking prices.
- This rule does **not** change the launch Home Service Provider commission rule: OCS commission remains **9% total** under the current launch pricing decision.
- Service Provider activation/verification remains separate from paid business advertising/listing plans.
- Production GST tax invoice/collection must use the correct active OCS GST registration details.

## 11) Customer fee
- Customer registration is **free at launch**.
- Future regular-customer lifetime fee **₹49** is not active now.

## 12) Support / email
- Separate Customer Support and Service Provider Support.
- Each support request gets a ticket number; callback request supported.
- Booking/quote/revised quote/work-done/payment confirmations should go to registered Customer + Service Provider emails.

## Deployment note
- **Live GitHub Pages entry file: `index.html`**
- Files named old/backup/earlier final variants are references only unless explicitly promoted.
