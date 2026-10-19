// Static guard only. Does not test production DB, money or authenticated roles.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const sql=fs.readFileSync('supabase/migrations/20261019_wallet_unblock_preserve_work_choice.sql','utf8');
assert.match(sql,/CREATE OR REPLACE FUNCTION public\.ocs_sp_try_wallet_resume_v1/i);
assert.match(sql,/ps\.admin_pause_reason='wallet'/);
assert.match(sql,/ps\.wallet_auto_resume/);
assert.match(sql,/ps\.wallet_balance,0\)>=200/);
assert.match(sql,/SET admin_paused=false,admin_pause_reason=NULL,wallet_auto_resume=false/);
assert.doesNotMatch(sql,/SET[^;]*available_for_work\s*=/i,'Wallet unblock must not change provider Work ON/OFF');
assert.match(sql,/ps\.available_for_work,ps\.available_for_work/,'Work state log must preserve previous state');
assert.match(sql,/Turn Work ON yourself/);
console.log('PASS: wallet Option B migration preserves provider Work ON/OFF (static only)');
