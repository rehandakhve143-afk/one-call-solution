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
const modules=[['home-services.html','ocsProviderActionLive'],['driver-provider.html','startOtp'],['transport-driver.html','startTrip']];
for(const [file,fn] of modules){
 const src=read(file),start=src.indexOf('async function '+fn+'(');
 assert(start>=0,file+': missing '+fn);
 const body=src.slice(start,start+2400);
 assert(body.includes('provider_booking_action'),file+': backend OTP check missing');
 assert(body.includes('p_start_otp:otp'),file+': incorrect OTP argument');
 assert(body.includes("data?.status!=='working'") || body.includes('data?.status!=="working"'),file+': successful working status not checked');
 assert(body.includes('\\d{4}'),file+': four digit OTP validation missing');
}
console.log('PASS: provider, Home Services, Driver and Transport Start OTP static safeguards; live authenticated E2E still required');
