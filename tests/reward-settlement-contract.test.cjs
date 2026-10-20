// Non-mutating accounting contract; no payout, bank access or production writes.
'use strict';
const assert=require('node:assert/strict');
function settlement({gross,reward,customerPaid,bankSubsidyPaid,walletSubsidyRealized}){
 const commission=Math.round(gross*9)/100;
 assert.ok(Number.isFinite(gross)&&gross>0);
 assert.ok(Number.isFinite(reward)&&reward>=0&&reward<=gross);
 assert.equal(customerPaid,gross-reward,'Customer pays gross less reward');
 assert.ok(bankSubsidyPaid>=0&&walletSubsidyRealized>=0);
 assert.ok(bankSubsidyPaid+walletSubsidyRealized<=reward,'Never compensate subsidy twice');
 return {commission,providerNet:customerPaid+bankSubsidyPaid+walletSubsidyRealized-commission};
}
for(const role of ['sp','driver','transport']){
 const bank=settlement({gross:2000,reward:100,customerPaid:1900,bankSubsidyPaid:100,walletSubsidyRealized:0});
 assert.equal(bank.commission,180,role);
 assert.equal(bank.providerNet,1820,role);
 const wallet=settlement({gross:2000,reward:100,customerPaid:1900,bankSubsidyPaid:0,walletSubsidyRealized:100});
 assert.equal(wallet.providerNet,1820,role);
 assert.throws(()=>settlement({gross:2000,reward:100,customerPaid:1900,bankSubsidyPaid:100,walletSubsidyRealized:100}),/twice/,role);
 const unpaid=settlement({gross:2000,reward:100,customerPaid:1900,bankSubsidyPaid:0,walletSubsidyRealized:0});
 assert.equal(unpaid.providerNet,1720,'Unpaid subsidy must not be called provider earnings');
}
console.log('PASS: SP/Driver/Transport reward settlement and double-compensation guard (arithmetic only)');
