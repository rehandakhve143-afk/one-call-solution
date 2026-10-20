// Admin subsidy frontend and backend migration contract; no live transactions.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('js/ocs-admin-subsidy-review.js','utf8');
const published=fs.readFileSync('assets/ocs-admin-subsidy-review.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
assert.equal(js,published,'Published asset must match deployed JS');
assert.match(html,/src="js\/ocs-admin-subsidy-review\.js\?v=/);
assert.match(workflow,/cp -- js\/ocs-admin-subsidy-review\.js/);
assert.match(js,/ocsUserHasRole\('admin'\)/);
for(const rpc of ['ocs_admin_prepare_provider_subsidy_v1','ocs_admin_provider_subsidy_queue_v1','ocs_admin_mark_provider_subsidy_sent_v1','ocs_admin_verify_provider_subsidy_v1'])assert.ok(js.includes(rpc),rpc);
for(const migration of ['20261020_admin_prepare_provider_subsidy.sql','20261020_admin_provider_subsidy_queue.sql','20261020_admin_mark_provider_subsidy_sent.sql','20261020_subsidy_verify_utr_must_match_sent.sql']){
 const sql=fs.readFileSync('supabase/migrations/'+migration,'utf8');
 assert.match(sql,/public\.is_admin\(\)/,'Admin gate missing in '+migration);
 assert.match(sql,/REVOKE ALL ON FUNCTION/,'Anon revocation missing in '+migration);
}
assert.match(fs.readFileSync('supabase/migrations/20261020_subsidy_verify_utr_must_match_sent.sql','utf8'),/v_row\.bank_utr IS DISTINCT FROM v_utr/);
assert.match(js,/This screen does not send money automatically/);
console.log('PASS: subsidy UI, deploy, RPC admin gates and UTR safety contract');
