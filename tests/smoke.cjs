/* OCS non-payment regression smoke checks.
 * No live account, payment, booking or database writes. Run: node tests/smoke.cjs */
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const index=read('index.html');
const photoJS=read('assets/ocs-photo-services.js');
const categoryJS=read('assets/ocs-category-experience.js');

let passed=0;
function test(name,callback){
  try{callback();passed++;console.log('PASS '+name)}
  catch(e){console.error('FAIL '+name+': '+e.message);process.exitCode=1}
}

function makePhotoForm(saved={}){
 const editor={style:{},innerHTML:'',scrollIntoView(){editor.scrolled=true}};
 const field={value:'',files:[],scrollIntoView(){field.scrolled=true}};
 const alerts=[],released=[],draftChanges=[];
 const window={};
 const context={
  window,document:{getElementById(id){
   if(id==='ocsPhotoServiceEditor')return editor;
   if(id==='obMedia')return field;
   return null;
  }},
  URL:{createObjectURL(f){return 'blob:test/'+f.name},revokeObjectURL(x){released.push(x)}},
  alert(x){alerts.push(String(x))},
  readBizDrafts(){return saved},
  queueBizDraftAutoSave(){draftChanges.push(true)},
  validateOcsMediaFiles(files){
   const a=[...files],photos=a.filter(f=>String(f.type).startsWith('image/')).length;
   const videos=a.filter(f=>String(f.type).startsWith('video/')).length;
   if(photos>20||videos>3)throw new Error('Too many files');
   return a;
  }
 };
 vm.runInNewContext(photoJS,context,{timeout:2500,filename:'ocs-photo-services.js'});
 return {window,editor,field,alerts,released,draftChanges};
}

test('JavaScript syntax: all inline scripts, photo metadata and category shell',()=>{
 const scripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m=>!/\bsrc=/.test(m[1])).map(m=>m[2]);
 assert(scripts.length>0);
 for(let i=0;i<scripts.length;i++)new vm.Script(scripts[i],{filename:'index-inline-'+i+'.js'});
 new vm.Script(photoJS);new vm.Script(categoryJS);
});

test('Beauty: 2 photos create name, rate, description fields',()=>{
 const f=makePhotoForm();
 f.window.ocsPortfolioLoad('Beauty / Make-up',{});
 assert.match(f.editor.innerHTML,/0 \/ 20/);
 f.field.files=[{name:'bridal.jpg',type:'image/jpeg'},{name:'party.png',type:'image/png'}];
 f.window.ocsPortfolioOnMediaChange(f.field.files);
 assert.match(f.editor.innerHTML,/2 \/ 20/);
 assert.match(f.editor.innerHTML,/Look \/ Service Name/);
 assert.match(f.editor.innerHTML,/type="number"/);
 f.window.ocsPortfolioField(0,'name','Bridal Makeup');
 f.window.ocsPortfolioField(0,'price','3500');
 f.window.ocsPortfolioField(1,'name','Party Makeup');
 assert.equal(f.window.ocsPortfolioValidate('Beauty / Make-up'),true);
 const media=[{url:'https://example.test/bridal.jpg',name:'bridal.jpg',type:'image'},
              {url:'https://example.test/party.png',name:'party.png',type:'image'}];
 const result=f.window.ocsPortfolioAttachMedia('Beauty / Make-up',media);
 assert.equal(result[0].name,'Bridal Makeup');
 assert.equal(result[0].price,'3500');
 assert.equal(result[0].image,'https://example.test/bridal.jpg');
 assert.equal(result[1].name,'Party Makeup');
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up')[0].price,'3500');
});

test('Draft restored with uploaded photos keeps names and rates',()=>{
 const f=makePhotoForm();
 const old={media:[{type:'image',name:'one.jpg',url:'https://example.test/one.jpg'}],
    photoServices:[{filename:'one.jpg',image:'https://example.test/one.jpg',name:'Wedding Makeup',price:'4100',details:'Wedding'}]};
 f.window.ocsPortfolioLoad('Beauty / Make-up',old);
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up')[0].price,'4100');
 assert.equal(f.window.ocsPortfolioValidate('Beauty / Make-up'),true);
});

