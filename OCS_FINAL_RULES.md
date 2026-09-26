# One Call Solution — FINAL RULES (Authoritative)

Last audited: 26 Sep 2026

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

## 3) Visit charge / Start OTP / Work Not Completed
- Start OTP proves **arrival + work/inspection start only**. It is **not completion proof**.
- Visit charge slabs:
  - **1–6 km: ₹199**
  - **>6–12 km: ₹249**
- Work Not Completed must store a reason and follow the correct reason/fault flow.
- Do not apply an automatic customer visit charge for provider-side fault.
- Technical/material/price issues can be resolved mutually (reschedule with same provider, agreed visit charge, or no-charge close).
- Customer no-show / entry not provided is handled at Reached stage before Start OTP, with verified visit/distance logic.

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
