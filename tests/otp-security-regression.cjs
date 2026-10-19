/* Static OTP regression: no live identities, payments, or database writes. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const provider=read('provider-dashboard.html');
assert.match(provider,/async function runProviderStep\(action\)/);
assert.match(provider,/if\(!\/\^\\d\{4\}\$\/\.test\(otp\)\)/,'Start OTP must be exactly four digits');
assert.match(provider,/sb\.rpc\('provider_booking_action'/,'Start OTP must be checked server-side');
assert.match(provider,/action==='start'&&data\?\.status!=='working'/,'Unsuccessful OTP must not advance UI');
assert.match(provider,/Too many incorrect OTP attempts/,'Locked OTP feedback required');
assert.doesNotMatch(provider,/localStorage\.(?:setItem|getItem)\(['\"](?:start_otp|otp_attempts)/,'Do not manage OTP security in browser storage');
console.log('PASS: provider Start OTP static safeguards; live authenticated E2E still required');
