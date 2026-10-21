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
 extract('async function ocsProviderActionLive(action,otp){','async function ocsToggleAvailabilityLive(v){'),
 extract('async function ocsToggleAvailabilityLive(v){','async function ocsSyncQuoteAndChat(role,booking){')
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
  return {data:{id:bookingId,status:name==='accept_booking_v3'?'accepted':name==='provider_booking_action'?(args.p_action==='complete'?'completion_requested':'working'):'searching'},error:null};
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
 ['Customer booking must reject an unconfirmed or mismatched backend response',async()=>{
   for(const response of [null,{}, {id:'test-booking-uuid',status:'failed'}, {id:null,status:'searching'}]){
     const h=harness();
     h.ocsSupabase.rpc=async(name,args)=>{
       h.calls.push({name,args});
       return name==='create_customer_booking_v4'?{data:response,error:null}:{data:null,error:null};
     };
     await assert.rejects(()=>h.ocsCreateLiveBooking(),/Customer booking not confirmed by backend/);
     assert.equal(h.applied.length,0);
   }
 }],
 ['Missing or invalid GPS pin cannot create a customer booking',async()=>{
   for(const [lat,lng] of [[null,null],['',''],[91,73],[19.2,181],[0,0]]){
     const h=harness();h.S.customerBookingLat=lat;h.S.customerBookingLng=lng;
     await assert.rejects(()=>h.ocsCreateLiveBooking(),/Booking location missing or invalid/);
     assert(!h.calls.some(c=>c.name==='create_customer_booking_v4'));
     assert.equal(h.applied.length,0);
   }
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
 ['Next accepted booking and quote discussion are valid backend outcomes',async()=>{
   for(const status of ['next_accepted','discussion']){
     const h=harness();
     h.ocsSupabase.rpc=async(name,args)=>{h.calls.push({name,args});return {data:{id:'test-booking-uuid',status},error:null};};
     await h.ocsProviderDecisionLive('accept');
     assert.equal(h.applied.length,1);
   }
 }],
 ['Accept must not report success for unconfirmed backend state',async()=>{
   const h=harness();
   h.ocsSupabase.rpc=async(name,args)=>{h.calls.push({name,args});return {data:{id:'test-booking-uuid',status:'searching'},error:null};};
   await assert.rejects(()=>h.ocsProviderDecisionLive('accept'),/acceptance not confirmed/);
   assert.equal(h.applied.length,0);
 }],
 ['Complete must not report success for unconfirmed backend state',async()=>{
   const h=harness();
   h.ocsSupabase.rpc=async(name,args)=>{h.calls.push({name,args});return {data:{id:'test-booking-uuid',status:'working'},error:null};};
   await assert.rejects(()=>h.ocsProviderActionLive('complete',''),/completion not confirmed/);
   assert.equal(h.applied.length,0);
 }],
 ['Backend confirmation must refer to the requested booking ID',async()=>{
   const h=harness();
   h.ocsSupabase.rpc=async(name,args)=>{h.calls.push({name,args});return {data:{id:'different-booking-uuid',status:'accepted'},error:null};};
   await assert.rejects(()=>h.ocsProviderDecisionLive('accept'),/booking ID mismatch/i);
   assert.equal(h.applied.length,0);
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
 ['Wrong Start OTP must not report success when backend keeps reached status',async()=>{
   const h=harness();
   h.ocsSupabase.rpc=async(name,args)=>{h.calls.push({name,args});return {data:{id:'test-booking-uuid',status:'reached'},error:null};};
   await assert.rejects(()=>h.ocsProviderActionLive('start','000000'),/Incorrect Start OTP/);
   assert.equal(h.applied.length,0);
 }],
 ['Locked Start OTP must not report success',async()=>{
   const h=harness();
   h.ocsSupabase.rpc=async(name,args)=>{h.calls.push({name,args});return {data:{id:'test-booking-uuid',status:'reached',otp_locked_until:new Date(Date.now()+900000).toISOString()},error:null};};
   await assert.rejects(()=>h.ocsProviderActionLive('start','111111'),/locked/);
   assert.equal(h.applied.length,0);
 }],
 ['Invalid provider actions and malformed start OTP never reach backend',async()=>{
   for(const [action,otp] of [['cancel','123456'],['start','123'],['start','1234'],['start','12ab'],['start','']]){
     const h=harness();
     await assert.rejects(()=>h.ocsProviderActionLive(action,otp),/Invalid provider job action|Start OTP must be exactly 6 digits/);
     assert.equal(h.calls.length,0);
     assert.equal(h.applied.length,0);
   }
 }],
 ['Missing booking ID cannot report OTP verified / work started',async()=>{
   const h=harness({bookingId:null});
   await assert.rejects(()=>h.ocsProviderActionLive('start','123456'),/Booking ID missing/);
   assert.equal(h.calls.length,0);assert.equal(h.applied.length,0);
 }],
 ['Backend OTP error does not update the working job state',async()=>{
   const h=harness({failRpc:'provider_booking_action'});
   await assert.rejects(()=>h.ocsProviderActionLive('start','123456'),/Test backend error/);
   assert.equal(h.applied.length,0);assert.equal(h.S.status,'REQUESTED');
 }],
 ['Start OTP response for a different booking must not update current job',async()=>{
   const h=harness();h.ocsSupabase.rpc=async()=>({data:{id:'wrong-booking-id',status:'working'},error:null});
   await assert.rejects(()=>h.ocsProviderActionLive('start','123456'),/booking ID mismatch/);
   assert.equal(h.applied.length,0);assert.equal(h.S.status,'REQUESTED');
 }],
 ['Complete response for a different booking must not update current job',async()=>{
   const h=harness();h.ocsSupabase.rpc=async()=>({data:{id:'wrong-booking-id',status:'completion_requested'},error:null});
   await assert.rejects(()=>h.ocsProviderActionLive('complete',''),/booking ID mismatch/);
   assert.equal(h.applied.length,0);assert.equal(h.S.status,'REQUESTED');
 }],
 ['Complete action must be confirmed by backend before UI advances',async()=>{
   const h=harness();await h.ocsProviderActionLive('complete','');
   const call=h.calls.find(c=>c.name==='provider_booking_action');
   assert(call);assert.equal(call.args.p_action,'complete');assert.equal(h.applied.length,1);
 }],
 ['Failed completion must not mark job complete locally',async()=>{
   const h=harness({failRpc:'provider_booking_action'});
   await assert.rejects(()=>h.ocsProviderActionLive('complete',''),/Test backend error/);
   assert.equal(h.applied.length,0);assert.equal(h.S.status,'REQUESTED');
 }],
 ['No login cannot accept or complete another provider booking',async()=>{
   const h=harness({loggedIn:false});
   await assert.rejects(()=>h.ocsProviderDecisionLive('accept'),/OCS_LOGIN_REDIRECT/);
   assert.equal(h.calls.length,0);assert.equal(h.applied.length,0);
 }],
 ['No login cannot reject, start or complete a provider job',async()=>{
   for(const [method,args] of [
     ['ocsProviderDecisionLive',['reject']],
     ['ocsProviderActionLive',['start','123456']],
     ['ocsProviderActionLive',['complete','']]
   ]){
     const h=harness({loggedIn:false});
     await assert.rejects(()=>h[method](...args),/OCS_LOGIN_REDIRECT/);
     assert.equal(h.calls.length,0);
     assert.equal(h.applied.length,0);
     assert.equal(h.S.status,'REQUESTED');
     assert.match(h.location.href,/login=1/);
   }
 }],
 ['Provider availability requires login and backend confirmation',async()=>{
   const noLogin=harness({loggedIn:false});
   await assert.rejects(()=>noLogin.ocsToggleAvailabilityLive(true),/OCS_LOGIN_REDIRECT/);
   assert.equal(noLogin.calls.length,0);
   const ok=harness();
   await ok.ocsToggleAvailabilityLive(false);
   assert.equal(ok.calls[0].name,'set_provider_available');
   assert.equal(ok.calls[0].args.p_available,false);
   const failed=harness({failRpc:'set_provider_available'});
   await assert.rejects(()=>failed.ocsToggleAvailabilityLive(true),/Test backend error/);
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
