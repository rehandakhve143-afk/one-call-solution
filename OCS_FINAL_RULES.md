# One Call Solution — FINAL RULES (Authoritative)

Last audited: 14 Oct 2026 — provider-direct service payments; OCS-only paid window collections; ₹200 new-job gate OFF

This file is the source of truth for business rules. If any HTML/demo file conflicts with this file, update the HTML/demo file — do not change these rules from an older build.

## 1) Home Services — Service Provider money rules
- Platform commission: **9%** from the **first completed job**.
- New verified Service Provider gets **₹100 OCS Wallet Welcome Bonus**.
- Welcome Bonus is **wallet credit, non-withdrawable**.
- **NO compulsory advance recharge at SP joining/onboarding.** Create the SP profile, verify KYC and credit the ₹100 Welcome Bonus without demanding a recharge. During the OCS launch phase, the credited ₹100 bonus is enough to START receiving/accepting new jobs (subject to KYC, approved skill, location, Work ON and Admin safety checks); no ₹100 top-up is required for the first job. The ₹200 rule is for a later phase ONLY after OCS announces it.
- **FUTURE POLICY, NOT ACTIVE AT LAUNCH:** minimum ₹200 OCS Service Provider Wallet balance to receive/accept NEW jobs, including Driver Service and Tempo / Goods Transport, only when OCS explicitly announces and enables this phase after verified recharge works. Bank collection activation alone must NOT automatically enable the gate.** Enforce at server-side discovery AND acceptance, never in the browser alone. Do not enable wallet blocking until the approved IDBI collection/recharge flow works end-to-end; otherwise new SPs cannot top up and would be stranded.
- **Keep ₹200 as the configured minimum new-job wallet threshold for the future phase and a permanent ₹200 withdrawal reserve.** During launch, an approved SP can START work with ₹100 welcome bonus because the new-job wallet gate is OFF. When OCS later announces and enables that gate, the SP needs ₹200 available wallet balance to receive/accept new jobs.
- **SP withdrawal policy:** `withdrawable = max(wallet_balance - ₹200, 0)` from real, eligible, withdrawable funds only; the ₹100 welcome bonus and referral rewards are non-withdrawable. Examples: ₹200 balance → ₹0 withdrawable; ₹350 eligible cash balance → at most ₹150; ₹500 → at most ₹300. Verified bank/payout details are mandatory and actual automatic payout remains disabled until approved payout integration is active.
- **No fixed ₹500 Company Due threshold.**
- During launch, having ₹100 bonus in the wallet does NOT block first or subsequent new jobs; do not show low-wallet ₹200 warnings as though already active. A wallet below ₹200 (including zero or negative) places **NEW jobs on hold** ONLY once OCS explicitly enables the announced future wallet gate. In the same wallet-hold/Unblock screen, show balance, shortfall to ₹200, and an actionable **Recharge & Unblock** entry (only once a verified payment method is enabled). After the verified wallet credit brings available balance to ₹200 or more, auto-resume wallet-only hold and refresh job eligibility; do not require manual Admin approval. Until then, display the payment setup pending state and NEVER ask SPs to transfer to an unverified QR/account. Do not cancel an already accepted/ongoing job.
- Keep collecting the regular 9% commission on completed jobs even while the minimum-wallet gate is off; low wallet or commission due does not by itself suspend new work during the initial promotional phase. Keep the SP account/profile, ID/KYC history, bookings, wallet and payment history searchable by Admin even at ₹0 or negative wallet. Admin sees wallet-hold reason, failed/retried recharge, verified top-ups, automatic unblock timestamp and separate manual/safety holds.
- OCS Admin may also pause/temporarily block **NEW** jobs for safety or verification. Work OFF, Admin hold, unapproved skill/KYC, or an occupied Transport current trip can independently stop new matching. Recharge alone does not bypass those checks. Do **not** permanently delete/close an account for low wallet.
- Already accepted / ongoing jobs are **not cancelled** when Admin pauses new-job access.

