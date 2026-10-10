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
 const ctx={sb,profile:null,document:{getElementById:dom},
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
 await check('Main four OCS tiles visible above secondary property and listings',()=>{
  const start=home.indexOf('id="ocsMainBusiness"');
  const property=home.indexOf('ocs-feature-property');
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
 await check('Driver profile errors are visible instead of hidden',()=>{
  assert(provider.includes("'Driver profile load failed'"));
  assert(provider.includes('snap.full_name'));
 });
 console.log('OCS main-business smoke: '+successes+'/9 passed');
 if(successes!==9)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
