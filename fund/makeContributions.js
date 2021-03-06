/* global artifacts, web3 */
/* eslint-disable no-underscore-dangle, no-unused-vars */
const BN = require('bn.js');
const moment = require('moment');

const FundWallet = artifacts.require('./FundWallet.sol');
const FundReserve = artifacts.require('./KyberFundReserve.sol');

function stdlog(input) {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${input}`);
}

function tx(result, call) {
  const logs = (result.logs.length > 0) ? result.logs[0] : { address: null, event: null };

  console.log();
  console.log(`   ${call}`);
  console.log('   ------------------------');
  console.log(`   > transaction hash: ${result.tx}`);
  console.log(`   > contract address: ${logs.address}`);
  console.log(`   > gas used: ${result.receipt.gasUsed}`);
  console.log(`   > event: ${logs.event}`);
  console.log();
}

module.exports = async (callback) => {
  const accounts = web3.eth.accounts._provider.addresses;
  const adminWallet = accounts[0];
  const contributorWallet = accounts[3];
  let result;

  // Set the instances
  const FundWalletInstance = await FundWallet.at(FundWallet.address);

  stdlog('- Make Contributions -');
  stdlog(`FundWallet (${FundWallet.address})`);

  //admin deposit
  result = await FundWalletInstance.adminDeposit(
    { from: adminWallet, value: web3.utils.toWei(new BN(25)) }, //admin deposit
  );

  tx(result, 'adminDeposit()');

  //contributor deposit
  result = await FundWalletInstance.contributorDeposit(
    { from: contributorWallet, value: web3.utils.toWei(new BN(15)) }, //contributor deposit
  );

  tx(result, 'contributorDeposit()');



  stdlog('- END -');
  callback();
  
};
