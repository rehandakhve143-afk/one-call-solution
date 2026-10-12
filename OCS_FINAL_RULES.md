# One Call Solution — FINAL RULES (Authoritative)

Last audited: 12 Oct 2026 — wallet/payout status aligned with verified backend

This file is the source of truth for business rules. If any HTML/demo file conflicts with this file, update the HTML/demo file — do not change these rules from an older build.

## 1) Home Services — Service Provider money rules
- Platform commission: **9%** from the **first completed job**.
- New verified Service Provider gets **₹100 OCS Wallet Welcome Bonus**.
- Welcome Bonus is **wallet credit, non-withdrawable**.
- **Minimum ₹200 OCS Service Provider Wallet balance is required to receive/accept NEW jobs, including Tempo / Goods Transport.** The backend enforces this at discovery/acceptance; recharge can restore new-job eligibility after other checks pass.
- **No fixed ₹500 Company Due threshold.**
- A wallet below ₹200 (including zero or negative) places **NEW jobs on hold**. Show a recharge warning and amount needed to reach ₹200; do not cancel an already accepted/ongoing job.
- OCS Admin may also pause/temporarily block **NEW** jobs for safety or verification. Work OFF, Admin hold, unapproved skill/KYC, or an occupied Transport current trip can independently stop new matching. Recharge alone does not bypass those checks. Do **not** permanently delete/close an account for low wallet.
- Already accepted / ongoing jobs are **not cancelled** when Admin pauses new-job access.

## 2) Payments
- **Online payment is preferred/default.**
- **Cash is allowed as network/payment fallback.**
- Customer bank account details are **not mandatory** for normal booking/payment. Customer chooses supported payment method; collect bank details only when genuinely required for an exceptional refund/transfer flow.
- Service Provider bank details are **not required to create the basic SP profile**, but verified bank/payout details are **mandatory before OCS releases payout/settlement**.
- Online job accounting: OCS retains **9%** and recognizes **91%** as the Service Provider's share. **Do not debit the SP wallet again** for the same online job. Automatic bank settlement/payout through RazorpayX or another approved payout API is **not yet verified active**; showing a wallet credit or withdrawal request is not proof that money reached a bank account. Verified bank details are mandatory before releasing an actual payout.
- Cash job: after the assigned Service Provider confirms receiving cash, the applicable **9% OCS commission** is deducted from the Service Provider Wallet. Wallet may then fall below ₹200 or become negative; **the accepted job remains complete**, but new jobs remain on hold until the wallet again reaches ₹200 and other eligibility checks pass.
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
- Show **Preview → plan price + GST + expiry/validity → Razorpay payment** before publishing. After **successful server-verified payment**, the backend creates the listing as **LIVE immediately** for its purchased validity; **no routine Admin approval queue**. Payment cancelled/failed/unverified means **NOT LIVE**, with draft preserved where practical.
- Only a **server-authorized Admin FREE override** bypasses payment, and even then the backend must confirm the created LIVE record. A public plan at ₹0 without Admin FREE is **not an automatic free listing**: prevent posting until its charge is configured.
- Customer enquiries/calls go to the **specific verified LIVE listing owner**, not everyone in the category; Single Property Owner stays Call Only. Expired/paused/blocked listings are excluded from LIVE customer discovery.
- Standard customer registration is free. **Home Service Providers are a separate job/commission/verification model**, not paid business-directory posts; booking fees and SP commission rules remain distinct.
- Keep the form simple and avoid duplicate **Post** or **Enquiry** buttons within the same category screen. The owner should not need separate apps or hand-entered website/code to go LIVE.

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
