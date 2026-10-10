/* OCS backend-facing booking smoke tests - all Supabase calls are MOCKED.
 * No login, paid order, or live database writes are made. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../home-services.html'),'utf8');
function extract(start,next){
 const a=source.indexOf(start);const b=source.indexOf(next,a+start.length);
 assert(a>=0&&b>a,'Missing function boundary: '+start);
 return source.slice(a,b);
}
const functions=[
 extract('async function ocsCreateLiveBooking(){','async function ocsProviderDecisionLive(d){'),
 extract('async function ocsProviderDecisionLive(d){','async function ocsProviderActionLive(action,otp){'),
 extract('async function ocsProviderActionLive(action,otp){','async function ocsToggleAvailabilityLive(v){')
].join('\n');
function harness({connected=true,loggedIn=true,bookingId='test-booking-uuid',failRpc=''}={}){
 const calls=[],applied=[],storage={};
 const S={
  activeBookingId:bookingId,status:'REQUESTED',
  selectedItems:[{name:'Fan Fitting',price:239,qty:2}],
  category:'Electrical',service:'Fan Fitting',total:478,base:478,
  paymentChoice:'ONLINE',address:'Test address, Mumbai',
  customerBookingLat:19.2,customerBookingLng:73.0
 };
 const ocsSupabase=connected?{async rpc(name,args){
  calls.push({name,args});
  if(name===failRpc)return {error:new Error('Test backend error'),data:null};
  if(name==='ensure_customer_account_v1')return {error:null};
  return {data:{id:bookingId,status:name==='accept_booking_v3'?'accepted':'searching'},error:null};
 }}:null;
 const ctx={S,ocsSupabase,OCS_LIVE_BOOKING_ID:bookingId,
   ocsSession:async()=>loggedIn?{user:{id:'mock-user'}}:null,
   ocsApplyBackendBooking(data){applied.push(data)},
   ocsBookingReadinessPayload:()=>({material_status:'ready',power_point:'yes'}),
   localStorage:{setItem(k,v){storage[k]=v}},
   saveHomeState(){},location:{href:''},console:{error(){}}
 };
 vm.createContext(ctx);vm.runInContext(functions,ctx,{timeout:2500});
 return {...ctx,calls,applied,storage};
}
async function test(name,fn){
 try{await fn();console.log('PASS '+name);return true}
 catch(e){console.error('FAIL '+name+': '+e.stack);return false}
}
(async()=>{
 let success=0;
 const tests=[
 ['Customer booking calls exact live RPC with selected items and pinned location',async()=>{
   const h=harness();const r=await h.ocsCreateLiveBooking();
   assert.equal(r.id,'test-booking-uuid');
   const call=h.calls.find(c=>c.name==='create_customer_booking_v4');
   assert(call);assert.equal(call.args.p_category,'Electrical');
   assert.equal(call.args.p_booking_amount,478);
   assert.equal(call.args.p_payment_method,'online');
   assert.equal(call.args.p_selected_items[0].qty,2);
   assert.equal(call.args.p_latitude,19.2);assert.equal(call.args.p_longitude,73);
   assert.equal(h.applied.length,1);
 }],
 ['Customer without login cannot create backend booking',async()=>{
   const h=harness({loggedIn:false});
   await assert.rejects(()=>h.ocsCreateLiveBooking(),/OCS_LOGIN_REDIRECT/);
   assert.equal(h.calls.length,0);
   assert.match(h.location.href,/login=1/);
 }],
 ['Service Provider Accept succeeds only after backend confirmation',async()=>{
   const h=harness();
   await h.ocsProviderDecisionLive('accept');
   assert.equal(h.calls[0].name,'accept_booking_v3');
   assert.equal(h.calls[0].args.p_booking_id,'test-booking-uuid');
   assert.equal(h.applied.length,1);
 }],
 ['Missing booking ID stops Accept and prevents false success',async()=>{
   const h=harness({bookingId:null});
   await assert.rejects(()=>h.ocsProviderDecisionLive('accept'),/Booking ID missing/);
   assert.equal(h.calls.length,0);assert.equal(h.applied.length,0);
 }],
 ['Service Provider Reject must use live backend and clear only after success',async()=>{
   const h=harness();
   await h.ocsProviderDecisionLive('reject');
   assert.equal(h.calls[0].name,'reject_booking_v2');
   assert.equal(h.S.status,'SELECT_SERVICE');assert.equal(h.S.activeBookingId,null);
 }],
 ['Network/backend failure cannot fake Accept or Reject',async()=>{
   const h=harness({failRpc:'accept_booking_v3'});
   await assert.rejects(()=>h.ocsProviderDecisionLive('accept'),/Test backend error/);
   assert.equal(h.applied.length,0);assert.equal(h.S.status,'REQUESTED');
   const v=harness({failRpc:'reject_booking_v2'});
   await assert.rejects(()=>v.ocsProviderDecisionLive('reject'),/Test backend error/);
   assert.equal(v.S.activeBookingId,'test-booking-uuid');
 }],
 ['Start OTP forwards exact code; state changes only after server confirmation',async()=>{
   const h=harness();
   await h.ocsProviderActionLive('start','123456');
   const call=h.calls[0];assert.equal(call.name,'provider_booking_action');
   assert.equal(call.args.p_start_otp,'123456');assert.equal(call.args.p_action,'start');
   assert.equal(h.applied.length,1);
 }],
 ['Missing booking ID cannot report OTP verified / work started',async()=>{
   const h=harness({bookingId:null});
   await assert.rejects(()=>h.ocsProviderActionLive('start','123456'),/Booking ID missing/);
   assert.equal(h.calls.length,0);assert.equal(h.applied.length,0);
 }],
 ['Backend OTP error does not update the working job state',async()=>{
   const h=harness({failRpc:'provider_booking_action'});
   await assert.rejects(()=>h.ocsProviderActionLive('start','wrong'),/Test backend error/);
   assert.equal(h.applied.length,0);assert.equal(h.S.status,'REQUESTED');
 }],
 ['No Supabase connection blocks acceptance instead of returning false',async()=>{
   const h=harness({connected:false});
   await assert.rejects(()=>h.ocsProviderDecisionLive('accept'),/online booking connection/);
   await assert.rejects(()=>h.ocsProviderActionLive('start','123456'),/online booking connection/);
 }]
 ];
 for(const [name,fn] of tests)if(await test(name,fn))success++;
 console.log('OCS Booking smoke: '+success+'/'+tests.length+' passed');
 if(success!==tests.length)process.exitCode=1;
})().catch(err=>{console.error(err);process.exitCode=1});
