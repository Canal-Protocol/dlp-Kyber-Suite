/* global artifacts, web3 */
/* eslint-disable no-underscore-dangle, no-unused-vars */
const BN = require('bn.js');
const moment = require('moment');

const FundWallet = artifacts.require('./FundWallet.sol');

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
  let result;

  // Set the instances
  const FundWalletInstance = await FundWallet.at(FundWallet.address);

  stdlog('- Set Time Periods -');
  stdlog(`FundWallet (${FundWallet.address})`);

  result = await FundWalletInstance.setTimePeriods(
    1, // admin
    1, // raise
    3, // opperate
    3, // liquid
    { from: adminWallet },
  );

  tx(result, 'setTimePeriods()');

  stdlog('- END -');
  callback();
};
