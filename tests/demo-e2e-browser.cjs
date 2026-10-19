'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/ocs-test-mode.html');
  const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ocs_test_mode_demo_v1')));
  await page.evaluate(()=>makeBooking());
  assert.equal((await state()).booking.status,'searching');
  await page.evaluate(()=>{toggleWork();setRole('sp')});
  assert.equal((await state()).workOn,false);
  assert.match(await page.locator('body').innerText(),/Turn Work ON & Accept TEST Booking/);
  await page.getByRole('button',{name:'Turn Work ON & Accept TEST Booking'}).click();
  assert.equal((await state()).booking.status,'accepted');
  assert.equal((await state()).workOn,true);
  await page.evaluate(()=>spStep('on_way'));
  await page.evaluate(()=>spStep('reached'));
  const otp=(await state()).booking.otp;
  assert.match(otp,/^\d{4}$/);
  const wrongOtp=otp==='0000'?'9999':'0000';
  await page.locator('#spOtp').fill(wrongOtp);
  await page.evaluate(()=>spStep('start'));
  assert.equal((await state()).booking.status,'reached','Wrong OTP must not start demo work');
  assert.equal((await state()).booking.otp,otp,'Wrong OTP must not consume valid code');
  await page.locator('#spOtp').fill(otp);
  await page.evaluate(()=>spStep('start'));
  assert.equal((await state()).booking.status,'working');
  assert.equal((await state()).booking.otp,null,'Verified OTP must be consumed');
  await page.locator('#spOtp').fill(otp);
  await page.evaluate(()=>spStep('start'));
  assert.equal((await state()).booking.status,'working','Reused OTP must not restart or reset work');
  await page.evaluate(()=>spStep('complete'));
  await page.evaluate(()=>setRole('customer'));
  await page.evaluate(()=>confirmWork());
  await page.evaluate(()=>simulatePayment());
  await page.evaluate(()=>setRole('sp'));
  await page.evaluate(()=>spCashReceived());
  assert.equal((await state()).booking.status,'completed');
  assert.equal((await state()).booking.amount,539);
  // Regression: quote handoff must preserve the selected service, not show Electrical defaults.
  await page.evaluate(()=>{
    localStorage.removeItem('ocs_test_mode_demo_v1');
    sessionStorage.setItem('ocsSafeTestCartTransfer',JSON.stringify({category:'Appliance Repair',service:'Refrigerator Repair / Service',mode:'quote',items:[],pay:'direct_upi',description:'TEST ONLY refrigerator cooling issue'}));
  });
  await page.reload();
  assert.ok((await page.locator('body').innerText()).includes('Refrigerator Repair / Service'));
  await page.locator('#testDescription').fill('TEST ONLY refrigerator cooling issue');
  await page.getByRole('button',{name:/Create TEST Booking/}).click();
  const quoteState=await state();
  assert.equal(quoteState.booking.category,'Appliance Repair');
  assert.equal(quoteState.booking.service,'Refrigerator Repair / Service');
  assert.equal(quoteState.booking.mode,'quote');
  assert.equal(quoteState.booking.amount,0);
  console.log('PASS demo quote handoff: selected Refrigerator service preserved; no default Electrical ₹539 booking');
  console.log('PASS demo mobile E2E: Work OFF -> ON + Accept -> Arrival -> OTP -> Completion -> simulated receipt (no real payments)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
