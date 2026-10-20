/* OCS Admin subsidy review: recording only, no money transfer. */
(function(){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function open(){
  if(typeof ocsUserHasRole!=='function'||!await ocsUserHasRole('admin')){alert('OCS Admin only');return}
  if(typeof ocsSupabase==='undefined'||!ocsSupabase){alert('Login / database connection required');return}
  let root=document.getElementById('ocs-subsidy-review');
  if(!root){root=document.createElement('section');root.id='ocs-subsidy-review';root.style.cssText='position:fixed;inset:0;background:#fff;z-index:2147483000;overflow:auto;padding:20px;color:#222';document.body.appendChild(root)}
  root.innerHTML=`<style>
#ocs-subsidy-review{font-family:system-ui,-apple-system,sans-serif;background:#f5f8fa!important;padding:0!important;box-sizing:border-box}
#ocs-subsidy-review *{box-sizing:border-box}
#ocs-subsidy-review .sub-wrap{max-width:760px;margin:auto;padding:22px 16px 90px}
#ocs-subsidy-review .sub-top{display:flex;align-items:center;gap:14px;margin-bottom:24px}
#ocs-subsidy-review .sub-back{border:1px solid #d9e5e8;background:#fff;border-radius:12px;padding:11px 15px;font-size:15px;font-weight:650;color:#123d47}
#ocs-subsidy-review h2{font-size:24px;line-height:1.25;color:#073c43;margin:0}
#ocs-subsidy-review .sub-muted{font-size:14px;line-height:1.55;color:#617780;margin:10px 0 18px}
#ocs-subsidy-review .sub-card{background:#fff;border:1px solid #e0e9ed;border-radius:18px;padding:18px;margin:14px 0;box-shadow:0 3px 12px #16313c09}
#ocs-subsidy-review .sub-card h3{font-size:17px;margin:0 0 10px;color:#103b45}
#ocs-subsidy-review .sub-fields{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:10px}
#ocs-subsidy-review input,#ocs-subsidy-review select{min-width:0;width:100%;padding:13px;border:1px solid #cbd9df;border-radius:12px;font-size:15px;background:#fff;color:#153942}
#ocs-subsidy-review button{cursor:pointer}
#ocs-subsidy-review .sub-primary{width:100%;margin-top:12px;border:0;border-radius:12px;background:#07565e;color:white;padding:14px;font-size:15px;font-weight:700}
#ocs-subsidy-review .sub-empty{text-align:center;padding:28px 12px}
#ocs-subsidy-review .sub-empty-icon{font-size:34px;margin-bottom:10px}
#ocs-subsidy-review .sub-record{border:1px solid #e0e9ed;background:white;padding:15px;border-radius:14px;margin:12px 0;overflow-wrap:anywhere}
#ocs-subsidy-review .sub-record p{font-size:13px;line-height:1.7;color:#50646c}
#ocs-subsidy-review .sub-record button{border:0;background:#07565e;color:#fff;padding:12px;border-radius:10px;font-weight:650;margin-top:8px}
@media(max-width:370px){#ocs-subsidy-review .sub-fields{grid-template-columns:1fr}}
</style><div class="sub-wrap"><div class="sub-top"><button class="sub-back" id="ocs-subsidy-close">← Back</button><h2>Provider Subsidy</h2></div><div class="sub-card"><h3>Customer Reward Settlement</h3><p class="sub-muted">Review OCS-funded rewards and existing bank records. This screen does not send money automatically. New bank subsidy transfers are on hold until a safe payout reservation and reconciliation process is available.</p><div class="sub-fields"><input id="ocs-subsidy-booking" placeholder="Booking ID (advanced)" aria-label="Booking ID"><select id="ocs-subsidy-purpose" aria-label="Reward type"><option value="job">Job</option><option value="visit">Visit</option></select></div><button class="sub-primary" id="ocs-subsidy-prepare">Find Applied Reward</button><p class="sub-muted">Only use a Booking ID when a reward has actually been applied. No payment is made here.</p></div><div class="sub-card"><h3>Rewards Awaiting Preparation</h3><p class="sub-muted">Applied customer rewards appear here automatically. Preparing a record does not transfer money.</p><div id="ocs-subsidy-unprepared" class="sub-muted">Loading…</div></div><div class="sub-card"><h3>Bank Transfer Records</h3><div id="ocs-subsidy-rows" class="sub-muted">Loading records…</div></div></div>`;
  root.querySelector('#ocs-subsidy-prepare').onclick=async()=>{const booking=root.querySelector('#ocs-subsidy-booking').value.trim(),purpose=root.querySelector('#ocs-subsidy-purpose').value;if(!/^[0-9a-f-]{36}$/i.test(booking)){alert('Enter valid booking UUID');return}if(!confirm('Prepare an unpaid subsidy record only for a genuine applied customer reward?'))return;const {error}=await ocsSupabase.rpc('ocs_admin_prepare_provider_subsidy_v1',{p_booking_id:booking,p_purpose:purpose});if(error){alert(error.message);return}await open()};
  root.querySelector('#ocs-subsidy-close').onclick=()=>root.remove();
  const pendingBox=root.querySelector('#ocs-subsidy-unprepared');
  const {data:unprepared,error:unpreparedError}=await ocsSupabase.rpc('ocs_admin_unprepared_rewards_v1',{p_limit:50});
  if(unpreparedError){pendingBox.textContent='Pending reward list unavailable. Existing manual preparation remains available.';}
  else {
   const pending=Array.isArray(unprepared)?unprepared:[];
   pendingBox.innerHTML=pending.length?pending.map((x,i)=>'<article class="sub-record"><b>₹'+esc(x.reward_amount)+'</b><p>Booking: '+esc(x.booking_id)+'<br>Provider: '+esc(x.provider_id)+'<br>Purpose: '+esc(x.purpose)+'</p><button data-prepare-row="'+i+'">Prepare Settlement Record</button></article>').join(''):'No applied rewards awaiting preparation.';
   pendingBox.querySelectorAll('[data-prepare-row]').forEach(b=>b.onclick=async()=>{
    const x=pending[Number(b.dataset.prepareRow)];
    if(!confirm('Create an unpaid settlement record for this applied reward? No money is sent.'))return;
    b.disabled=true;
    const {error:prepareError}=await ocsSupabase.rpc('ocs_admin_prepare_provider_subsidy_v1',{p_booking_id:x.booking_id,p_purpose:x.purpose});
    if(prepareError){alert(prepareError.message);b.disabled=false;return}
    await open();
   });
  }
  const {data,error}=await ocsSupabase.rpc('ocs_admin_provider_subsidy_queue_v1',{p_limit:50});
  if(error){root.querySelector('#ocs-subsidy-rows').textContent=error.message;return}
  const rows=Array.isArray(data)?data:[];
  const list=root.querySelector('#ocs-subsidy-rows');
  if(!rows.length){list.innerHTML='<div class="sub-empty"><div class="sub-empty-icon">✓</div><strong>No pending subsidy records</strong><p class="sub-muted">When a customer reward is applied to a booking, its verified settlement record can be prepared and tracked here.</p></div>';return}
  list.innerHTML=rows.map((x,i)=>'<article class="sub-record"><b>₹'+esc(x.amount)+'</b> — '+esc(x.status)+'<p>Booking: '+esc(x.booking_id)+'<br>Provider: '+esc(x.provider_id)+'<br>Purpose: '+esc(x.purpose)+'<br>UTR: '+esc(x.bank_utr||'Not recorded')+'</p>'+(x.status==='sent'?'<input data-utr="'+i+'" placeholder="Actual bank UTR" value="'+esc(x.bank_utr||'')+'"><button data-action="verify" data-row="'+i+'">Verify Bank Receipt</button>':x.status==='pending'?'<p class="sub-muted">Bank payout on hold: reservation and reconciliation safeguards are not yet enabled.</p>':'')+'</article>').join('');
  list.querySelectorAll('button[data-action]').forEach(b=>b.onclick=async()=>{
   const x=rows[Number(b.dataset.row)],utr=list.querySelector('[data-utr="'+b.dataset.row+'"]').value.trim();
   const action=b.dataset.action;
   if(!confirm(action==='verify'?'Have you independently confirmed the bank statement receipt and matching UTR?':'Has the bank transfer actually been sent and its UTR confirmed?'))return;
   b.disabled=true;
   const rpc=action==='verify'?'ocs_admin_verify_provider_subsidy_v1':'ocs_admin_mark_provider_subsidy_sent_v1';
   const {error}=await ocsSupabase.rpc(rpc,{p_disbursement_id:x.id,p_bank_utr:utr});
   if(error){alert(error.message);b.disabled=false;return}
   await open();
  });
 }
 window.ocsOpenAdminSubsidyReview=open;
 function mountAdminSubsidyButton(){
  const b=document.createElement('button');b.textContent='Admin Subsidy Review';b.style.cssText='position:fixed;bottom:70px;right:12px;z-index:9998;padding:10px;background:#122a47;color:white;border-radius:8px;display:none';
  b.onclick=open;document.body.appendChild(b);
  const refresh=async()=>{try{b.style.display=typeof ocsUserHasRole==='function'&&await ocsUserHasRole('admin')?'block':'none'}catch(e){b.style.display='none'}};
  refresh();setInterval(refresh,10000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountAdminSubsidyButton,{once:true});
 else mountAdminSubsidyButton();
})();