## 2) Payments — CURRENT LAUNCH MODEL (NO RAZORPAY FOR SERVICE FARES)
- **Service payee:** Customer pays the assigned, identified Home Service SP, Driver, or Tempo/Transport provider DIRECTLY in Cash or to verified provider-owned UPI/bank details, after customer completion confirmation. OCS does NOT collect the service fare or promise to send 91% back. Display the actual payee before any transfer.
- **OCS payee:** Paid business-window listings, property posts, slider ads, and authorized SP wallet recharges are paid into the verified OCS company IDBI account/UPI (or another approved OCS-owned collection method); NEVER into an SP personal account. OCS business QR must NOT be the payee for provider service fares.
- **OCS commission:** Charge 9% on each verified completed provider-direct job from SP/Driver/Transport wallet/commission due ledger, once, for both Cash and provider UPI. Provider confirms actual receipt after customer marks paid. Store booking ID, channel, amount, timestamps and due/collected commission. A screenshot/UTR alone is not proof.
- **Critical no-double-payment rule:** External provider-direct UPI is NOT OCS-collected online settlement. The legacy backend online branch credits 91% into provider wallet and must never run for a fare the provider already received. Provider-direct UPI uses the direct-to-SP receipt ledger (cash method + metadata channel 'upi') or a fully audited equivalent. No second 91% payout, no second commission debit.
- **Bank details:** Provider's verified UPI/bank payee must be shown before direct digital transfer; ordinary SP onboarding bank details are optional. Customer bank details are not mandatory for bookings. Verified bank details matter for any later real company-to-provider disbursement.
- **Wallet:** Approved SPs can start with ₹100 bonus and NO compulsory recharge. Future ₹200 NEW JOB gate remains OFF until prior notice + working recharge. The separate ₹200 withdrawal reserve applies only to eligible cash-out wallet funds; Welcome/Referral Bonuses are not cash-withdrawable.
- **Paid windows:** Preview → OCS business payment instructions → independently verified bank receipt OR server-verified approved gateway payment → LIVE without routine post-content approval. If manual bank reconciliation is needed, keep the listing PENDING until verified: UTR/screenshot alone must never auto-activate. Instant auto-live requires actual instant bank confirmation integration or approved gateway.
- **No Razorpay dependency to test booking:** Customer booking, SP accept, start OTP, completion and direct-payment receipt can proceed without Route, RazorpayX, domain purchase or Play Store fees. Do not trigger unapproved real-money transfers during tests.
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
- **One Local Shop listing supports a catalogue of multiple products (initial mobile form: up to 20).** Every item may have its own product name, price, variant/model, details, and photo. No separate posting charge per product: the ₹99/28-day fee applies to the shop listing, not each item. Shop media allowance is shared across gallery/product photos (20 images plus 3 videos).
- Product cards carry direct Call / WhatsApp / Ask for Product actions tied to the exact shop listing; no OCS product cart or checkout.
- **OCS is a digital storefront/listing and direct-contact platform for shops, not an online product retailer or fulfilment marketplace.**
- Each shop owner posts their own shop, photos, product details/prices/offers from a ready-made mobile form. Payment verification activates the listing automatically (subject to moderation and validity). Owner can maintain their own listing.
- Customers view a specific LIVE shop/product listing, then contact **that exact shop owner** using Call, WhatsApp or **Ask for Product**. In-app enquiries must store the exact backend listing ID and route to its verified owner; do not use device-local category drafts as the recipient.
- The customer and the shop negotiate final price, discount, availability, payment method, and optional delivery **directly**. The shop alone decides whether to deliver.
- **No OCS shopping cart, product checkout, local-shop product-sale commission, OCS delivery service, or OCS product return/refund handling.** OCS charges only its separately posted shop listing/advertising fees.
- Display notice: "Contact the shop directly for final price, availability, payment and delivery."

