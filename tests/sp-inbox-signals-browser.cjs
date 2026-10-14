/* SP Inbox browser test uses mocked Supabase; no real data changed. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.min.js',route=>route.fulfill({status:200,contentType:'application/javascript',body:"window.__ocsTestRpcCalls=[];\nwindow.supabase={createClient:()=>({\n auth:{getSession:async()=>({data:{session:{user:{id:'11111111-1111-4111-8111-111111111111'}}}})},\n rpc:async(name,args)=>{\n window.__ocsTestRpcCalls.push(name);\n const current={id:'33333333-3333-4333-8333-333333333333',status:'working',request_type:'fixed',service_name:'Fan Repair',category:'Electrical',booking_amount:239};\n const incoming={id:'22222222-2222-4222-8222-222222222222',status:'searching',request_type:'quote',service_name:'Refrigerator Repair',category:'Appliance Repair',distance_km:2.4,request_details:'Cooling problem'};\n const data={\n provider_profile_snapshot_v1:{registered:true,full_name:'Test SP',phone:'',available_for_work:true,service_location_set:true,admin_paused:false,wallet_balance:0,skills:[{category:'Appliance Repair',service_name:'Refrigerator Repair',approved:true,verification_status:'approved',enabled_by_provider:true}]},\n provider_onboarding_snapshot_v1:{status:'approved'},\n provider_status_snapshot:[{available_for_work:true}],\n provider_current_booking:[current],\n provider_open_jobs_v4:[incoming],\n ocs_sp_wallet_reminder_v1:{},\n ocs_sp_inbox_summary_v1:{work_on:true,approved:true,new_matching_jobs:1,open_discussions:2,customer_replies:1,quote_approved:1,quotes_awaiting_customer:1,current_work_slot_busy:true,next_work_slot_busy:false,discussion_uses_work_slot:false},\n ocs_my_unread_notifications_count_v1:3,\n booking_status_timeline_v1:{status:'working',status_title:'Working',activity:[]},\n accept_booking_v3:{id:incoming.id,status:'discussion'},\n list_notifications_v1:[],\n booking_history_v2:[]\n };\n return {data:data[name]??{},error:null};\n }})};"}));
  await page.goto('http://127.0.0.1:8765/provider-dashboard.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('ocsSpNewJobsCount')?.textContent==='1'&&document.getElementById('ocsSpDiscussionsCount')?.textContent==='2',{timeout:20000});
  assert.match(await page.locator('#jobBox').innerText(),/Fan Repair/);
  assert.match(await page.locator('#ocsSpDiscussionsText').innerText(),/customer-approved/i);
  await page.locator('#ocsSpNewJobSignal').click();
  assert.match(await page.locator('#ocsSpNewJobsList').innerText(),/Refrigerator Repair/);
  assert.match(await page.locator('#ocsSpNewJobsList').innerText(),/will NOT block current work slot/);
  page.on('dialog',d=>d.accept());
  await page.locator('#ocsSpNewJobsList .accept').click();
  await page.waitForFunction(()=>window.__ocsTestRpcCalls?.includes('accept_booking_v3'));
  assert.match(await page.locator('#jobBox').innerText(),/Fan Repair/);
  console.log('PASS: new job alerts, pending quotes, current work slot unaffected');
 }catch(e){console.error('FAIL SP Inbox test:',e.stack||e);process.exitCode=1}
 finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});