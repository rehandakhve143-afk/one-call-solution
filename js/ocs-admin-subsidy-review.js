/* OCS Admin subsidy review: recording only, no money transfer. */
(function(){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function open(){
  if(typeof ocsUserHasRole!=='function'||!await ocsUserHasRole('admin')){alert('OCS Admin only');return}
  if(typeof ocsSupabase==='undefined'||!ocsSupabase){alert('Login / database connection required');return}
  let root=document.getElementById('ocs-subsidy-review');
  if(!root){root=document.createElement('section');root.id='ocs-subsidy-review';root.style.cssText='position:fixed;inset:0;background:#fff;z-index:2147483000;overflow:auto;padding:20px;color:#222';document.body.appendChild(root)}
  root.innerHTML='<button id="ocs-subsidy-close">← Close</button><h2>Provider Reward Subsidy — Admin Review</h2><p>Record externally sent bank transfer only after checking actual bank evidence. Verification is separate; no money is sent here.</p><div id="ocs-subsidy-rows">Loading…</div>';
  root.querySelector('#ocs-subsidy-close').onclick=()=>root.remove();
  const {data,error}=await ocsSupabase.rpc('ocs_admin_provider_subsidy_queue_v1',{p_limit:50});
  if(error){root.querySelector('#ocs-subsidy-rows').textContent=error.message;return}
  const rows=Array.isArray(data)?data:[];
  const list=root.querySelector('#ocs-subsidy-rows');
  if(!rows.length){list.textContent='No subsidy disbursement records yet.';return}
  list.innerHTML=rows.map((x,i)=>'<article style="padding:12px;border:1px solid #ddd;margin:12px 0;border-radius:8px"><b>₹'+esc(x.amount)+'</b> — '+esc(x.status)+'<p>Booking: '+esc(x.booking_id)+'<br>Provider: '+esc(x.provider_id)+'<br>Purpose: '+esc(x.purpose)+'<br>UTR: '+esc(x.bank_utr||'Not recorded')+'</p>'+(x.status==='pending'||x.status==='sent'?'<input data-utr="'+i+'" placeholder="Actual bank UTR" value="'+esc(x.bank_utr||'')+'"><button data-action="'+esc(x.status==='pending'?'sent':'verify')+'" data-row="'+i+'">'+esc(x.status==='pending'?'Mark Sent':'Verify Bank Receipt')+'</button>':'')+'</article>').join('');
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
 document.addEventListener('DOMContentLoaded',()=>{
  const b=document.createElement('button');b.textContent='Admin Subsidy Review';b.style.cssText='position:fixed;bottom:70px;right:12px;z-index:9998;padding:10px;background:#122a47;color:white;border-radius:8px;display:none';
  b.onclick=open;document.body.appendChild(b);
  if(typeof ocsUserHasRole==='function')setInterval(async()=>{try{b.style.display=await ocsUserHasRole('admin')?'block':'none'}catch(e){b.style.display='none'}},10000);
 });
})();