### Compact Universal Enquiry Entry
- In business/category windows (including Property Builder listings), show **one small ✉ Enquiry pill at the bottom-left**, collapsed by default. Tapping expands a compact panel; it must not block the marketplace/search screen or duplicate large static enquiry cards.
- Expanded panel shows **verified LIVE listings of the current category only**. Customer selects exactly one shop/business/Builder listing; sending then uses that listing's backend UUID and owner, never category-wide broadcast or local draft contact data.
- Button wording follows category: Local Shop **Ask for Product**; Property Builder **Builder Enquiry**; Medical **Medicine Enquiry**; Lab **Test Enquiry**; trade work **Get Quote**; Vehicle **Vehicle Enquiry**. My Enquiries and Received link to the shared OCS Inbox.
- **Single Property Owner remains Call Only**, excluded from compact send-enquiry targets. Home Services retains Book Service/Get Quote; no extra generic enquiry pill there. Samples/XYZ cannot receive real enquiries.
- App Back should collapse an expanded enquiry panel before navigating away from its business window.

## 9A) Single Post Gateway
- Home keeps one common **Post Your Ad** entry for paid business/window posts.
- Flow: **Post Your Ad → Category → category-ready form → Preview → Payment / Admin FREE → LIVE**.
- After a post becomes LIVE, its public photo/poster appears automatically inside the matching category window.
- Home category window posters use current LIVE ad photos and can rotate as active ads change.
- Global search checks current LIVE post data as well as category/service aliases.
- Paused, removed or expired records must not appear in the public LIVE feed.
- Property is a special category: choosing Property from Post Your Ad opens its dedicated 3-type form directly, avoiding duplicate generic forms or duplicate payment.
- Public ad media is stored in the OCS public media bucket; billing/payment records remain separate from public listing display data.

## 9B) Ad owner & Admin controls
- Profile includes **My Ads & Listings** for the posting owner.
- Owner controls: **Edit, Pause, Resume, Renew, Remove**. Pause/Remove must update the backend record so the ad disappears from public LIVE feeds across devices.
- Admin controls on platform post records: **Pause, Resume, Block, Remove**.
- Generic Post Your Ad forms adapt labels/placeholders by category (Shop, Lab, Beauty, Vehicle, Medical, Welding, Sliding, Modular Kitchen, Hotel/Restaurant etc.) while keeping one common gateway.
- Property continues to use its dedicated 3-type ready-made form.

## 10) Property
- **Single Property – Sale / Rent: ₹199 / 28 days**.
- **Builder Property: ₹499 / 28 days**.
- **Builder Project Profile: ₹799 / 28 days**.
- Property types can include Flat, Bungalow, Row House and Land/Plot.
- Keep posting easy: details → location → price → media → contact → preview → payment → post.
- Latest property flow: successful payment + required verification → listing live for the plan validity.
- Single Property stays basic: Sale/Rent details, location, price, a few photos and **Call only** for customer contact. No Builder-style gallery, brochure, catalogue, video links, website, virtual tour, public email or extra profile options.
- Builder Property: one builder property advertisement with builder/company details, project details, photos and **Call + Chat + WhatsApp**.
- Builder Project Profile: full showcase with multiple photos/gallery, builder/company details, RERA/registration when applicable, brochure, catalogue, video/YouTube, website, virtual tour and **Call + Chat + WhatsApp + Email**.
- **One ₹799/28-day Builder Project Profile includes multiple distinct projects (current form: 1 primary + up to 19 additional = 20 total)**, not an extra paid listing per project. Each project has its own name, city/locality/address, property type, price, configuration, status, optional map/video URL and optional cover photo, and is shown as its own card within that builder profile. Projects share the same verified builder contact and backend listing owner; customer enquiries must identify the selected project in the message and route only to that builder. Existing photo limit for the combined profile gallery and additional project covers is 20 photos, plus 3 gallery videos. Do not confuse this with the separate ₹499 Builder Property ad for a single property.

