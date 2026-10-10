/* OCS Driver Hire package pricing editor (admin-only page).
 * No rate automatically goes LIVE. The admin explicitly confirms every activation.
 */
(function(){
 'use strict';
 const HOURS=[1,2,3,4,6,8,12];
 let snapshot=[];
 const root=()=>document.getElementById('driverPackagesPanel');
 const byId=id=>document.getElementById(id);
 const safeError=e=>String(e&&e.message||'Try again');
 const cash=v=>'₹'+Number(v).toLocaleString('en-IN',{maximumFractionDigits:2});
 const boxMessage=(msg,bad)=>{
   const el=byId('driverRateFeedback');
   if(el){el.textContent=msg;el.className=bad?'driver-rate-message bad':'driver-rate-message'}
 };
 const readPrice=hours=>{
   const el=byId('driverPackageRate-'+hours);
   const str=String(el&&el.value||'').trim(),num=Number(str);
   if(!str||!Number.isFinite(num)||num<=0||num>50000||Math.abs(Math.round(num*100)-num*100)>1e-6){
     throw new Error('₹1 se ₹50,000 tak valid package amount (max 2 decimals) daalein.');
   }
   return num;
 };
 async function refresh(){
   const el=root();if(!el)return;
   el.hidden=false;
   el.innerHTML='<div class="card"><h3>Driver Hire Rates</h3><div class="muted">Loading saved packages...</div></div>';
   try{
     const {data,error}=await sb.rpc('ocs_driver_packages_v1');
     if(error)throw error;
     const rows=Array.isArray(data&&data.packages)?data.packages:[];
     snapshot=HOURS.map(hours=>{
       const p=rows.find(x=>Number(x.hours)===hours)||{};
       return {hours,price:p.price==null?'':Number(p.price),active:!!p.enabled};
     });
     el.innerHTML='<div class="card"><h2>Driver Hire • Package Pricing</h2>'+
       '<p class="muted" style="font-size:12px;margin:8px 0 12px">Only Driver Hire, customer ki apni car. Har duration ka OCS price alag set karein. 9% OCS commission Driver earning se. <b>Save Draft se booking live nahi hoti.</b></p>'+
       snapshot.map(p=>'<div class="driver-rate-row">'+
         '<div class="driver-rate-main"><b>'+p.hours+' Hour'+(p.hours===1?'':'s')+'</b>'+
         '<span class="driver-rate-status'+(p.active?' on':'')+'">'+(p.active?'LIVE':'OFF')+'</span></div>'+
         '<label for="driverPackageRate-'+p.hours+'">Driver fare (₹)</label>'+
         '<input type="number" step="0.01" min="1" max="50000" inputmode="decimal" id="driverPackageRate-'+p.hours+'" value="'+p.price+'" placeholder="Enter package price">'+
         '<div class="driver-rate-actions"><button type="button" data-driver-save="'+p.hours+'">Save Draft</button>'+
         (p.active?
           '<button type="button" data-driver-toggle="'+p.hours+'" data-live="false">Turn OFF</button>':
           '<button type="button" data-driver-toggle="'+p.hours+'" data-live="true"'+(p.price===''?' disabled':'')+'>Activate Live</button>')+
         '</div></div>').join('')+
       '<button type="button" class="btn" style="margin-top:12px" id="refreshDriverRates">↻ Refresh Driver Rates</button>'+
       '<div id="driverRateFeedback" class="driver-rate-message" role="status"></div></div>';
   }catch(e){
     el.innerHTML='<div class="card"><h3>Driver Hire Rates</h3><p class="error">'+safeError(e)+'</p><button type="button" class="btn" id="refreshDriverRates">Retry</button></div>';
   }
 }
 async function change(hours,active){
   const price=readPrice(hours);
   const old=snapshot.find(p=>p.hours===hours);
   const msg=active?
     hours+' hour Driver package '+cash(price)+' ko customers ke liye LIVE karna hai?':
     old&&old.active?
     hours+' hour LIVE package OFF karna hai? Booking temporarily band hogi.':
     hours+' hour package '+cash(price)+' draft me save karein?';
   // No confirmation needed for saving a non-live draft, but always confirm publishing or disabling a live package.
   if((active||old&&old.active)&&!confirm(msg))return;
   const {error}=await sb.rpc('ocs_admin_set_driver_package_v1',{
     p_duration_hours:hours,p_package_price:price,p_active:active
   });
   if(error)throw error;
   await refresh();
   boxMessage(hours+' hour: '+cash(price)+' • '+(active?'LIVE':'Saved, not live'),false);
 }
 document.addEventListener('input',ev=>{
   const input=ev.target.closest('input[id^="driverPackageRate-"]');
   if(!input||!root()||!root().contains(input))return;
   const hours=Number(input.id.replace('driverPackageRate-',''));
   if(!HOURS.includes(hours))return;
   const publish=root().querySelector('button[data-driver-toggle="'+hours+'"][data-live="true"]');
   if(!publish)return;
   const raw=String(input.value||'').trim(),price=Number(raw);
   publish.disabled=!raw||!Number.isFinite(price)||price<=0||price>50000||Math.abs(Math.round(price*100)-price*100)>1e-6;
 });
 document.addEventListener('click',async ev=>{
   const btn=ev.target.closest('button[data-driver-save],button[data-driver-toggle],#refreshDriverRates');
   if(!btn||!root()||!root().contains(btn))return;
   if(btn.id==='refreshDriverRates'){refresh();return}
   const hours=Number(btn.dataset.driverSave||btn.dataset.driverToggle);
   if(!HOURS.includes(hours))return;
   const active=btn.hasAttribute('data-driver-toggle')&&btn.dataset.live==='true';
   btn.disabled=true;
   try{await change(hours,active)}catch(e){boxMessage(safeError(e),true);btn.disabled=false}
 });
 window.ocsLoadDriverRateAdmin=refresh;
 window.ocsHideDriverRateAdmin=()=>{const el=root();if(el)el.hidden=true};
})();