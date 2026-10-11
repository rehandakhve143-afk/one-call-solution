/* Browser tests with mocked Supabase. No production bookings, payments or rates changed. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

function fakeDriverClient(){
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:null}})},
  rpc:async name=>{
   if(name==='ocs_driver_packages_v1')return {data:{
    service:'driver_only_own_vehicle',rate_type:'duration_package',
    packages:[{hours:1,price:null,enabled:false},{hours:2,price:359,enabled:true},
      {hours:3,price:null,enabled:false},{hours:4,price:519,enabled:true},
      {hours:6,price:null,enabled:false},{hours:8,price:null,enabled:false},
      {hours:12,price:null,enabled:false}]},error:null};
   if(name==='ocs_customer_active_driver_booking_v1')return {data:null,error:null};
   return {data:null,error:null};
  }
 })};
}
function fakeAdminClient(){
 window.__rateCalls=[];
 window.__rates=[2,2.5,3,3.5,4,4.5,5,5.5,6,8,12].map(hours=>({hours,price:null,enabled:false}));
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:{id:'mock-admin'}}}})},
  rpc:async (name,p={})=>{
   if(name==='admin_access_snapshot_v1')return {data:{is_admin:true},error:null};
   if(name==='admin_pending_provider_onboarding_v1')return {data:[],error:null};
   if(name==='ocs_driver_packages_v1')return {data:{packages:window.__rates},error:null};
   if(name==='ocs_admin_set_driver_package_v1'){
    window.__rateCalls.push(p);
    window.__rates=window.__rates.map(r=>r.hours===p.p_duration_hours?
      {...r,price:p.p_package_price,enabled:p.p_active}:r);
    return {data:{packages:window.__rates},error:null};
   }
   return {data:[],error:null};
  }
 })};
}
function fakeNonAdminClient(){
 window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:{user:{id:'mock-non-admin'}}}})},
  rpc:async name=>{
   if(name==='admin_access_snapshot_v1')return {data:{is_admin:false},error:null};
   throw Error('Non-admin attempted restricted RPC '+name);
  }
 })};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const routeFake=async(page,fn)=>{
  await page.route(/supabase-js@2/,route=>route.fulfill({
   status:200,contentType:'application/javascript',body:'('+fn.toString()+')();'
  }));
 };
 try{
  const customer=await context.newPage();
  await routeFake(customer,fakeDriverClient);
  await customer.goto('http://127.0.0.1:8765/driver-service.html',{waitUntil:'domcontentloaded'});
  await customer.waitForFunction(()=>document.getElementById('driverHourlyRate').textContent.includes('₹359'),null,{timeout:15000});
  assert.equal(await customer.locator('#durationChoices button').count(),11);
  assert.equal(await customer.locator('#driverTotalFare').innerText(),'₹359');
  assert.equal(await customer.locator('#bookBtn').isDisabled(),false);
  await customer.locator('#durationChoices button[data-value="4 Hrs"]').click();
  assert.equal(await customer.locator('#driverTotalFare').innerText(),'₹519');
  assert.equal(await customer.locator('#driverFareFormula').innerText(),'4 hrs Driver Hire');
  await customer.locator('#durationChoices button[data-value="12 Hrs"]').click();
  assert.equal(await customer.locator('#driverTotalFare').innerText(),'Not available');
  assert.equal(await customer.locator('#bookBtn').isDisabled(),true);
  console.log('PASS Driver customer: seven packages, backend package prices, unpriced booking disabled');

  const admin=await context.newPage();
  admin.on('pageerror',e=>console.log('Admin browser pageerror:',e.message));
  await routeFake(admin,fakeAdminClient);
  await admin.goto('http://127.0.0.1:8765/admin-approval.html',{waitUntil:'domcontentloaded'});
  try{await admin.locator('#driverPackageRate-2').waitFor({state:'visible',timeout:15000})}
  catch(e){
    console.log('Admin page diagnostic:',JSON.stringify(await admin.evaluate(()=>({
     content:document.getElementById('content')?.textContent?.slice(0,500),
     rates:document.getElementById('driverPackagesPanel')?.textContent?.slice(0,500),
     hidden:document.getElementById('driverPackagesPanel')?.hidden,
     scriptLoaded:typeof window.ocsLoadDriverRateAdmin,
     sbExists:typeof window.supabase,
     authFn:typeof window.loadQueue
    }))));
    throw e
  }
  assert.equal(await admin.locator('.driver-rate-row').count(),11);
  assert.equal(await admin.locator('#driverPackagesPanel .driver-rate-status.on').count(),0);
  await admin.locator('#driverPackageRate-2').fill('399');
  await admin.locator('button[data-driver-save="2"]').click();
  await admin.waitForFunction(()=>window.__rateCalls.length===1);
  let calls=await admin.evaluate(()=>window.__rateCalls);
  assert.equal(calls[0].p_package_price,399);
  assert.equal(calls[0].p_active,false);
  console.log('PASS Driver Admin: Save Draft leaves package OFF');

  admin.once('dialog',d=>d.accept());
  await admin.locator('button[data-driver-toggle="2"][data-live="true"]').click();
  await admin.waitForFunction(()=>window.__rateCalls.length===2);
  calls=await admin.evaluate(()=>window.__rateCalls);
  assert.equal(calls[1].p_active,true);
  await admin.waitForFunction(()=>document.querySelectorAll('#driverPackagesPanel .driver-rate-status.on').length===1);
  console.log('PASS Driver Admin: LIVE requires a separate explicit approval');

  const unauthorized=await context.newPage();
  await routeFake(unauthorized,fakeNonAdminClient);
  await unauthorized.goto('http://127.0.0.1:8765/admin-approval.html',{waitUntil:'domcontentloaded'});
  await unauthorized.waitForFunction(()=>document.getElementById('content').textContent.includes('not Admin'),null,{timeout:15000});
  assert.equal(await unauthorized.locator('#driverPackagesPanel').isHidden(),true);
  console.log('PASS Driver Admin: non-admin cannot see pricing editor');
  console.log('OCS Driver packages mobile browser tests PASSED');
 }finally{await browser.close()}
})().catch(e=>{console.error('Driver browser tests FAILED:',e.stack||e);process.exitCode=1});