## OCS Self-Service Posting — Fill in the Blanks (Launch Rule)
- Any eligible user can **join OCS with the normal email/mobile OTP login** and choose the relevant business, shop, property/Builder, medical, lab, vehicle, slider/ads, or other paid listing module. **No technical setup, admin-created profile, or developer intervention is required for ordinary self-posting.**
- Each category provides a **blank, ready-made, mobile-friendly form** with its category-specific fields. The owner supplies only their own name/business details, location, contact details, price/requirements, photos/videos and invoice email. Sample XYZ content is only for preview/test and must never be auto-assigned as the owner's data. Drafts may be saved and corrected before payment.
- Show **Preview → plan price + applicable tax + expiry/validity → Pay OCS Business Account**. Verify the money through an authorized bank statement / approved payment confirmation before making the listing LIVE without routine content approval. If bank verification is manual, listing stays PENDING until confirmed. Never accept customer screenshots/UTR as automatic proof. Preserve unpaid drafts.
- Only a **server-authorized Admin FREE override** bypasses payment, and even then the backend must confirm the created LIVE record. A public plan at ₹0 without Admin FREE is **not an automatic free listing**: prevent posting until its charge is configured.
- Customer enquiries/calls go to the **specific verified LIVE listing owner**, not everyone in the category; Single Property Owner stays Call Only. Expired/paused/blocked listings are excluded from LIVE customer discovery.
- Standard customer registration is free. **Home Service Providers are a separate job/commission/verification model**, not paid business-directory posts; booking fees and SP commission rules remain distinct.
- Keep the form simple and avoid duplicate **Post** or **Enquiry** buttons within the same category screen. The owner should not need separate apps or hand-entered website/code to go LIVE.

## 10A) GST — paid ads / business listings
- This GST rule applies to **paid OCS advertising and business/window listings**, including Slider/Banner Ads, Post Your Ad, Local Shop, Property/Builder and other paid business listings.
- Current listed plan prices are the **base price before GST**.
- Add **18% GST** to the base price at payment. Example: Local Shop ₹99 + ₹17.82 GST = **₹116.82 payable**.
- Successful paid ad/listing payment should store: base price, GST rate, GST amount, final payable amount, payment reference and GST invoice record.
- **No routine listing-content approval after verified receipt.** Server-verified OCS-owned bank or gateway receipt makes paid Slider Ad / business listing / property post LIVE for its purchased validity. Manual bank verification can delay activation; do NOT promise instant auto-live without an actual confirmation integration.
- GST invoice should show the configured OCS legal business name, GSTIN, registered address, invoice number/date, taxable value, GST rate/amount and total.
- Every paid ad/listing must collect a valid **billing/invoice email**. After successful verified payment, the GST invoice is queued/sent to that email.
- The invoice/email must clearly show the purchased **plan duration** (for example 28 Days or 6 Months), validity start date and expiry/end date.
- **All paid advertising placements** — home slider/banner, Property Owner, Builder, Local Shop, Sliding/Aluminium, Welding, Beauty, Used/New Vehicle, Medical, Diagnostic Lab, Modular Kitchen and every other paid business window — must offer **two selectable plans: 1 Month (existing 28-day billing cycle) and 6 Months (existing 6-month plan)**. Show both plan prices, selected validity, GST breakdown and payable amount before confirmation; apply the selected plan to the resulting listing and expiry date.
- Keep each category's independently configurable 1-month and 6-month prices; do not silently calculate or invent a 6-month price from the monthly rate. Keep existing admin price configuration and legacy active listing terms intact.
- Admin-created FREE posts may choose either validity with zero payment, subject to server-authorized Admin override and audit trail. No ordinary user can choose FREE.
- This is a requirement across **all posting forms**, not merely an Admin pricing table. Verify every actual post flow and server-side duration validation before marking it deployed.

- **Admin FREE override = ₹0 payment and ₹0 GST.**
- Admin can mark a specific **Slider Ad, Property post, Shop/Business window listing or other paid window post** as FREE directly while creating it; no payment step is required and it goes LIVE for the selected validity after a server-authorized override. Normal users cannot use this control.
- Admin can **create a new listing on behalf of any business or owner**, not merely waive payment on an existing submission: choose any available business window or slider placement, enter the owner/business name, contact, location, photos/video, description, start date and validity, preview, then publish with the authorized FREE override.
- Admin can subsequently edit, renew, hide/unpublish or remove its own free listings. Record creator Admin ID, beneficiary/owner, reason for free placement, timestamps, validity and all status changes in the admin audit history.
- The FREE override must be enforced server-side for an authenticated, authorized Admin; never trust a client-side free flag, zero-price plan, hidden form field or editable browser storage. No fabricated bank payment, UTR or GST receipt is required for an Admin FREE post.
- Paid self-service posting and its payment verification remain unchanged for ordinary users. **Do not mark the Admin FREE creation UI/backend as implemented until a real Admin workflow and authorization checks have been verified.**
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

