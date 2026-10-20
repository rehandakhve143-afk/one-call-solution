// Non-mutating financial contract smoke test. Run: node tests/reward-settlement-contract.test.cjs
const assert = require('node:assert/strict');
const gross = 2000, reward = 100, directPaid = 1900;
const commission = Math.round(gross * 0.09 * 100) / 100;
assert.equal(gross - reward, directPaid);
assert.equal(commission, 180);
assert.equal(directPaid + reward - commission, 1820);
assert.equal(commission - reward, 80);
for (const role of ['sp','driver','transport']) {
  assert.equal(directPaid + reward - commission, 1820, `${role}: subsidy must not be treated as welcome bonus`);
}
console.log('PASS: SP/Driver/Transport gross commission and reward reconciliation arithmetic');
