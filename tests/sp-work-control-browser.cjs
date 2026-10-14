/* OCS mobile SP/Admin regression: all Supabase responses mocked.
 * No user accounts, money, bookings or database writes involved. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

function fakeProviderApi(){
 window.__spCalls=[];
 let available=false;
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:{id:'test-sp'}}}})},
  rpc:async(name,args={})=>{
   window.__spCalls.push({name,args});
   if(name==='provider_profile_snapshot_v1')return {data:{
    registered:true,provider_id:'test-sp',full_name:'Approved Mock SP',phone:'9000000000',
    available_for_work:available,wallet_balance:0,admin_paused:false,service_location_set:true,
    skills:[{category:'Appliance Repair',service_name:'Refrigerator Repair',
             approved:true,verification_status:'approved',enabled_by_provider:true}]},error:null};
   if(name==='provider_onboarding_snapshot_v1')return {data:{status:'approved'},error:null};
   if(name==='provider_status_snapshot')return {data:[{available_for_work:available}],error:null};
   if(name==='provider_current_booking'||name==='provider_open_jobs_v4')return {data:[],error:null};
   if(name==='set_provider_available'){
     available=args.p_available;
     return {data:{available_for_work:available},error:null};
   }
   return {data:[],error:null};
  }
 })};
}
function fakeAdminApi(){
 window.__adminCalls=[];
 let paused=false,available=true,reason=null,walletAutoResume=false;
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:{id:'test-admin'}}}})},
  rpc:async(name,args={})=>{
   window.__adminCalls.push({name,args});
   if(name==='admin_access_snapshot_v1')return {data:{is_admin:true},error:null};
   if(name==='admin_pending_provider_onboarding_v1')return {data:[],error:null};
   if(name==='ocs_admin_driver_operations_v1')return {data:{bookings:[],tickets:[],provider_changes:[]},error:null};
   if(name==='ocs_driver_company_inbox_v1')return {data:[],error:null};
   if(name==='admin_member_search_v3')return {data:{total_matching:1,members:[{
     name:'Mock SP',member_id:'mock-provider',roles:['service_provider'],
     categories:['Appliance Repair'],approval:'approved',transport:false}]},error:null};
   if(name==='admin_member_detail_v1')return {data:{
     profile:{member_id:'mock-provider',full_name:'Mock SP',contact_mobile:'9000000000'},
     roles:['service_provider'],onboarding:{status:'approved'},skills:[{
     category:'Appliance Repair',service_name:'Refrigerator Repair',approved:true,verification_status:'approved'}],
     provider_status:{available_for_work:available,wallet_balance:0,admin_paused:paused,
       admin_pause_reason:reason,wallet_auto_resume:walletAutoResume},
     bank_status:null,transport:null,bookings:[],ratings:[],support:[],wallet_history:[]},error:null};
   if(name==='ocs_admin_sp_work_control_v1'){
      switch(args.p_action){
       case 'off':available=false;paused=true;reason='manual';walletAutoResume=false;break;
       case 'wallet_hold':available=false;paused=true;reason='wallet';walletAutoResume=true;break;
       case 'on':available=true;paused=false;reason=null;walletAutoResume=false;break;
       case 'release_hold':paused=false;reason=null;walletAutoResume=false;break;
      }
      return {data:{available_for_work:available,admin_paused:paused,
       admin_pause_reason:reason,wallet_auto_resume:walletAutoResume},error:null};
   }
   return {data:[],error:null};
  }
 })};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  const sp=await ctx.newPage();
  await sp.route(/supabase-js@2/,route=>route.fulfill({
   status:200,contentType:'application/javascript',body:'('+fakeProviderApi.toString()+')();'}));
  await sp.goto('http://127.0.0.1:8765/provider-dashboard.html',{waitUntil:'domcontentloaded'});
  await sp.waitForFunction(()=>document.getElementById('workToggle').textContent.trim()==='Work OFF',null,{timeout:15000});
  assert.match(await sp.locator('#profileBox').innerText(),/₹0/);
  assert.doesNotMatch(await sp.locator('#jobBox').innerText(),/Wallet minimum ₹200|Recharge Required|New Jobs On Hold/);
  await sp.locator('#workToggle').click();
  await sp.waitForFunction(()=>document.getElementById('workToggle').textContent.trim()==='Work ON',null,{timeout:15000});
  const actions=await sp.evaluate(()=>window.__spCalls);
  assert(actions.some(x=>x.name==='set_provider_available'&&x.args.p_available===true));
  assert(actions.some(x=>x.name==='provider_open_jobs_v4'));
  console.log('PASS mobile SP: ₹0 wallet does not block Work ON or matching-job query');

  const admin=await ctx.newPage();
  await admin.route(/supabase-js@2/,route=>route.fulfill({
   status:200,contentType:'application/javascript',body:'('+fakeAdminApi.toString()+')();'}));
  await admin.goto('http://127.0.0.1:8765/admin-approval.html',{waitUntil:'domcontentloaded'});
  await admin.locator('#ocsAdminSections').waitFor({state:'visible',timeout:15000});
  await admin.locator('#adminTabMembers').click();
  await admin.locator('button:text-is("View Full OCS Record")').click();
  const control=admin.locator('#ocsMemberRows').getByText('Admin • SP Work Control');
  await control.waitFor({state:'visible',timeout:15000});
  const doAction=async text=>{
   admin.once('dialog',d=>d.accept());
   await admin.locator('#ocsMemberRows button').getByText(text,{exact:true}).click();
   await admin.waitForFunction(t=>window.__adminCalls.some(x=>x.name==='ocs_admin_sp_work_control_v1'&&x.args.p_action===t),
      text==='Work OFF'?'off':text==='Wallet Hold'?'wallet_hold':text==='Work ON'?'on':'release_hold',{timeout:10000});
  };
  await doAction('Work OFF');
  await admin.locator('#ocsMemberRows').getByText('Admin Hold: manual',{exact:false}).waitFor();
  await doAction('Wallet Hold');
  await admin.locator('#ocsMemberRows').getByText('Admin Hold: wallet',{exact:false}).waitFor();
  await doAction('Work ON');
  await admin.locator('#ocsMemberRows').getByText('No hold',{exact:false}).waitFor();
  const calls=await admin.evaluate(()=>window.__adminCalls.filter(x=>x.name==='ocs_admin_sp_work_control_v1').map(x=>x.args.p_action));
  assert.deepEqual(calls,['off','wallet_hold','on']);
  console.log('PASS mobile Admin: Manual OFF, Wallet Hold, Work ON call audited server controls');
  console.log('OCS SP Wallet & Admin Work mobile smoke PASSED');
 }finally{await browser.close()}
})().catch(e=>{console.error('OCS SP Wallet & Admin Work smoke FAILED:',e.stack||e);process.exitCode=1});