## 12A) Driver Service — simple 3-role experience (13 Oct 2026)
- **Do not copy another app screen for screen:** Preserve a clean, premium OCS design. Keep the Driver service inside the same OCS login and Account navigation; do not add duplicate dashboards or new apps.
- **Customer flow:** Choose One Way/Round Trip, own-car type/transmission, pickup/drop, date/time, and duration; see the OCS-approved package price; confirm once. Prominent durations: **2, 3, 4, 6, 8, 12, 14 hours**. Optional half-hour durations remain behind **More**. Do not require manual fare entry.
- **Service Provider / Driver flow:** Driver sees only the relevant next action: Accept/Reject request → On the Way → Reached → Start Trip with customer OTP → End Trip → wait for customer approval/payment → confirm cash actually received, if applicable. Show no extra quote or wallet setup prompts during the trip.
- **Admin flow:** One Driver Rates section shows fixed, discount-friendly duration packages (including 14 hours) and explicit Save Draft / Activate; unused half-hour rows are collapsed by default. Admin sees bookings, linked support tickets, safety reports, and payouts using existing modules, not more dashboards.
- **Pricing:** Do **not** calculate a 14-hour package by multiplying the short-booking hourly rate. Package prices must be independently reviewed/approved. Suggested ₹ amounts are **examples, not launch rates**. As of 13 Oct 2026, all duration package rates in the backend remain inactive and unset.
- **Overtime:** Actual time is measured using recorded Start OTP and End Trip event server timestamps. After selected package duration, proposed extra-time fare is **₹2 per minute** with a trip-end breakdown. Customer approval is required **before** adding any extra money to the official booking; disputes use OCS support. Neither party manually edits the final price. Do not imply that merely loading a client-side fare display charges a customer.
- **Payments:** Current Driver bookings support **Cash to assigned Driver after the trip**, with confirmed receipt and **9% OCS commission** deducted on the Driver side; online payments/payouts must not be presented as active until verified with payment provider.
- **Safety:** Drivers require valid driving licence, ID/selfie and approval. Advise customers to check vehicle documents/insurance; vehicle coverage and any personal accident protection depend on actual policy terms. Provide one compact **Emergency / Accident Help** entry to open the **112 phone dialer** and separately submit a **booking-linked OCS support ticket**. Do not claim the emergency button automatically calls police, alerts OCS, tracks GPS, pays compensation, or supplies insurance. Prioritize tagged Safety reports in Admin. Full insurance, legal, live location/SOS and end-to-end emergency testing must be resolved before Driver Service launch.
- **Testing/verification:** Check both phones and Admin for acceptance, OTP, time calculation, customer overtime consent, correct commission, cash receipt and safety ticket visibility. A GitHub commit or database function is not proof that production is deployed or tested.

