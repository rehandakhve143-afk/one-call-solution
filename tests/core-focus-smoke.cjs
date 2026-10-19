/* OCS main business regression: Customer, SP, Driver Service, Transport.
 * No network calls, payments, logins, or live database writes. */
'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const home=read('index.html'),sp=read('provider-dashboard.html'),driver=read('driver-service.html');
const provider=read('driver-provider.html'),transport=read('transport.html'),truck=read('transport-driver.html');
let successes=0;
async function check(name,fn){
  try{await fn();console.log('PASS '+name);successes++}
  catch(e){console.error('FAIL '+name+': '+e.stack);process.exitCode=1}
}
function syntaxCheck(file,source){
 const blocks=[...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
 .filter(m=>!/\bsrc=/.test(m[1]));
 assert(blocks.length>0,'No JavaScript blocks: '+file);
 blocks.forEach((m,i)=>new vm.Script(m[2],{filename:file+':script-'+i}));
}
function roleRoute(skill){
 const p=sp.indexOf('async function loadDashboard(){'),q=sp.indexOf('function syncToggle(){',p);
 assert(p>=0&&q>p,'Cannot isolate SP dashboard loading');
 const code=sp.slice(p,q);
 const urls=[],els={};
 const dom=id=>els[id]||(els[id]={innerHTML:'',textContent:'',disabled:false});
 const sb={auth:{getSession:async()=>({data:{session:{user:{id:'TEST'}}}})},async rpc(name){
   if(name==='provider_profile_snapshot_v1')return {data:{registered:true,skills:[{category:skill,enabled_by_provider:true,approved:true,verification_status:'approved'}]},error:null};
   throw Error('Unexpected RPC '+name);
 }};
 const ctx={sb,profile:null,dashboardBusy:false,document:{getElementById:dom},
           location:{replace:x=>urls.push(x)}};
 vm.createContext(ctx);vm.runInContext(code,ctx,{timeout:2500});
 return Promise.resolve(ctx.loadDashboard()).then(()=>urls);
}
(async()=>{
 await check('All four customer/partner pages parse as valid JavaScript',()=>{
  [['driver-service.html',driver],['driver-provider.html',provider],
   ['transport.html',transport],['transport-driver.html',truck],
   ['provider-dashboard.html',sp]].forEach(([p,s])=>syntaxCheck(p,s));
 });
 await check('Direct payment and cash receipt guards remain in all four flows',()=>{
  const hs=read('home-services.html');
  assert(/if\s*\(!directResult\s*\|\|\s*!directResult\.payment_id\)/.test(hs), 'Customer SP must reject missing payment record');
  assert(driver.includes('driverCashMarkBusy=true'), 'Driver customer must prevent duplicate payment requests');
  assert(driver.includes('if(!data?.payment_id)'), 'Driver customer must verify payment record');
  assert(transport.includes('transportDirectPayBusy=true'), 'Transport customer must prevent duplicate requests');
  assert(transport.includes('finally{transportDirectPayBusy=false}'), 'Transport customer must release busy state');
  assert(transport.includes('if(!data?.payment_id)'), 'Transport customer must verify payment record');
  assert(provider.includes('driverCashConfirmBusy=true'), 'Driver receipt must prevent double submission');
  assert(provider.includes("payment.status!=='cash_marked'"), 'Driver receipt must verify payment status');
  assert(truck.includes('transportCashConfirmBusy=true'), 'Transport receipt must prevent double submission');
  assert(truck.includes("p.status!=='cash_marked'"), 'Transport receipt must verify payment status');
 });
 await check('Main four OCS tiles visible above secondary property and listings',()=>{
  const start=home.indexOf('id="ocsMainBusiness"');
  const property=home.indexOf('id="ocsBuilderPropertyHomeStrip"');
  assert(start>0&&property>start);
  for(const klass of ['ocs-core-customer','ocs-core-sp','ocs-core-driver','ocs-core-transport']){
   assert.equal((home.match(new RegExp('class="ocs-core-tile [^"]*'+klass+'"','g'))||[]).length,1,klass);
  }
 });
 await check('No duplicate Driver and Transport marketplace cards',()=>{
  assert(!/class="ocs-market-card" onclick="openModule\('Driver Service'\)"/.test(home));
  assert(!/class="ocs-market-card" onclick="openModule\('Tempo \/ Goods Transport'\)"/.test(home));
 });
 await check('Global search includes customer, driver and transport main routes',()=>{
  assert(home.includes('const OCS_MODULE_NAMES=["Home Services","Driver Service","Tempo / Goods Transport"'));
  assert(home.includes('"Driver Service":"driver service hire driver'));
  assert(home.includes('"Tempo / Goods Transport":"transport service tempo'));
 });
 await check('Dedicated Driver routes from Service Provider dashboard',async()=>{
  const urls=await roleRoute('Driver Service');
  assert.equal(urls.length,1);
  assert.match(urls[0],/^driver-provider\.html/);
 });
 await check('Dedicated Transport routes from Service Provider dashboard',async()=>{
  const urls=await roleRoute('Tempo / Goods Transport');
  assert.equal(urls.length,1);
  assert.match(urls[0],/^transport-driver\.html/);
 });
 await check('Driver bookings require a real GPS pin and block active duplicates',()=>{
  assert(driver.includes('if(!Number.isFinite(pickupLat)||!Number.isFinite(pickupLng))'));
  assert(driver.includes('Ek Driver request already active hai'));
  assert(driver.includes("('tripCard').style.display='none'"));
 });
 await check('Driver customer Support creates a real backend ticket',()=>{
  assert(driver.includes("sb.rpc('create_support_ticket_v1'"));
  assert(driver.includes("p_role:'customer',p_category:'Driver Service'"));
  assert(!driver.includes("alert('OCS Support se Driver booking issue raise kiya jayega.')"));
 });
 await check('Unapproved Driver cannot turn work ON or receive requests',()=>{
  assert(provider.includes("ocs_driver_account_eligibility_v1"));
  assert(provider.includes("if(!driverEligible){alert("));
  assert(provider.includes("$('workBtn').hidden=true"));
  assert(provider.includes("Current category: "));
  assert(provider.includes("Admin approval pending"));
  assert(provider.includes('driverCategoryConflict=!!(gate?.current_category'));
  assert(provider.includes('startSeparateDriverAccount()'));
  assert(provider.includes('index.html?fresh=1&login=1&open=sp-profile&join=driver'));
  assert(provider.includes('Existing SP category ko mat badlein'));

 });
 await check('Driver profile errors are visible instead of hidden',()=>{
  assert(provider.includes("Driver eligibility unavailable"));
  assert(provider.includes('snap?.full_name'));
 });
 await check('Driver only: package fare comes from central OCS rates; no manual driver quotes',()=>{
  assert(driver.includes("publicRates.rpc('ocs_driver_packages_v1')"));
  assert(driver.includes("driverPackage()"));
  assert(driver.includes("sb.rpc('create_customer_driver_package_booking_v2'"));
  assert(driver.includes("$('bookBtn').disabled=!enabled"));
  assert(!driver.includes("sb.rpc('create_customer_quote_request_v2'"));
  assert(!provider.includes("setTimeout(()=>promptQuote(id),100)"));
  assert(!provider.includes("async function promptQuote(id)"));
  for(const v of [2,2.5,3,3.5,4,4.5,5,5.5,6,8,12])assert(driver.includes('data-value="'+v+' Hrs"'));
  assert(!driver.includes('data-value="1 Hrs"'));
 });
 await check('Driver acceptance, customer callback, Start OTP and completion use backend transitions',()=>{
  assert(provider.includes("sb.rpc('accept_booking_v3'"),'Driver must accept using verified backend');
  assert(provider.includes("sb.rpc('provider_booking_action'"),'Driver must use backend status transitions');
  assert(provider.includes("p_action:'start',p_start_otp:otp"),'Driver sends customer OTP for verification');
  assert(provider.includes("ocs_assigned_driver_customer_phone_v1"),'Callback is assigned Driver only');
  assert(driver.includes("s==='reached'&&b.start_otp"),'Customer receives start OTP after arrival');
  assert(driver.includes("customer_confirm_completion_v2"),'Customer confirms completed job');
  assert(driver.includes("ocs_customer_driver_no_show_v1"),'Customer can request company intervention');
  assert(driver.includes("create_customer_driver_package_booking_v2"),'Customer booking uses server-side fare');
 });
 await check('Driver and Transport require exactly 4-digit Start OTP before backend transition',()=>{
  for(const [name,source,fn] of [['Driver',provider,'startOtp'],['Transport',truck,'startTrip']]){
   const start=source.indexOf('async function '+fn+'()');
   assert(start>=0,name+' Start OTP function missing');
   const section=source.slice(start,start+650);
   assert(section.includes('/^\\d{4}$/.test(otp)'),name+' must validate 4-digit OTP');
   assert(section.includes("p_action:'start',p_start_otp:otp"),name+' must send OTP to backend');
   assert(section.indexOf('/^\\d{4}$/.test(otp)')<section.indexOf("p_action:'start'"),name+' must validate before sending');
  }
 });
 await check('Transport wallet banner follows backend gate, not unconditional ₹200 threshold',()=>{
  assert(!truck.includes("bal<200?'New trips on hold"),'Transport must not block ₹100 starter bonus solely for balance below ₹200');
  assert(truck.includes("D?.walletGate?.new_jobs_wallet_blocked?'Wallet Hold"),'Transport banner must use backend eligibility');
  assert(truck.includes('D.walletGate=we?null:walletGate;render();'),'Transport banner must refresh after wallet eligibility loads');
 });
 await check('Transport never offers new request while Work OFF, KYC pending, or admin hold',()=>{
  const fn=truck.slice(truck.indexOf('function renderWork()'),truck.indexOf('function currentCard('));
  assert(fn.includes("p.admin_paused||p.onboarding_status!=='approved'||!t.kyc_complete||!p.available_for_work"));
  assert(fn.indexOf('OPEN=null')<fn.indexOf('if(OPEN){box.innerHTML=requestCard(OPEN)'));
  assert(fn.indexOf('if(c.has_booking)')<fn.indexOf('OPEN=null'),'Accepted trips remain visible');
 });
 await check('Driver Work OFF and unapproved accounts cannot display new offers',()=>{
  const fn=provider.slice(provider.indexOf('async function loadOpenJobs()'),provider.indexOf('function jobCard('));
  assert(fn.includes('if(!driverEligible||!workOn||driverAdminPaused||driverWalletBlocked)'));
  assert(provider.includes('driverWalletBlocked=gate?.wallet_new_jobs_blocked===true'));
  assert(provider.includes('driverAdminPaused=ps?.admin_paused===true'));
  assert(fn.indexOf('if(!driverEligible||!workOn||driverAdminPaused||driverWalletBlocked)')<fn.indexOf("sb.rpc('provider_open_jobs_v4')"));
  assert(fn.includes('Accepted trip par koi asar nahi'));
 });
 console.log('OCS main-business smoke: '+successes+'/17 passed');
 if(successes!==17)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
