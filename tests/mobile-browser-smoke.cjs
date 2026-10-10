/* OCS browser regression: simulate a mobile owner creating a photo-wise rate listing.
 * READ-ONLY browser navigation plus device-local draft; no login, payment, or DB writes.
 * Run after: npm install --no-save playwright@1.56.1 && npx playwright install chromium
 * Start local static server: python3 -m http.server 8765 --bind 127.0.0.1 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.message)));
 try{
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>typeof window.openBiz==='function'&&typeof window.ocsPortfolioOnMediaChange==='function',null,{timeout:30000});
   await page.evaluate(()=>window.openBiz('Beauty / Make-up'));
   assert(await page.locator('#bizModal').evaluate(e=>e.classList.contains('show')),'Posting form did not open');
   assert.equal(await page.locator('#bizCat').inputValue(),'Beauty / Make-up');
   const media=page.locator('#obMedia');
   await media.setInputFiles({name:'bridal.png',mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64')});
   await page.waitForFunction(()=>document.getElementById('ocsPhotoServiceEditor')?.innerText?.includes('1 / 20'));
   const photoEditor=page.locator('#ocsPhotoServiceEditor');
   const name=photoEditor.locator('input[maxlength="120"]').first();
   const rate=photoEditor.locator('input[type="number"]').first();
   await name.fill('Bridal Make-up');
   await rate.fill('3500');
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ocsBusinessDrafts')||'{}')['Beauty / Make-up']?.photoServices?.[0]?.price==='3500',
    null,{timeout:8000});
   console.log('PASS mobile browser: select photo, enter name and rate, autosave local draft');
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof window.openBiz==='function',null,{timeout:20000});
   await page.evaluate(()=>window.openBiz('Beauty / Make-up'));
   const restored=page.locator('#ocsPhotoServiceEditor');
   assert.equal(await restored.locator('input[maxlength="120"]').first().inputValue(),'Bridal Make-up');
   assert.equal(await restored.locator('input[type="number"]').first().inputValue(),'3500');
   assert.match(await restored.innerText(),/Photo reselect karein/);
   console.log('PASS mobile browser: name/rate restored after refresh; missing local image not silently treated as uploaded');
   await page.locator('#obMedia').setInputFiles({name:'bridal.png',mimeType:'image/png',
    buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64')});
   assert.equal(await page.locator('#ocsPhotoServiceEditor input[type="number"]').first().inputValue(),'3500');
   console.log('PASS mobile browser: reselected image retains matching service rate');
   await page.evaluate(()=>{window.closeBiz();window.openBiz('Local Shop')});
   assert.equal(await page.locator('#bizCat').inputValue(),'Local Shop');
   assert(await page.locator('#ocsShopProductsEditor').count(),'Local Shop needs per-product fields');
   console.log('PASS mobile browser: shop has independently named and priced product editor');
   await page.evaluate(()=>{window.closeBiz();window.openBiz('Property')});
   assert.equal(await page.locator('#bizCat').inputValue(),'Property');
   assert(await page.locator('#propertyPostTypeWrap').count(),'Property needs own posting selection');
   console.log('PASS mobile browser: Property posting selection loads');

   // Four core services are first-class home actions, not repeated secondary cards.
   for(const pathname of ['customer-launch-v1.html','provider-dashboard.html','driver-service.html','transport.html']){
     await page.route('**/'+pathname+'*',route=>route.fulfill({
       status:200,contentType:'text/html',body:'<!doctype html><title>OCS route smoke</title><main>Target route loaded</main>'
     }));
   }
   const routes=[
      {cls:'ocs-core-customer',dest:'customer-launch-v1.html'},
      {cls:'ocs-core-sp',dest:'provider-dashboard.html'},
      {cls:'ocs-core-driver',dest:'driver-service.html'},
      {cls:'ocs-core-transport',dest:'transport.html'}
   ];
   for(const x of routes){
     await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>typeof window.openModule==='function');
     const tile=page.locator('#ocsMainBusiness .'+x.cls);
     await tile.click({timeout:15000});
     await page.waitForURL(new RegExp('/'+x.dest.replace(/[.*+?^$()|[\]{}]/g,'\\   // Show only essential app JS errors, not external CDN or network diagnostics.')+'\\?'),{timeout:15000});
     assert(new URL(page.url()).pathname.endsWith('/'+x.dest));
   }
   console.log('PASS mobile browser: Customer, SP, Driver and Transport direct route tiles');
   // Show only essential app JS errors, not external CDN or network diagnostics.
   if(errors.some(e=>/ocsPortfolio|openBiz|ocsShop/i.test(e)))throw Error('Critical browser errors: '+errors.join(' ; '));
   console.log('OCS mobile browser smoke PASSED');
 }catch(e){
   await page.screenshot({path:'/tmp/ocs-mobile-smoke-failure.png',fullPage:true}).catch(()=>{});
   console.error('OCS mobile browser smoke FAILED:',e.stack||e,'\nPage errors: '+errors.join(' ; '));
   process.exitCode=1;
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
