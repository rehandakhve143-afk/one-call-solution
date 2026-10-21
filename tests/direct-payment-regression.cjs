/* Static regression only: no money, login or live E2E. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
const home=read('index.html'),customer=read('customer-launch-v1.html'),services=read('customer-services.html');
const provider=read('provider-dashboard.html'),demo=read('home-services-flow.html'),driver=read('driver-service.html');
const booking=read('home-services.html');
const transport=read('transport-driver.html'),driverProvider=read('driver-provider.html');
assert.match(home,/Job payment directly assigned provider ko UPI\/Bank/);
assert.match(home,/Provider actual receipt confirm karega/);
assert.match(customer,/Direct Provider Payment/);
assert.match(services,/Direct Provider Payment/);
// Admin actions must be backed by RPCs, not static demo-only toggles.
const admin=read('admin.html'),legacyAdmin=read('OCS_ADMIN_PANEL_V1.html');
assert.match(admin,/home-services\.html\?tab=admin/);
assert.match(legacyAdmin,/home-services\.html\?tab=admin/);
assert.doesNotMatch(legacyAdmin,/function pauseJobs\(\)|function resumeJobs\(\)/);
assert.match(booking,/admin_set_provider_pause_v1/);
assert.match(booking,/admin_review_provider_onboarding_v1/);
assert.match(booking,/admin_reward_search_v1/);
assert.match(booking,/admin_platform_records_v1/);
assert.match(booking,/if\(!x\.provider_id\)/);
assert.match(booking,/This changes the real provider record/);
// Wallet and payment rules must remain separate from customer reward bank subsidy.
const rewardSql=read('supabase/migrations/20261020_coordinated_reward_settlement_lock.sql');
assert.equal((rewardSql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,2,'both settlement RPCs present');
assert.equal((rewardSql.match(/\$function\$;/g)||[]).length,2,'both SQL functions terminated');
assert.match(rewardSql,/FROM public\.bookings WHERE id=v_row\.booking_id FOR UPDATE/,'bank payout recorder locks booking');
assert.match(rewardSql,/kind='customer_reward_subsidy'/,'duplicate wallet reward guarded');
assert.match(rewardSql,/do not initiate manual bank subsidy payouts/,'bank transfer remains disabled until reservation is safe');
assert.match(provider,/confirm_cash_received_v1/);
assert.doesNotMatch(booking,/create_booking_payment_intent_v1/,'Customer must not create full-fare gateway intents');
assert.match(booking,/async function openOnline\(purpose\)\{[\s\S]*?return payCash\(purpose,"upi"\);/);
assert.match(booking,/ocs_customer_direct_to_sp_v1/);
assert.match(booking,/function applyCommission\(amount,method\)\{[\s\S]*?S\.wallet=Math\.round/);
assert.doesNotMatch(booking,/Online job settlement recorded • Provider net amount credited to Wallet/);

assert.match(provider,/personal UPI app \(PhonePe\/GPay\/Paytm\)/);
assert.match(provider,/bank link karna zaroori nahi/);
assert.match(provider,/const requestedBookingId=currentJob\.id/);
assert.match(provider,/currentJob\.id!==requestedBookingId/);
assert.match(provider,/pay\.booking_id !== requestedBookingId/);
assert.match(provider,/ocs_sp_direct_payment_snapshot_v1/);
assert.match(provider,/directInfo\.payment_id!==pay\.id/);
assert.match(provider,/Legacy cash bookings may have no direct_sp_payment metadata/);
assert.match(provider,/directError\)throw directError/);
assert.equal((provider.match(/payment sach me receive hua\?/g)||[]).length,1);
assert.doesNotMatch(provider,/Kya aapko Customer se paise WAKAI receive hue hain\?/);
assert.match(driver,/Direct Cash\/UPI payment marked/);
// Driver and Transport must never complete a job on customer assertion alone.
for(const [role,html] of [['Driver',driverProvider],['Transport',transport]]){
 assert.match(html,/confirm_cash_received_v1/,`${role}: provider receipt confirmation RPC required`);
 assert.match(html,/p_payment_id/,`${role}: payment-specific confirmation required`);
 assert.doesNotMatch(html,/create_booking_payment_intent_v1|ocs-create-razorpay-order/,`${role}: full fare gateway prohibited`);
 assert.match(html,/wallet/,`${role}: wallet guidance required`);
}
// All three provider UIs must require provider-confirmed receipt before completion.
for(const [role,html] of [['SP',provider],['Driver',driverProvider],['Transport',transport]]){
 assert.match(html,/confirm_cash_received_v1/,`${role}: receipt confirmation must be wired to backend`);
 assert.match(html,/p_payment_id/,`${role}: receipt confirmation must target a payment ID`);
}
assert.match(driverProvider,/ocs_driver_account_eligibility_v1/);
assert.match(transport,/transport_driver_dashboard_v1/);
assert.match(driverProvider,/JWT issued at future/);
assert.match(transport,/JWT issued at future/);

assert.match(transport,/joining recharge zaroori nahi/);
assert.match(transport,/₹100 welcome bonus/);
assert.match(transport,/First verified recharge ke baad new jobs ke liye ₹200/);
assert.match(driverProvider,/first recharge ke baad minimum ₹200/);
assert.doesNotMatch(driverProvider,/payout-details\.html\?from=driver/);
assert.match(driverProvider,/Cash or my own UPI app/);
assert.match(transport,/personal UPI app mein sach mein receive hua hai/);
assert.match(transport,/OCS 9% sirf wallet se ek baar deduct hota hai/);
assert.doesNotMatch(transport,/Online trip par OCS 9% retain karta hai/);
assert.doesNotMatch(transport,/payout-details\.html\?from=transport/);
assert.match(provider,/₹100 welcome bonus permits initial jobs/);
assert.match(demo,/Demo only • No real QR or payment collection/);
assert.doesNotMatch(demo,/OCS Company QR • Prototype\/Test/);
// Home notification panel and bell must use the same demo-filtered feed.
assert.match(home,/function ocsIsDemoNotification\(n\)/);
assert.match(home,/function ocsVisibleNotifications\(rows\)/);
assert.match(home,/const visible=ocsVisibleNotifications\(rows\)/);
assert.match(home,/const count=ocsVisibleNotifications\(data\)\.filter\(n=>!n\.read_at\)\.length/);
assert.match(home,/ocs_mark_notification_read_v1/);
assert.match(home,/list_notifications_v1/);
// Ensure provider receipt and server-side wallet commission stay linked.
const receiptSql=read('supabase/migrations/20261019000012_confirm_direct_cash_payment.sql');
for(const required of [
  "p.status='cash_confirmed' THEN RETURN p",
  "p.status<>'cash_marked'",
  "p.amount IS DISTINCT FROM b.booking_amount",
  "b.provider_id IS DISTINCT FROM auth.uid()",
  "public.apply_provider_commission_v1(b.id,p.amount)",
  "status='completed'"
]){
 assert(receiptSql.includes(required),'Missing receipt safeguard: '+required);
}
for(const [role,html] of [['Driver',driverProvider],['Transport',transport]]){
 assert(html.includes("s==='payment_pending'"),role+' missing pending payment state');
 assert(html.includes("s==='cash_wait'"),role+' missing receipt confirmation state');
}
console.log('PASS: direct-payment guidance and provider receipt wiring (static only; NOT live E2E)');
