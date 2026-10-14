/* Mobile official-export regression with a fully mocked Supabase client.
 * Does NOT search real members, export PII, or modify production records. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

function fakeSupabase(){
 window.__exportCalls=[];
 const reportId='00000000-0000-4000-8000-000000000001';
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:{id:'mock-admin'}}}})},
  rpc:async(name,p={})=>{
   window.__exportCalls.push({name,args:p});
   switch(name){
    case 'admin_access_snapshot_v1':return {data:{is_admin:true},error:null};
    case 'admin_pending_provider_onboarding_v1':return {data:[],error:null};
    case 'ocs_admin_driver_operations_v1':return {data:{bookings:[],tickets:[],provider_changes:[]},error:null};
    case 'ocs_driver_company_inbox_v1':return {data:[],error:null};
    case 'ocs_driver_packages_v1':return {data:{packages:[]},error:null};
    case 'admin_member_search_v3':return {data:{total_matching:1,members:[{name:'Demo Driver',member_id:'mock-member',roles:['customer','service_provider'],categories:['Driver Service'],approval:'approved',transport:false}]},error:null};
    case 'admin_member_detail_v1':return {data:{profile:{member_id:'mock-member',full_name:'Demo Driver',contact_mobile:'9000000000',contact_email:'demo@example.invalid',role:'customer',joined_at:'2026-10-13T10:00:00Z'},roles:['customer','service_provider'],onboarding:{status:'approved'},skills:[],provider_status:null,bank_status:null,transport:null,bookings:[],ratings:[],support:[],wallet_history:[],listing_counts:{}},error:null};
    case 'admin_member_payment_history_v1':return {data:{service_payments:[],work_summary:{completed:0,active:0,cancelled:0},recharges:[],withdrawals:[],customer_wallet_history:[],listing_payment_history:[]},error:null};
    case 'ocs_admin_official_export_v1':return {data:{report_id:reportId,generated_at:'2026-10-13T16:00:00Z',officer:p.p_officer_name,department:p.p_police_station,reference:p.p_request_reference,purpose:p.p_request_purpose,profile:{full_name:'Demo Driver',member_id:'mock-member',contact_mobile:p.p_sections.contact?'9000000000':null,contact_email:p.p_sections.contact?'demo@example.invalid':null},roles:['customer','service_provider'],bookings:p.p_sections.bookings?[{created_at:'2026-10-13T10:00:00Z',booking_id:'mock-booking',participation:'Service Provider',category:'Driver Service',service_name:'Driver',status:'completed',booking_amount:399}]:[],payments:[],notice:'Sample mock data, no private documents.'},error:null};
    case 'ocs_admin_official_export_action_v1':return {data:true,error:null};
    case 'ocs_admin_official_export_history_v1':return {data:[{report_id:reportId,member_name:'Demo Driver',request_reference:'REF-1234',police_station:'Demo Station',officer_name:'Officer Sample',generated_at:'2026-10-13T16:00:00Z',sections:{contact:true,bookings:true},actions:[{action:'copy',at:'2026-10-13T16:01:00Z'}]}],error:null};
    default:return {data:[],error:null};
   }
  }
 })};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route(/supabase-js@2/,route=>route.fulfill({status:200,contentType:'application/javascript',body:'('+fakeSupabase.toString()+')();'}));
 try{
  await page.goto('http://127.0.0.1:8765/admin-approval.html',{waitUntil:'domcontentloaded'});
  await page.locator('#ocsAdminSections').waitFor({state:'visible',timeout:20000});
  await page.locator('#adminTabMembers').click();
  await page.locator('button:text-is("View Full OCS Record")').click();
  await page.locator('button:text-is("Official Record • Copy / Download / Share")').click();
  assert.equal(await page.locator('#ocsOfficialRecordForm input[data-official-section]').count(),3);
  await page.locator('#ocsExport-officer').fill('Officer Sample');
  await page.locator('#ocsExport-station').fill('Demo Station');
  await page.locator('#ocsExport-reference').fill('REF-1234');
  await page.locator('#ocsExport-purpose').fill('Written official records request');
  await page.locator('#ocsOfficialRecordForm input[data-official-section="contact"]').check();
  await page.locator('#ocsOfficialRecordForm input[data-official-section="bookings"]').check();
  await page.locator('#ocsExport-verified').check();
  page.once('dialog',d=>d.accept());
  await page.locator('button:text-is("Generate Official Record")').click();
  await page.locator('#ocsOfficialRecordForm pre').waitFor({state:'visible',timeout:12000});
  const preview=await page.locator('#ocsOfficialRecordForm pre').innerText();
  assert.match(preview,/OFFICIAL RECORD EXTRACT/);
  assert.match(preview,/Demo Driver/);
  assert.match(preview,/mock-booking/);
  assert.doesNotMatch(preview,/bank account|selfie|password|OTP/i);
  let calls=await page.evaluate(()=>window.__exportCalls);
  const gen=calls.find(x=>x.name==='ocs_admin_official_export_v1');
  assert(gen,'Audited export RPC must run');
  assert.equal(gen.args.p_sections.payments,false);
  assert.equal(gen.args.p_sections.bookings,true);
  console.log('PASS mobile official report: verified request, selected fields and server-generated extract');

  const downloadPromise=page.waitForEvent('download');
  await page.locator('button:text-is("Download TXT")').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/^OCS-Official-.*\.txt$/);
  await page.waitForFunction(()=>window.__exportCalls.some(x=>x.name==='ocs_admin_official_export_action_v1'&&x.args.p_action_type==='download'));
  console.log('PASS mobile official report: TXT download and audited action');

  await page.locator('#adminTabOfficial').click();
  await page.locator('#ocsOfficialHistoryRows').getByText('Demo Driver').waitFor({state:'visible'});
  assert.match(await page.locator('#ocsOfficialHistoryRows').innerText(),/REF-1234/);
  console.log('PASS Admin: official export history and recorded actions');

  assert(errors.length===0,'Unexpected browser errors: '+errors.join('; '));
  console.log('OCS Official Export mobile browser smoke PASSED');
 }finally{await browser.close()}
})().catch(e=>{console.error('OCS Official Export mobile test FAILED:',e.stack||e);process.exitCode=1});
