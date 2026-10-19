/* OCS live-page mobile regression using mocked Supabase only.
 * No real login, bank data, wallet credit, booking, charge, or database write. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const root='http://127.0.0.1:8765/';
function mockSupabase(kind){
 window.__ocsMockCalls=[];
 let workOn=false;
 window.supabase={createClient:()=>({
   auth:{getSession:async()=>({data:{session:{user:{id:'test-sp-only'}}}})},
   rpc:async(name,args={})=>{
     window.__ocsMockCalls.push({name,args});
     const provider={
       registered:true,full_name:'OCS Test Provider',phone:'9000000000',
       wallet_balance:100,available_for_work:workOn,
       service_location_set:true,admin_paused:false,
       skills:[{category:'Appliance Repair',service_name:'Refrigerator Repair / Service',
                approved:true,verification_status:'approved',enabled_by_provider:true}]
     };
     const answers={
       provider_profile_snapshot_v1:provider,
       provider_onboarding_snapshot_v1:{status:'approved'},
       provider_status_snapshot:[{available_for_work:workOn}],
       provider_current_booking:[],
       provider_open_jobs_v4:[],
       ocs_sp_inbox_summary_v1:{work_on:workOn,approved:true,new_matching_jobs:0,open_discussions:0},
       ocs_my_unread_notifications_count_v1:0,
       ocs_direct_payment_status_v1:{manual_collection_available:false},
       ocs_sp_direct_commission_summary_v1:{wallet_balance:100,commission_total:0,unpaid_commission:0,recent_jobs:[]},
       ocs_sp_advance_status_v1:{history:[],unpaid_commission:0},
       ocs_my_manual_bank_payments_v1:[],
       ocs_sp_wallet_new_job_status_v1:{wallet_balance:100,rule_active:false,minimum_for_new_jobs:200},
       provider_withdrawal_preview_v1:{wallet_balance:100,reserve_amount:200,withdrawable_amount:0,can_withdraw:false},
       provider_payout_snapshot_v1:{
         has_details:false,verification_status:'not_added',
         wallet_balance:100,reserve_amount:200,withdrawable_amount:0,
         auto_payout_enabled:false
       },
     };
     if(name==='set_provider_available'){
       workOn=!!args.p_available;
       return {data:{available_for_work:workOn},error:null};
     }
     return {data:answers[name]??[],error:null};
   }
 })};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];
 async function pageFor(path){
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(path+': '+error.message));
   await page.route(/supabase-js@2/,route=>route.fulfill({
     status:200,contentType:'application/javascript',body:'('+mockSupabase.toString()+')();'
   }));
   await page.goto(root+path,{waitUntil:'domcontentloaded',timeout:30000});
   return page;
 }
 try{
   // 1. Bank details are truly optional at SP joining.
   const bank=await pageFor('payout-details.html?from=sp');
   await bank.locator('#bankOptional').waitFor({state:'visible'});
   assert.equal(await bank.locator('#verifyBadge').innerText(),'Not Added');
   assert(await bank.locator('#form').isHidden(),'Bank form must be closed by default');
   assert(await bank.locator('#bankOptional button').getByText('Skip for Now',{exact:false}).isVisible());
   await bank.locator('#bankOptional button').getByText('Add Bank Details').click();
   assert(await bank.locator('#form').isVisible(),'Form should open on explicit click');
   await bank.locator('#cancel').click();
   assert(await bank.locator('#form').isHidden(),'Cancel should hide bank form');
   assert(await bank.locator('#bankOptional').isVisible(),'Optional choice should return');
   assert.equal((await bank.evaluate(()=>window.__ocsMockCalls)).filter(x=>x.name.startsWith('save_')).length,0);
   console.log('PASS: SP Bank details optional; Add/Cancel works without saving');

   // 2. Welcome bonus allows launch phase; reserve cannot be withdrawn.
   const wallet=await pageFor('simple-payments.html?from=sp');
   await wallet.locator('#spCard').waitFor({state:'visible'});
   assert.equal(await wallet.locator('#verifiedAdvance').innerText(),'₹100.00');
   assert.equal(await wallet.locator('#reserveAmount').innerText(),'₹200.00');
   assert.equal(await wallet.locator('#withdrawableEstimate').innerText(),'₹0.00');
   assert.match(await wallet.locator('#walletNote').innerText(),/₹200 minimum/i);
   assert.doesNotMatch(await wallet.locator('#walletNote').innerText(),/minimum abhi OFF/i);
   assert.equal(await wallet.locator('#adminSection').count(),0);
   assert(await wallet.locator('a[href*="payout-details.html"]').isVisible());
   console.log('PASS: ₹100 launch wallet, ₹200 protected reserve, zero payout, no Admin card');

   // 3. Work OFF has correct information; Work ON fetches matching jobs.
   const sp=await pageFor('provider-dashboard.html');
   await sp.waitForFunction(()=>document.getElementById('workToggle')?.textContent.trim()==='Work OFF');
   await sp.locator('#jobBox').getByText('Work is OFF').waitFor({state:'visible'});
   assert(await sp.locator('#ocsEvidenceQuickLink').isHidden());
   await sp.locator('#workToggle').click();
   await sp.waitForFunction(()=>document.getElementById('workToggle')?.textContent.trim()==='Work ON');
   await sp.locator('#jobBox').getByText('No matching job right now').waitFor();
   assert(await sp.locator('#ocsEvidenceQuickLink').isHidden());
   const calls=await sp.evaluate(()=>window.__ocsMockCalls);
   assert(calls.some(x=>x.name==='set_provider_available'&&x.args.p_available===true));
   assert(calls.some(x=>x.name==='provider_open_jobs_v4'));
   console.log('PASS: Work OFF -> ON -> new-job query; no unrelated Evidence button');

   assert.equal(errors.length,0,'Page JS errors: '+errors.join('; '));
   console.log('OCS wallet, bank and SP mobile E2E MOCK smoke: 3/3 PASSED');
 }finally{
   await context.close();
   await browser.close();
 }
})().catch(e=>{console.error('OCS mobile regression FAILED:',e.stack||e);process.exitCode=1});
