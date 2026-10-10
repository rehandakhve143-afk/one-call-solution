/* OCS: premium category distinction without touching listing/payment business logic. */
(function(){
'use strict';
const designs={
'Local Shop':['ELECTRICAL & HARDWARE','Find local shops','See products and contact the specific shop.','#075460','photo-1586864387967-d02ef85d93e8','shops'],
'Property':['PROPERTIES & PROJECTS','Find your next property','Builder projects and owner listings with photos and prices.','#795436','photo-1600585154340-be6161a56a0c','property'],
'Sliding / Aluminium':['WINDOWS & GLASS','Sliding & Aluminium','See real work and request specialist quotes.','#246880','photo-1600607687920-4e2a09cf159d','portfolio'],
'Welding / Fabrication':['METALWORK SPECIALISTS','Welding & Fabrication','Gates, grills, railings and custom metalwork.','#695342','photo-1504917595217-d4dc5ebe6122','portfolio'],
'Beauty / Make-up':['BEAUTY & BRIDAL','Beauty professionals','Explore work portfolios and request an appointment.','#985479','photo-1522337360788-8b13dee7a37e','portfolio'],
'Used Vehicle':['PRE-OWNED VEHICLES','Browse used vehicles','Price, year, kilometres, photos and direct seller contact.','#365574','photo-1503376780353-7e6692767b70','vehicles'],
'New Vehicle':['NEW VEHICLE SHOWROOMS','Find new vehicles','Explore models, variants and local showrooms.','#355a83','photo-1494976388531-d1058494cdd8','vehicles'],
'Medical Store':['PHARMACY DIRECTORY','Medical stores','Ask the individual shop about medicine and product availability.','#146d55','photo-1584308666744-24d5c474f2ae','health'],
'Diagnostic Lab':['TESTS & DIAGNOSTICS','Diagnostic labs','Find labs, packages and sample collection information.','#246b91','photo-1532187863486-abf9dbad1b69','health'],
'Modular Kitchen':['KITCHEN INTERIORS','Modular kitchen design','View completed projects and request a quote.','#6d6745','photo-1556911220-bff31c812dba','portfolio'],
'Hotel / Restaurant / Lodging':['STAYS & DINING','Hotels & restaurants','Browse places, rooms and facilities; contact each business.','#78573f','photo-1566073771259-6a8506099945','hospitality']
};
window.ocsApplyWindowPolish=function(cat,frame){
const d=designs[cat];if(!d||!frame)return;
let doc;try{doc=frame.contentDocument}catch(e){return}
if(!doc||!doc.body||!doc.head)return;
const [kicker,title,subtitle,accent,image,type]=d;
doc.body.classList.add('ocs-category-polished','ocs-category-'+type);
doc.body.style.setProperty('--ocs-cat-accent',accent);
if(!doc.getElementById('ocsCategoryPolishCss')){
 const st=doc.createElement('style');st.id='ocsCategoryPolishCss';
 st.textContent=[
 ':root,html,body{scroll-behavior:auto!important;overflow-x:hidden!important;overscroll-behavior-x:none!important}',
 'body>.app{max-width:760px!important;width:100%!important;min-height:0!important;margin:0 auto!important;overflow:visible!important;padding-bottom:36px!important}',
 'body>.app>header,body>.app>.hero,body>.app>main#customer>.hero{display:none!important}',
 '#ocsPremiumCategoryHeader{position:relative;isolation:isolate;box-sizing:border-box;min-height:174px;margin:12px 13px 8px;padding:23px 18px;border-radius:20px;overflow:hidden;color:#fff;background:#075460 center/cover no-repeat}',
 '#ocsPremiumCategoryHeader:before{content:"";position:absolute;z-index:-1;inset:0;background:linear-gradient(95deg,rgba(9,27,34,.94),rgba(9,27,34,.73) 54%,rgba(9,27,34,.12))}',
 '#ocsPremiumCategoryHeader .ocsCatKicker{display:block;max-width:85%;font:850 9px/1.3 system-ui,Arial;letter-spacing:1.3px;color:#d5f4ed}',
 '#ocsPremiumCategoryHeader h1{max-width:85%;font:850 24px/1.08 system-ui,Arial!important;letter-spacing:-.6px;margin:12px 0 10px!important;color:#fff!important}',
 '#ocsPremiumCategoryHeader p{max-width:86%;font:500 11px/1.5 system-ui,Arial!important;margin:0!important;color:#e7f4f4!important}',
 'body>.app>.sec,body>.app>.section,body>.app>main#customer>.sec{padding:12px 14px 24px!important;margin:0 auto!important;max-width:760px!important}',
 'body>.app .sec>.head h1,body>.app .sec>.head h2,body>.app .section>.headrow h2{font-size:19px!important;line-height:1.2!important;letter-spacing:-.3px!important}',
 'body>.app .chips,body>.app .filters{display:flex!important;gap:8px!important;overflow-x:auto!important;overflow-y:hidden!important;max-width:100%!important;padding:7px 0 12px!important;scrollbar-width:none!important}',
 'body>.app .chip,body>.app .pill{flex:0 0 auto!important;min-height:38px!important;white-space:nowrap!important;font-size:11px!important;border-radius:999px!important;padding:9px 13px!important;box-shadow:none!important}',
 'body>.app .chip.on,body>.app .pill.on{background:var(--ocs-cat-accent)!important;border-color:var(--ocs-cat-accent)!important;color:white!important}',
 'body>.app .card{max-width:100%!important;box-sizing:border-box!important;overflow:hidden!important;border-radius:16px!important;box-shadow:0 4px 16px rgba(14,44,56,.055)!important}',
 'body.ocs-category-polished:not(.ocs-category-property) .app .sec>#list{display:none!important}',
 'body.ocs-category-polished:not(.ocs-category-property) .app .sec>.card{display:none!important}',
 'body.ocs-category-polished .app{overflow-x:hidden!important}',
 '#ocsXyzDemoCard .xyzBigSlider.upper{height:176px!important;overflow:hidden!important}',
 '#ocsXyzDemoCard .xyzBigSlider.upper img{aspect-ratio:16/10!important;height:176px!important;object-fit:cover!important}',
 '#ocsXyzDemoCard .xyzBigSlider.upper img:not(:first-child){display:none!important}',
 '#ocsXyzDemoCard .xyzBigSlider.lower,#ocsXyzDemoCard video{display:none!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview{display:grid!important;grid-template-columns:112px minmax(0,1fr)!important;min-height:132px!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfBigSlider.upper{height:100%!important;max-height:165px!important;overflow:hidden!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfBigSlider.upper img{width:112px!important;height:165px!important;flex:0 0 112px!important;object-fit:cover!important;aspect-ratio:auto!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfBigSlider.upper img:not(:first-child){display:none!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfBigSlider.lower,#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfVideoRail{display:none!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfBody{padding:11px!important;min-width:0!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview h3{font-size:14px!important;line-height:1.3!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfBadge{font-size:8px!important}',
 '#ocsLiveCategoryFeed .lfCard.ocs-sample-preview .lfPrice{font-size:14px!important}',

 '#ocsLiveCategoryFeed,#ocsXyzDemoCard{box-sizing:border-box!important;width:auto!important;min-width:0!important;max-width:100%!important;margin:13px 14px 18px!important}',
 '#ocsLiveCategoryFeed .lfRail{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;overflow:visible!important;scroll-snap-type:none!important;padding:0!important}',
 '#ocsLiveCategoryFeed .lfCard{min-width:0!important;max-width:100%!important;width:100%!important;border-radius:16px!important;scroll-snap-align:none!important;box-shadow:0 4px 14px rgba(14,44,56,.055)!important}',
 '#ocsLiveCategoryFeed .lfBigSlider,#ocsXyzDemoCard .xyzBigSlider{scroll-snap-type:x proximity!important;overscroll-behavior-x:contain!important}',
 '#ocsLiveCategoryFeed .lfBigSlider img{aspect-ratio:16/10!important}',
 'body.ocs-category-portfolio #ocsLiveCategoryFeed .lfBigSlider img{aspect-ratio:4/3!important}',
 '#ocsLiveCategoryFeed .lfBody{padding:14px!important}',
 '#ocsLiveCategoryFeed .lfBody h3{font-size:17px!important}',
 '#ocsLiveCategoryFeed .lfPrice{color:var(--ocs-cat-accent)!important}',
 '#ocsBusinessLikeBar{position:static!important;inset:auto!important;box-shadow:none!important;border:0!important;background:transparent!important;padding:2px!important;margin:2px 14px 10px auto!important;width:max-content!important}',
 'body:has(.modal.show) #ocsBusinessLikeBar{display:none!important}',
 '.modal.show,.modal.show>.sheet{overscroll-behavior:contain!important}',
 '@media(max-width:360px){#ocsPremiumCategoryHeader{min-height:160px;padding:18px 15px}#ocsPremiumCategoryHeader h1{font-size:22px!important}#ocsLiveCategoryFeed,#ocsXyzDemoCard{margin-left:10px!important;margin-right:10px!important}}',
 '@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}'
 ].join('\n');
 doc.head.appendChild(st);
}
if(!doc.getElementById('ocsPremiumCategoryHeader')){
 const mast=doc.createElement('section');mast.id='ocsPremiumCategoryHeader';
 mast.setAttribute('aria-label',cat+' introduction');
 mast.style.backgroundImage="url('https://images.unsplash.com/"+image+"?auto=format&fit=crop&w=1100&q=78')";
 const k=doc.createElement('span');k.className='ocsCatKicker';k.textContent=kicker;
 const h=doc.createElement('h1');h.textContent=title;
 const p=doc.createElement('p');p.textContent=subtitle;
 mast.append(k,h,p);
 const root=doc.querySelector('body>.app')||doc.body;
 const anchor=root.querySelector(':scope > main#customer,:scope > .hero,:scope > .section,:scope > .sec')||root.firstElementChild;
 if(anchor)root.insertBefore(mast,anchor);else root.appendChild(mast);
}
};
})();