const TestToken = artifacts.require("./mockContracts/TestToken.sol");
const FundWallet = artifacts.require("./FundWallet.sol");

const Helper = require("./helper.js");
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

let admin;
let backupAdmin;
let contributor1;
let contributor2;
let contributor3;
let reserve;
let outsideAcc;
let fundWalletInst;
let token;

const precisionUnits = (new BigNumber(10).pow(18));
const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const precision = new BigNumber(10).pow(18);

contract('FundWallet', function(accounts) {

  //need to have a test from time period failiures

  it("Should init Fund Wallet and test token", async function () {
      // set account addresses
      admin = accounts[0];
      backupAdmin = accounts[1];
      contributor1 = accounts[2];
      contributor2 = accounts[4];
      contributor3 = accounts[5];
      reserve = accounts[6];
      outsideAcc = accounts[7];

      fundWalletInst = await FundWallet.new(admin, backupAdmin, {});

      token = await TestToken.new("test", "tst", 18);

      await fundWalletInst.setTimePeriods("60", "60", "60", "60", {from:admin});
    });

    it("Should set fund scheme and check admin stake and performance fee is correct", async function () {
      let egAdminStake = 1000;
      let egAdminCarry = 2000;

      await fundWalletInst.setFundScheme(egAdminStake, egAdminCarry, {from:admin});
      });

    it("Should set reserve", async function () {

      await fundWalletInst.setReserve(reserve, {from:admin});
    });

    it("Should add 3 contirbutors", async function () {

      await fundWalletInst.addContributor(contributor1, {from:admin});
      await fundWalletInst.addContributor(contributor2, {from:admin});
      await fundWalletInst.addContributor(contributor3, {from:admin});

      let contributors = await fundWalletInst.getContributors();

      assert.equal(contributors.length, 3, "unexpected number of contributors");
      assert.equal(contributors[0], contributor1, "contributor 1 is wrong");
      assert.equal(contributors[1], contributor2, "contributor 2 is wrong");
      assert.equal(contributors[2], contributor3, "contributor 3 is wrong");
    });

    it("Should remove a contributor (contributor3)", async function () {

      await fundWalletInst.removeContributor(contributor3, {from:admin});

      let contributors = await fundWalletInst.getContributors();
      assert.equal(contributors.length, 2, "unexpected number of contributors");
      assert.equal(contributors[0], contributor1, "contributor 1 is wrong");
      assert.equal(contributors[1], contributor2, "contributor 2 is wrong");
    });

    it("Should skip time to raiseP and check failed admin deposits accept deposit from admin, then check balances", async function () {
      let incorAdminStake = 1100; //incorrect admin deposit
      let corAdminStake = 1000;

      //3650 - excess of 50secs to ensure we are comfortably in time period
      await Helper.advanceTimeAndBlock(3650);

      let balanceInit = await Helper.getBalancePromise(fundWalletInst.address);
      assert.equal(balanceInit, 0, "initial balance incorrect (not 0)")

      //fail as value != adminStake
      try {
          await fundWalletInst.adminDeposit({from:admin, value:incorAdminStake});
          assert(false, "throw was expected in line above.")
      }
      catch(e){
          assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
      }

      //fail msg.sender != admin
      try {
          await fundWalletInst.adminDeposit({from:outsideAcc, value:corAdminStake});
          assert(false, "throw was expected in line above.")
      }
      catch(e){
          assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
      }

      let balance = await Helper.getBalancePromise(fundWalletInst.address);
      assert.equal(balance, 0, "incorrect balance")
    });

    it("Should accept deposit from admin, then check balances", async function () {
      let adminStake = 1000; //correct admin deposit

      await fundWalletInst.adminDeposit({from:admin, value:adminStake});

      let balance = await Helper.getBalancePromise(fundWalletInst.address);
      assert.equal(balance, adminStake, "incorrect balance")
    });

    it("Should check failiure contributions and check balances", async function () {
      let incorContAmount = 1100;
      let corContAmount = 900;

      let startBal = await Helper.getBalancePromise(fundWalletInst.address);

      //fail as msg.value > adminStake
      try {
          await fundWalletInst.contributorDeposit({from:contributor1, value:incorContAmount});
          assert(false, "throw was expected in line above.")
      }
      catch(e){
          assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
      }

      //fail as msg.sender != contributor1 or contributor2
      try {
          await fundWalletInst.contributorDeposit({from:outsideAcc, value:corContAmount});
          assert(false, "throw was expected in line above.")
      }
      catch(e){
          assert(Helper.isRevertErrorMessage(e), "expected throw but got: " + e);
      }

      let endBal = await Helper.getBalancePromise(fundWalletInst.address);
      assert.equal(startBal, endBal, "balances incorrect")
    });

    it("Should accept contributions from contirbutors and check balance", async function () {
      let corContAmount = 900;

      let startBal = await Helper.getBalancePromise(fundWalletInst.address);

      await fundWalletInst.contributorDeposit({from:contributor1, value:corContAmount});

      let expectedBal = await parseInt(startBal)+parseInt(corContAmount);
      let postC1Bal = await Helper.getBalancePromise(fundWalletInst.address);
      assert.equal(postC1Bal, expectedBal, "incorrect balance");

      await fundWalletInst.contributorDeposit({from:contributor2, value:corContAmount});

      expectedBal = await parseInt(postC1Bal)+parseInt(corContAmount);
      let postC2Bal = await Helper.getBalancePromise(fundWalletInst.address);
      assert.equal(postC2Bal, expectedBal, "incorrect balance")
    });

    it("Should jump time to opperateP and test withdrawals, check balances", async function () {
      //3650 - excess of 50secs to ensure we are comfortable in time period
      await Helper.advanceTimeAndBlock(3650);
      let tokenInitBal = 100;
      let etherWDAmt = 10;
      let tokenWDAmt = 10;

      await token.transfer(fundWalletInst.address, tokenInitBal);
      let tokenBal = await token.balanceOf(fundWalletInst.address);
      assert.equal(tokenBal, tokenInitBal, "wrong balance");

      let etherBal = await Helper.getBalancePromise(fundWalletInst.address);

      //withdraw ether
      await fundWalletInst.withdrawEther(etherWDAmt, admin, {from:admin});

      let etherBal2 = await Helper.getBalancePromise(fundWalletInst.address);
      let expEthBal = await parseInt(etherBal) - parseInt(etherWDAmt);
      assert.equal(etherBal2, expEthBal, "incorrect balance");

      //withdraw token
      await fundWalletInst.withdrawToken(token.address, tokenWDAmt, admin, {from:admin});
      let tokenBal2 = await token.balanceOf(fundWalletInst.address);
      let expTokBal = await parseInt(tokenBal) - parseInt(tokenWDAmt);
      assert.equal(tokenBal2, expTokBal, "incorrect balance");
    });

    it("Should pull token (successful in opperateP) and check balances", async function () {
      let tokAmount = 10;

      let tokenBal = await token.balanceOf(fundWalletInst.address);

      await fundWalletInst.pullToken(token.address, tokAmount, {from:reserve});

      let tokenBal2 = await token.balanceOf(fundWalletInst.address);
      let expTokBal = await parseInt(tokenBal) - parseInt(tokAmount);
      assert.equal(tokenBal2, expTokBal, "wrong balance");
    });

    it("Should pull ether (successful in opperateP) and check balances", async function () {
      let ethAmount = 10;

      let etherBal = await Helper.getBalancePromise(fundWalletInst.address);

      await fundWalletInst.pullEther(ethAmount, {from:reserve});

      let etherBal2 = await Helper.getBalancePromise(fundWalletInst.address);
      let expEthBal = await parseInt(etherBal) - parseInt(ethAmount);
      assert.equal(etherBal2, expEthBal, "incorrect balance");
    });

    it("Should check that checkBalance returns correct balances (both eth and token in opperateP)", async function () {

      let etherBal = await Helper.getBalancePromise(fundWalletInst.address);
      let tokenBal = parseInt(await token.balanceOf(fundWalletInst.address));

      let returnEthBal = await fundWalletInst.checkBalance(ethAddress);
      let returnTokBal = parseInt(await fundWalletInst.checkBalance(token.address));

      assert.equal(etherBal, returnEthBal, "wrong balance");
      assert.equal(returnTokBal, tokenBal, "wrong balance");
    });

    it("Should pull token (successful in liquidP) and check balances", async function () {
      let tokAmount = 10;

      await Helper.advanceTimeAndBlock(3650);

      let tokenBal = await token.balanceOf(fundWalletInst.address);

      await fundWalletInst.pullToken(token.address, tokAmount, {from:reserve});

      let tokenBal2 = await token.balanceOf(fundWalletInst.address);
      let expTokBal = await parseInt(tokenBal) - parseInt(tokAmount);
      assert.equal(tokenBal2, expTokBal, "wrong balance");
    });

    it("Should check that checkBalance returns correct balances (token in liquidP)", async function () {

      let tokenBal = parseInt(await token.balanceOf(fundWalletInst.address));

      let returnEthBal = await fundWalletInst.checkBalance(ethAddress);
      let returnTokBal = parseInt(await fundWalletInst.checkBalance(token.address));

      assert.equal(0, returnEthBal, "wrong balance");
      assert.equal(returnTokBal, tokenBal, "wrong balance");
    });

    it("Should logEndBal", async function () {
      await Helper.advanceTimeAndBlock(3650);

      await fundWalletInst.logEndBal();
    });

});