test('Reload before upload preserves service data but safely requires photo reselect',()=>{
 const draft={photoServices:[{filename:'bridal.jpg',name:'Bridal Makeup',price:'3000'}]};
 const f=makePhotoForm({'Beauty / Make-up':draft});
 f.window.ocsPortfolioLoad('Beauty / Make-up',draft);
 assert.match(f.editor.innerHTML,/Bridal Makeup/);
 assert.match(f.editor.innerHTML,/Photo reselect karein/);
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up')[0].price,'3000');
 assert.equal(f.window.ocsPortfolioValidate('Beauty / Make-up'),false);
 assert.match(f.alerts.at(-1),/dobara Choose Files/);
 f.field.files=[{name:'bridal.jpg',type:'image/jpeg'}];
 f.window.ocsPortfolioOnMediaChange(f.field.files);
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up')[0].price,'3000');
 assert.equal(f.window.ocsPortfolioValidate('Beauty / Make-up'),true);
});

test('Cancel photo selection does not erase existing rate',()=>{
 const f=makePhotoForm();
 f.window.ocsPortfolioLoad('Beauty / Make-up',{});
 f.window.ocsPortfolioOnMediaChange([{name:'abc.jpg',type:'image/jpeg'}]);
 f.window.ocsPortfolioField(0,'name','Makeup');
 f.window.ocsPortfolioField(0,'price','1500');
 f.window.ocsPortfolioOnMediaChange([]);
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up')[0].price,'1500');
});

test('Missing name and invalid rate are blocked',()=>{
 const f=makePhotoForm();
 f.window.ocsPortfolioLoad('Beauty / Make-up',{});
 f.window.ocsPortfolioOnMediaChange([{name:'abc.jpg',type:'image/jpeg'}]);
 assert.equal(f.window.ocsPortfolioValidate('Beauty / Make-up'),false);
 f.window.ocsPortfolioField(0,'name','Bridal');
 f.window.ocsPortfolioField(0,'price','-30');
 assert.equal(f.window.ocsPortfolioValidate('Beauty / Make-up'),false);
});

test('Limits: more than 20 images or 3 videos rejected',()=>{
 const f=makePhotoForm();
 f.window.ocsPortfolioLoad('Beauty / Make-up',{});
 const images=Array.from({length:21},(_,i)=>({name:i+'.jpg',type:'image/jpeg'}));
 f.window.ocsPortfolioOnMediaChange(images);
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up').length,0);
 assert(f.alerts.length);
 const videos=Array.from({length:4},(_,i)=>({name:i+'.mp4',type:'video/mp4'}));
 f.window.ocsPortfolioOnMediaChange(videos);
 assert.equal(f.window.ocsPortfolioDraft('Beauty / Make-up').length,0);
});

test('All four visual categories have a photo-wise entry form',()=>{
 const f=makePhotoForm();
 for(const cat of ['Beauty / Make-up','Sliding / Aluminium','Welding / Fabrication','Modular Kitchen']){
  f.window.ocsPortfolioLoad(cat,{});
  assert.equal(f.window.ocsPortfolioHasCategory(cat),true);
  assert.match(f.editor.innerHTML,/Photo-wise Name & Rate/);
 }
});

test('Metadata saved and customer enquiry targets the selected owner',()=>{
 for(const marker of [
  'ocsPortfolioOnMediaChange(this.files)',
  "photoServices:window.ocsPortfolioHasCategory?.(cat)?photoServices:previous.photoServices",
  "const photoServices=window.ocsPortfolioAttachMedia?.(cat,media)||[]",
  "const photoServicesHtml=",
  "p_listing_id:id",
  "parent.__ocsLiveFeed['+i+'].photoServices['+p.__serviceIndex+']",
  "if(window.ocsPortfolioValidate&&!window.ocsPortfolioValidate(cat))return;"
 ])assert(index.includes(marker),'Missing wiring: '+marker);
});

test('Mobile loads newest JavaScript and CSS online; offline cache remains fallback',()=>{
 const sw=read('service-worker.js');
 new vm.Script(sw,{filename:'service-worker.js'});
 assert(sw.includes("const OCS_CACHE='ocs-shell-v46'"));
 assert(sw.includes("const isAppCode=/\\.(?:html|js|mjs|css)$/i.test(url.pathname);"));
 const networkFirst=sw.indexOf("if(isAppCode)");
 const cacheFirst=sw.indexOf("caches.match(req,{ignoreSearch:true}).then(cached=>");
 assert(networkFirst>0 && cacheFirst>networkFirst);
 assert(sw.includes("fetch(req,{cache:'no-cache'})"));
 assert(sw.includes("catch(async()=> (await caches.match(req))"));
});

test('No accidental navigation via duplicate category-wide Enquiry button',()=>{
 assert(!index.includes("try{injectCompactWindowEnquiry(n)}"));
});

console.log('\nOCS smoke checks: '+passed+' passed, '+(process.exitCode?'failures detected':'0 failed'));