## 13) OCS on-platform communication, dispute evidence and privacy (12 Oct 2026)
- **Booking-linked record:** Home Services, Packers & Movers, Tempo / Goods Transport, Driver and any other OCS-managed job must link its in-app chat, Get Quote, revised quote, price/extra-work agreement, customer acceptance, start/completion confirmation, payment status, rating and support ticket to the correct immutable booking ID, actor account and server timestamp.
- **Accepted quote is authoritative:** A phone discussion, in-app message or unilateral Service Provider quote does **not** silently change the official price. A new price/add-on is enforceable within OCS only after the customer accepts the revised in-app quote; preserve quote revisions and acceptance history for disputes.
- **In-app communication stays accessible:** Keep customer/SP in-app messages and quote/booking event history retrievable to their authorized parties and, for genuine dispute/support investigations, authorized OCS Admin, including after job completion or cancellation, subject to a documented retention/deletion policy and applicable law.
- **Phone / WhatsApp limitation:** A Call or WhatsApp button does not mean OCS can hear, record, store or verify the call or an external conversation. Where technically available, save only an accurate in-app call/contact action timestamp and the linked booking/listing ID, not fictitious call duration, audio or conversation content. Ask both parties to confirm any material price, extra work or dispute resolution **inside OCS**.
- **Call recording:** Do not automatically record calls or import private WhatsApp messages. Any optional in-app recording must require clear informed participant consent, appropriate security and legally compliant handling; it is **not** part of the currently verified live flow.
- **Privacy/security:** Only the respective customer, assigned/authorized Service Provider and authorized Admin/support personnel may view private booking discussions; protect chats, sensitive photo/video attachments and member identifiers with authorization, private access, transport/storage protection and admin audit logs. Avoid displaying private phone numbers, identity scans or full chats in public listings or unrestricted search results.
- **Direct-listing exception:** Local Shop and listing-owner Call/WhatsApp contacts remain direct third-party conversations. OCS can retain an in-app enquiry tied to the exact listing owner, but cannot promise capture of their off-platform calls, sales terms or payments. Single Property Owner remains Call Only as separately specified.
- **Delivery proof:** Presence of a rule in this file does not prove the whole feature is deployed. Confirm database access policies, actual message/quote persistence, cross-device availability, retention and the currently published site before marking this feature completed.

## Temporary XYZ demo data
- Temporary test/demo content is enabled with marker `OCS_XYZ_DEMO_V1`.
- Demo appears in Slider Ad and every non-Home-Service business window for visual/search testing.
- Demo contact: mobile **9881181016**, email **rehandakhve143@gmail.com**, address **XYZ Address, Khopoli, Maharashtra**.
- Demo includes sample image, website/link, video, Call, Chat, WhatsApp and Email actions.
- Searching **XYZ** from Home opens all XYZ demo listings; searching XYZ inside a window highlights that demo card.
- Demo/test data must **not** count in real paid collections or GST collection totals.
- Remove/disable the entire XYZ demo set when the user asks to delete the examples.

## OCS intellectual property and app security (12 Oct 2026)
- Keep OCS UI clean and easy for customers, but enforce authorization, price locking, payment verification and Admin access on the server.
- The public website necessarily exposes downloaded HTML/CSS/JavaScript. Do not place payment secrets, service-role tokens, admin passwords or private database credentials in the website or a publicly readable repository.
- Current source repository was confirmed **public** on 12 Oct 2026. Plan a controlled move to private source hosting, with a verified independent production deployment first. Changing GitHub visibility may affect GitHub Pages/build availability and does not erase copies already downloaded.
- Prefer a private repository with least-privilege collaborator access, protected default branch, mandatory two-factor authentication, recovery codes and automated backup of the source and database.
- Keep confidential business operations, Admin authorization, sensitive calculations, payments, and security-critical decisions in Supabase backend / trusted server APIs. Supabase publishable/anon client keys are not equivalent to secret service-role keys.
- Apply separate private storage/row access controls for government ID, KYC images, bank details, customer/provider chats, address and booking data.
- Register and protect the One Call Solution brand, logo, domain, source ownership, contractor IP transfer agreements and use appropriate copyright notices; legal registrations require separately verified paperwork.
- Security changes must be code-reviewed and tested on the deployed Customer, Service Provider and Admin app; a successful database migration alone is not a complete launch security certification.

## Deployment note
- **Live GitHub Pages entry file: `index.html`**
- Files named old/backup/earlier final variants are references only unless explicitly promoted.

