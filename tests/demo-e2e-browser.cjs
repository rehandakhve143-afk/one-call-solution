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
  assert.match(otp,/^\d{6}$/);
  await page.locator('#spOtp').fill(otp);
  await page.evaluate(()=>spStep('start'));
  assert.equal((await state()).booking.status,'working');
  await page.evaluate(()=>spStep('complete'));
  await page.evaluate(()=>setRole('customer'));
  await page.evaluate(()=>confirmWork());
  await page.evaluate(()=>simulatePayment());
  await page.evaluate(()=>setRole('sp'));
  await page.evaluate(()=>spCashReceived());
  assert.equal((await state()).booking.status,'completed');
  assert.equal((await state()).booking.amount,539);
  console.log('PASS demo mobile E2E: Work OFF -> ON + Accept -> Arrival -> OTP -> Completion -> simulated receipt (no real payments)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
