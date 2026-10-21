// Static guards only; no production wallet mutation or authenticated booking test.
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const paths=[
 'supabase/migrations/20261019_wallet_unblock_preserve_work_choice.sql',
 'supabase/migrations/20261021_wallet_resume_preserve_provider_work_choice.sql'
];
for(const path of paths){
 const sql=fs.readFileSync(path,'utf8');
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.ocs_sp_try_wallet_resume_v1/i,path);
 assert.match(sql,/ps\.admin_pause_reason='wallet'/,path);
 assert.match(sql,/ps\.wallet_auto_resume/,path);
 assert.match(sql,/ps\.wallet_balance,0\)>=200/,path);
 assert.match(sql,/SET admin_paused=false,admin_pause_reason=null,?/i,path);
 assert.match(sql,/wallet_auto_resume=false/i,path);
 assert.doesNotMatch(sql,/SET[^;]*available_for_work\s*=/i,'Wallet unblock must not change Work ON/OFF: '+path);
 assert.match(sql,/ps\.available_for_work,ps\.available_for_work/,'Log must preserve Work ON/OFF: '+path);
 assert.match(sql,/Turn Work ON yourself/i,path);
}
console.log('PASS: wallet recharge preserves provider Work ON/OFF in both migrations (static only)');