## OLX-inspired self-posting UX decision (17 Oct 2026)
- Adopt the **interaction pattern**, not OLX branding, imagery, assets or exact visual design: uncluttered two-column category chooser on mobile, clear category icons/labels, category-specific fields, and a consistently visible Next action where appropriate.
- For **Used Vehicle** listings, show conditional fields: car (brand/model, registration/manufacture year, fuel, transmission, km driven, ownership count, title, description, photos); two-wheeler (brand/model, year, km, ownership, title, description, photos). Validate required fields before moving forward; don't force car-only fields on bikes.
- For **Property** and **Local Shop**, keep their own category-specific forms; never route every category to a generic vehicle form. Preserve existing owner-specific enquiry routing, paid-listing verification and immediate publishing only after confirmed payment where applicable.
- Use clear Back/Next navigation, save draft on interruption where supported, and preserve mobile keyboard/safe-area visibility. Keep pages stable without unexpected scrolling or auto-navigation.
- **Jobs listing marketplace** (data entry, teaching, sales etc.) is a **future discussion item only**, not approved for this launch. Do not confuse recruitment ads with OCS Driver Hire booking.
- This is a product requirement/design decision, **not proof that these UI changes are implemented or live**. Prioritize production deployment and live booking verification before broad UI additions.

## Jobs & Vacancies — proposed module (17 Oct 2026)
- Add a distinct Jobs & Vacancies discovery window inspired by classified job boards, separate from Home Services booking and SP KYC.
- Employer: create vacancy with business identity, title, category, locality/city, salary range, work type, experience, openings, contact method and closing date; edit/expire/close posts.
- Job seeker: search/filter by locality, salary, category, full-time/part-time and experience; apply/contact via employer-authorized methods. Avoid publishing applicant personal information publicly.
- Safety: report/block suspicious ads; prohibit recruitment advance fees and misleading salary/identity claims; admin moderation, employer verification and complaint history.
- **Final pricing decision (17 Oct 2026): Jobs & Vacancies is FREE for both employers posting genuine vacancies and job seekers searching/applying. ₹0 listing fee, ₹0 application fee, no payment gateway or paid-plan selection in this module.** Do not reuse paid business-window pricing or require wallet recharge to post/apply.
- **No routine Admin approval for Jobs & Vacancies.** A logged-in employer who submits a complete, valid free vacancy should have it published LIVE immediately after server-side validation; no pending-approval queue or payment step. This differs from SP KYC approval.
- Admin moderation is **after publication**: review reports, hide/unpublish, remove, block fraudulent or abusive vacancies, and keep an audit trail. Automatic anti-spam/abuse safeguards may reject unsafe submissions, but ordinary legitimate vacancies must not wait for manual Admin approval.
- Employer identity and ownership must be validated server-side; do not allow arbitrary browser-side flags to mark a vacancy live. Posting remains subject to safety and content checks, not payment.
- The Jobs & Vacancies UI/backend is still proposed, not deployed; do not claim it is live until implemented and tested.

## Scalable provider, driver and transport KYC approvals (2026-10-17)

- Customer OTP sign-in and free Jobs & Vacancies postings do **not** require manual Admin approval. Paid business listings go live after confirmed payment and validation, without a separate manual listing approval.
- Service Providers, hired Drivers, and Goods Transport providers must complete identity and role-specific KYC **before** accepting real jobs. SP: identity/selfie and payout verification as required; Driver: identity, valid DL and payout details before settlement; Transport: identity, applicable DL, RC, insurance and payout details before settlement.
- **Target at scale:** integrate a reputable authorized verification provider for automated document authenticity, expiry, selfie/liveness and identity checks where legally available. Auto-approve only after a genuine server-side verified PASS and required checks; do not treat uploading a photo or matching typed numbers as verified. Until verification integration is working, retain human review; never auto-approve unverified documents.
- Only failed, mismatched, expired, duplicate, suspicious, or otherwise unresolved cases enter Admin review. Allow delegated Admin KYC reviewers with least-privilege roles, audit trails, escalation and revocation; the owner should not manually approve every applicant.
- Status model: draft → submitted → verifying → verified/approved OR needs-review/rejected; suspend or revoke on subsequent safety findings. Work ON and job acceptance must be server-side blocked unless approved. Record verification provider reference, timestamp and reviewer/action history; protect document images and personal information with restricted access and retention rules.
- Automated KYC is a **future implementation target**, not an already-connected service or a claim that current KYC is approved.


