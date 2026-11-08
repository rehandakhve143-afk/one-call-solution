/* Static login OTP safeguards; no real identities or OTP requests. */
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const start=html.indexOf('const OCS_OTP_VERIFY_GUARD={};');
const end=html.indexOf('\nasync function settingsLoginAction()',start);
if(start<0||end<0)throw Error('Login OTP verifier block missing');
const verifier=html.slice(start,end);
if(!verifier.includes("target.type!==(isEmail?'email':'sms')"))throw Error('OTP channel must match the requested identity');
if(!verifier.includes('if(OCS_OTP_VERIFY_GUARD[roleKey])return false'))throw Error('Duplicate OTP verification must be blocked');
if(!verifier.includes("data&&data.user")||!verifier.includes('!data.session'))throw Error('Successful verify must return a real session and user');
if(!verifier.includes('verifiedIdentity!==requestValue'))throw Error('Verified identity must match the requested email/mobile');
if(!verifier.includes("signOut({scope:'local'})"))throw Error('Mismatched local session must be cleared');
if(!verifier.includes('finally{')||!verifier.includes("verifyBtn.disabled=false"))throw Error('Verify control must be restored after completion');
if(!html.includes('maxlength="6"')||!verifier.includes('/^\\d{6}$/'))throw Error('Login OTP UI and verifier must stay aligned at six digits until Auth configuration is changed');
console.log('PASS: login OTP duplicate-submit, channel, identity and session safeguards (static only)');
