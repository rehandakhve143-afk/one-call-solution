// Static safeguards only: no authenticated bookings, payments or database mutations.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const receipt=read('supabase/migrations/20261019000012_confirm_direct_cash_payment.sql');
assert.match(receipt,/WHERE id=p_payment_id FOR UPDATE/,'Lock payment on receipt confirmation');
assert.match(receipt,/WHERE id=p\.booking_id FOR UPDATE/,'Lock booking before commission');
assert.match(receipt,/IF p\.status='cash_confirmed' THEN RETURN p/,'Retry must return without charging');
assert.match(receipt,/public\.apply_provider_commission_v1\(b\.id,p\.amount\)/,'Charge by booking ID');
assert.match(receipt,/p\.amount IS DISTINCT FROM b\.booking_amount/,'Reject amount mismatch');
assert.match(receipt,/p\.provider_id IS DISTINCT FROM auth\.uid\(\)/,'Require assigned provider');
for(const [role,file] of [['SP','provider-dashboard.html'],['Driver','driver-provider.html'],['Transport','transport-driver.html']]){
 const html=read(file);
 assert.match(html,/confirm_cash_received_v1/,role+' must confirm through server');
 assert.match(html,/p_payment_id/,role+' must send payment ID');
}
console.log('PASS: receipt confirmation lock and retry guards for SP/Driver/Transport (static only)');
