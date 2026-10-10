/* OCS: photo-wise service names and rates for visual-work listings. */
(function(){
 'use strict';
 const labels={
  'Beauty / Make-up':['Look / Service Name','e.g. Bridal Make-up','Rate / Starting Price ₹','e.g. 2500'],
  'Sliding / Aluminium':['Design / Work Name','e.g. Sliding Window','Starting Rate ₹','Optional'],
  'Welding / Fabrication':['Work Name','e.g. Steel Gate','Starting Rate ₹','Optional'],
  'Modular Kitchen':['Design / Project Name','e.g. L-Shape Kitchen','Starting Rate ₹','Optional']
 };
 let active='',items=[],objectUrls=[];
 const escapeHTML=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
 const isImage=f=>String(f.type||'').startsWith('image/')||/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(f.name||'');
 function cleanup(){objectUrls.forEach(u=>URL.revokeObjectURL(u));objectUrls=[]}
 function clean(x){return {filename:String(x.filename||'').slice(0,180),image:String(x.image||''),name:String(x.name||'').slice(0,120),price:String(x.price==null?'':x.price).slice(0,30),details:String(x.details||'').slice(0,250)}}
 function render(){
  const box=document.getElementById('ocsPhotoServiceEditor');
  if(!box)return;
  if(!labels[active]){box.style.display='none';return}
  box.style.display='block';
  const cfg=labels[active],count=items.length;
  box.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><b style="font-size:16px;color:#17474e">Photo-wise Name & Rate</b><b style="color:#087a70;font-size:12px">'+count+' / 20</b></div>'+
  '<p style="font-size:12px;color:#647b80;line-height:1.5;margin:6px 0 12px">Har selected photo ke neeche us service ka naam aur rate likhiye. Rate optional hai; khaali rakhein to customer ko Get Quote dikhega.</p>'+
  (!count?'<div style="padding:14px;background:white;border:1px dashed #b9d5d0;border-radius:12px;color:#59717a;font-size:12px">Upar Photos / Videos mein Choose Files dabakar photos select karein. Har photo ka alag Name aur Rate box yahan aa jayega.</div>':
  items.map((x,i)=>'<div style="display:grid;grid-template-columns:94px minmax(0,1fr);gap:12px;padding:12px;margin:0 0 10px;background:#fff;border:1px solid #dce8e6;border-radius:14px">'+
    '<div><div style="width:94px;height:98px;border-radius:10px;background:#eef3f3;overflow:hidden">'+(x._preview||x.image?'<img alt="Service photo '+(i+1)+'" src="'+escapeHTML(x._preview||x.image)+'" style="width:100%;height:100%;object-fit:cover">':'<span style="font-size:11px;display:block;padding:12px">Photo '+(i+1)+'</span>')+'</div><small style="font-size:9px;color:#6d8183;display:block;overflow-wrap:anywhere;padding-top:5px">Photo '+(i+1)+'</small></div>'+
    '<div style="min-width:0">'+
    '<label style="display:block;font-size:12px;margin:0 0 5px">'+cfg[0]+' *</label>'+
    '<input maxlength="120" value="'+escapeHTML(x.name)+'" placeholder="'+cfg[1]+'" oninput="ocsPortfolioField('+i+',\'name\',this.value)" style="width:100%;box-sizing:border-box;min-height:41px;padding:9px;font-size:13px">'+
    '<label style="display:block;font-size:12px;margin:9px 0 5px">'+cfg[2]+' (optional)</label>'+
    '<input type="number" min="0" step="1" inputmode="decimal" value="'+escapeHTML(x.price)+'" placeholder="'+cfg[3]+'" oninput="ocsPortfolioField('+i+',\'price\',this.value)" style="width:100%;box-sizing:border-box;min-height:41px;padding:9px;font-size:13px">'+
    '<label style="display:block;font-size:12px;margin:9px 0 5px">Short Details (optional)</label>'+
    '<input maxlength="250" value="'+escapeHTML(x.details)+'" placeholder="Work details, package, size..." oninput="ocsPortfolioField('+i+',\'details\',this.value)" style="width:100%;box-sizing:border-box;min-height:41px;padding:9px;font-size:13px"></div></div>').join(''));
 }
 window.ocsPortfolioField=function(i,key,v){
  if(items[i]&&['name','price','details'].includes(key)){items[i][key]=v;if(typeof queueBizDraftAutoSave==='function')queueBizDraftAutoSave()}
 };
 window.ocsPortfolioLoad=function(cat,d){
  cleanup();active=labels[cat]?cat:'';
  const editor=document.getElementById('ocsPhotoServiceEditor');
  if(editor)editor.style.display=active?'block':'none';
  const source=Array.isArray(d&&d.photoServices)?d.photoServices.slice(0,20).map(clean):[];
  const media=Array.isArray(d&&d.media)?d.media.filter(x=>x&&x.type==='image').slice(0,20):[];
  items=media.length?media.map((m,i)=>{
    const saved=source.find(x=>x.image&&x.image===m.url)||source[i]||{};
    return {...clean(saved),image:m.url,filename:String(m.name||saved.filename||'')};
  }):[];
  render();
 };
 window.ocsPortfolioOnMediaChange=function(files){
  if(!labels[active])return;
  const selected=Array.from(files||[]);
  try{if(typeof validateOcsMediaFiles==='function')validateOcsMediaFiles(selected)}
  catch(e){alert(String(e&&e.message||'Maximum 20 photos + 3 videos'));const field=document.getElementById('obMedia');if(field)field.value='';return}
  const previous=items.slice(),draft=typeof readBizDrafts==='function'?(readBizDrafts()[active]||{}):{};
  const older=Array.isArray(draft.photoServices)?draft.photoServices:[];
  cleanup();
  items=selected.filter(isImage).slice(0,20).map((f,i)=>{
   const former=previous.find(x=>x.filename===f.name)||older.find(x=>x.filename===f.name)||previous[i]||older[i]||{};
   const u=URL.createObjectURL(f);objectUrls.push(u);
   return {...clean(former),image:'',filename:f.name,_preview:u};
  });
  render();
  if(typeof queueBizDraftAutoSave==='function')queueBizDraftAutoSave();
 };
 window.ocsPortfolioDraft=function(cat){
  if(!labels[cat]||active!==cat)return [];
  return items.map(clean);
 };
 window.ocsPortfolioValidate=function(cat){
  if(!labels[cat]||active!==cat)return true;
  for(let i=0;i<items.length;i++){
   const x=items[i],p=String(x.price==null?'':x.price).trim();
   if(!String(x.name||'').trim()){alert('Photo '+(i+1)+' ka service / work name bharein.');document.getElementById('ocsPhotoServiceEditor')?.scrollIntoView({block:'start',behavior:'auto'});return false}
   if(p&&(!Number.isFinite(Number(p))||Number(p)<0)){alert('Photo '+(i+1)+' ka rate valid nahi hai.');return false}
  }
  return true;
 };
 window.ocsPortfolioAttachMedia=function(cat,media){
  if(!labels[cat]||active!==cat)return [];
  const photos=(Array.isArray(media)?media:[]).filter(m=>m&&m.type==='image').slice(0,20);
  return photos.map((m,i)=>{
   const record=clean(items[i]||{});record.image=String(m.url||'');record.filename=String(m.name||record.filename||'');return record;
  });
 };
 window.ocsPortfolioHasCategory=cat=>!!labels[cat];
})();