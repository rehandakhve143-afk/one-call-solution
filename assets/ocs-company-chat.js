(function(){
'use strict';
let who=null;
const wrap=document.createElement('section');
wrap.id='ocsCompanyChat';
wrap.hidden=true;
wrap.style.cssText='position:fixed;inset:0;z-index:99999;background:#f4f8f8;display:none;flex-direction:column;color:#153b40;font:14px system-ui';
wrap.innerHTML='<header style="background:#064d59;color:#fff;padding:17px;display:flex;justify-content:space-between;align-items:center"><b>OCS Company Support</b><button type="button" id="ocsChatClose" style="padding:9px;border:0;border-radius:8px">Close</button></header><p style="margin:12px;color:#426269">Messages go to OCS Company, not the Driver. For emergencies use phone services.</p><div id="ocsChatMessages" style="flex:1;overflow:auto;padding:14px"></div><div id="ocsChatError" role="status" style="padding:4px 14px;color:#a52929"></div><form id="ocsCompanySend" style="display:flex;gap:8px;padding:14px;background:#fff"><input id="ocsCompanyInput" maxlength="2000" required placeholder="Message to OCS Company" style="flex:1;min-width:0;padding:13px;border:1px solid #cadcde;border-radius:12px"><button type="submit" style="background:#05766f;color:white;border:0;border-radius:11px;padding:12px">Send</button></form><a id="ocsWhatsAppBackup" hidden target="_blank" rel="noopener noreferrer" style="margin:0 14px 16px;color:#05766f">WhatsApp Business backup</a>';
document.body.appendChild(wrap);
const get=id=>document.getElementById(id),html=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function refresh(){
if(wrap.hidden)return;
try{
const args=who?{p_customer_id:who}:{};
const {data,error}=await sb.rpc('ocs_driver_company_thread_v1',args);
if(error)throw error;
const messages=(data&&data.messages)||[];
get('ocsChatMessages').innerHTML=messages.length?messages.map(m=>'<div style="margin-bottom:12px;padding:11px;background:'+(m.sender_role==='company'?'#e5f7f0':'white')+';border-radius:12px"><b>'+(m.sender_role==='company'?'OCS Company':'Customer')+'</b><p style="white-space:pre-wrap;margin:5px 0">'+html(m.message)+'</p><small>'+html(new Date(m.created_at).toLocaleString('en-IN'))+'</small></div>').join(''):'<p>OCS Support ko apna message bhejein.</p>';
get('ocsChatError').textContent='';
}catch(e){get('ocsChatError').textContent=e.message||'Chat load failed'}
}
async function open(customerId){
const {data}=await sb.auth.getSession();
if(!data||!data.session){location.href='index.html?login=1';return}
who=customerId||null;wrap.hidden=false;wrap.style.display='flex';get('ocsChatMessages').innerHTML='Loading…';await refresh();
try{const r=await sb.rpc('ocs_company_whatsapp_v1');const phone=String(r.data||'');const a=get('ocsWhatsAppBackup');a.hidden=!/^[6-9][0-9]{9}$/.test(phone);if(!a.hidden)a.href='https://wa.me/91'+phone;}catch(e){}
}
get('ocsChatClose').onclick=()=>{wrap.hidden=true;wrap.style.display='none'};
get('ocsCompanySend').onsubmit=async e=>{
e.preventDefault();const input=get('ocsCompanyInput'),message=input.value.trim();if(!message)return;
const b=e.target.querySelector('button');b.disabled=true;
try{
const args={p_message:message};if(who)args.p_customer_id=who;
const r=await sb.rpc('ocs_driver_company_send_v1',args);
if(r.error)throw r.error;input.value='';await refresh();get('ocsChatMessages').scrollTop=get('ocsChatMessages').scrollHeight;
}catch(e){get('ocsChatError').textContent=e.message||'Message not sent'}finally{b.disabled=false}
};
window.ocsOpenCompanyChat=open;
window.ocsRefreshCompanyChat=refresh;
setInterval(()=>{if(!wrap.hidden)refresh()},12000);
})();