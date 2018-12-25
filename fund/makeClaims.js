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

  stdlog('- Make Claims -');
  stdlog(`FundWallet (${FundWallet.address})`);

  stdlog(`ETH balance of Admin ${adminWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(adminWallet))}`);
  stdlog(`ETH balance of Contributor ${contributorWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(contributorWallet))}`);

  //admin deposit
  result = await FundWalletInstance.logEndBal(
    { from: adminWallet },
  );

  tx(result, 'logEndBal()');

  //admin claim
  result = await FundWalletInstance.adminClaim(
    { from: adminWallet }, //admin clain
  );

  tx(result, 'adminClaim()');

  //contributor claim
  result = await FundWalletInstance.contributorClaim(
    { from: contributorWallet }, //admin clain
  );

  tx(result, 'contributorClaim()');


  stdlog(`ETH balance of Admin ${adminWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(adminWallet))}`);
  stdlog(`ETH balance of Contributor ${contributorWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(contributorWallet))}`);

  stdlog('- END -');
  callback();

};
