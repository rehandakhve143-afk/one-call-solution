// Regression guard: selected Get Quote category/service must reach the live RPC.
// This checks the production source, not a real authenticated booking.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const src=fs.readFileSync('home-services.html','utf8');
const start=src.indexOf('async function submitCustomRequest(){');
const end=src.indexOf('\nasync function sendInitialQuote(){',start);
assert(start>=0&&end>start,'submitCustomRequest must exist');
const fn=src.slice(start,end);
assert.match(fn,/S\.service\s*=\s*workSkill\s*;/,'Selected work name must be used');
assert.match(fn,/p_category\s*:\s*S\.category\b/,'Live quote must use selected category');
assert.match(fn,/p_service_name\s*:\s*S\.service\b/,'Live quote must use selected service');
assert.match(fn,/create_customer_quote_request_v2/,'Quote must use live backend RPC');
assert.match(fn,/if\(error\)throw error/,'Backend error must stop success');
assert.match(fn,/ocsApplyBackendBooking\(quoteRow\)/,'Validated backend booking response must be applied');
assert.match(fn,/Live quote booking ID not confirmed/,'Reject missing or demo booking IDs');
assert.match(fn,/Live quote category mismatch/,'Reject wrong category');
assert.match(fn,/Live quote service mismatch/,'Reject wrong service');
assert.doesNotMatch(fn,/Fan Fitting|Electrical.*demo|TEST-901/i,'Quote submit must not hardcode Electrical demo');
console.log('PASS: Get Quote preserves selected category/service and uses live backend RPC (static guard only)');