## Ready-made self-service business storefronts and slider ads — reaffirmed 2026-10-17

- OCS supplies a **ready-made self-posting digital platform** for every supported business window: Local Shop (Electrical/Hardware), Builder/Projects, Property Owner (flat rent/sale, bungalow/row house, land), Medical, Diagnostic Lab, Modular Kitchen, Sliding/Aluminium, Welding, Beauty, Used/New Vehicles and future supported listings. Owners must never need to build their own website or request manual posting by OCS.
- Each window provides a category-specific, mobile-friendly form, owner identity/contact, city/locality, descriptions, pricing where relevant, up to 20 photos and optional video/media as supported, and a ready-made public listing/profile with appropriate Call/WhatsApp/Enquiry actions routed to **that specific listing owner**. OCS local shops are lead/contact storefronts only, **not** ecommerce checkout or delivery.
- Paid plans: **1 Month (existing 28-day billing cycle)** and **6 Months** for every paid window and Slider Ads; admin-configurable category-specific base price, **18% GST** calculated/displayed clearly, total payable, receipt/invoice and validity/expiry. Do not mark paid posts live on a client-side payment-success claim: verify actual company-bank payment/UTR server-side before activating. If an applicable OCS GST-absorption policy is in effect, preserve legally correct invoice/tax treatment rather than silently omitting tax.
- **Slider Ad ready-made self-service platform**: advertiser selects ad plan, uploads banner creative and optional link/CTA, previews, pays verified total (including applicable GST), then auto-publishes to eligible slider placement without routine manual Admin approval. Apply media/link safety validation and moderation. Owner can edit/renew and view status/expiry.
- Business/Property/Slider posting flow: choose window → enter details/upload media → preview → select plan → pay if required → secure verification → immediately live; **no separate routine Admin approval**. Failed/unverified payment remains pending, not live. Free Jobs & Vacancies posts bypass payment and go live after server-side validation.
- Owner panel: My Listings / My Ads, edit, renew, expiry reminders, enquiries and status. Admin can search/audit, suspend or remove fraud/abuse; Admin's authorized FREE posting override remains restricted and audited.
- These are locked requirements. **Do not confuse requirements with verified end-to-end production implementation**; complete and test payment verification, GST invoicing, media upload, ownership checks, expiry and listing-owner enquiry routing before launch.

## Buy & Sell – Household Items (17 Oct 2026)
- First household-item ad is **FREE once per verified seller account**. From the second ad onward, **₹49 per ad for 1 month**, plus applicable GST (show full payable amount before payment). No commission on buyer-seller sale.
- Free eligibility must be enforced in the backend against the verified seller identity, not a browser counter. Deleting or expiring the first ad does not reset free eligibility. Guard against repeat-account abuse.
- Max 20 item photos; first is cover, reorder/remove; owner can edit, mark sold, delete, see My Ads, report abuse. Expiry and renewal must be server-controlled; renewal pricing must be shown before confirmation.
- Direct buyer-to-seller contact; OCS does not collect item-sale payments or provide delivery. Paid posts go live only after verified company-bank payment; first free ad can go live after identity/listing validation, with post-publication fraud moderation. No routine manual Admin approval.
- Current household-items.html is **preview UI only**, not a real backend posting or payment integration. Do not claim this is production-live.

- Household-item ad media: up to **20 photos plus 1 optional video**. Video maximum **30 seconds and 50 MB**, preview/remove before submission. Video included in the ad price (no extra fee). Client-side checks exist; repeat validation and safe file storage on the server before live publication.

- **Final household ad price (17 Oct 2026):** First ad FREE once per verified seller. From second ad, **₹49 total per ad for one month, inclusive of 18% GST** when GST applies: taxable base ₹41.53, GST ₹7.47, total ₹49. Do NOT add 18% on top of ₹49. This supersedes earlier household text saying '+ applicable GST'. Confirm invoicing and GST registration compliance before live collection.
