/* global artifacts */
/* eslint-disable no-unused-vars, no-eval */
const fs = require('fs');

const Network = artifacts.require('./KyberNetwork.sol');
const ConversionRates = artifacts.require('./ConversionRates.sol');
const SanityRates = artifacts.require('./SanityRates.sol');
const FundWallet = artifacts.require('./FundWallet.sol');
const FundReserve = artifacts.require('./KyberFundReserve.sol');

const KNC = artifacts.require('./mockTokens/KyberNetworkCrystal.sol');
const OMG = artifacts.require('./mockTokens/OmiseGo.sol');
const SALT = artifacts.require('./mockTokens/Salt.sol');
const ZIL = artifacts.require('./mockTokens/Zilliqa.sol');

const tokenConfig = JSON.parse(fs.readFileSync('../config/tokens.json', 'utf8'));

function tx(result, call) {
  const logs = (result.logs.length > 0) ? result.logs[0] : { address: null, event: null };

  console.log();
  console.log(`   Calling ${call}`);
  console.log('   ------------------------');
  console.log(`   > transaction hash: ${result.tx}`);
  console.log(`   > contract address: ${logs.address}`);
  console.log(`   > gas used: ${result.receipt.gasUsed}`);
  console.log(`   > event: ${logs.event}`);
  console.log();
}

module.exports = async (deployer, network, accounts) => {
  const reserveWallet = accounts[5];

  // Set the instances
  const NetworkInstance = await Network.at(Network.address);
  const FundReserveInstance = await FundReserve.at(FundReserve.address);

  // Set the reserve contract addresses
  tx(
    await FundReserveInstance.setContracts(
      Network.address,
      ConversionRates.address,
      SanityRates.address,
    ),
    'setContracts()',
  );

  //set fund wallet
  tx(
    await FundReserveInstance.setFundWallet(
      FundWallet.address,
    ),
    'setFundWallet()',
  );

  // Add reserve to network
  tx(await NetworkInstance.addReserve(FundReserve.address, true), 'addReserve()');

  //i think reserve - as json unchanged
  Object.keys(tokenConfig.Reserve).forEach(async (key) => {
    // Add the withdrawal address for each token
    tx(
      await FundReserveInstance.approveWithdrawAddress(eval(key).address, reserveWallet, true),
      'approveWithdrawAddress()',
    );

    // List token pairs for the reserve
    tx(
      await NetworkInstance.listPairForReserve(
        FundReserve.address,
        eval(key).address,
        true,
        true,
        true,
      ),
      'listPairForReserve()',
    );
  });
};
