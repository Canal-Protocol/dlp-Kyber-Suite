const TestToken = artifacts.require("./mockContracts/TestToken.sol");
const FundWallet = artifacts.require("./FundWallet.sol");

const Helper = require("./helper.js");
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');

let admin;
let backupAdmin;
let contributor1;
let contributor2;
let reserve;

const precisionUnits = (new BigNumber(10).pow(18));
const ethAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const precision = new BigNumber(10).pow(18);

contract('FundWallet', function(accounts) {

  it("Should init Fund Wallet and test token", async function () {
        // set account addresses
        admin = accounts[0];
        backupAdmin = accounts[1];
        contributor1 = accounts[2];
        contributor2 = accounts[4];
        contributor3 = accounts[5];
        reserve = accounts[6];

        fundWalletInst = await FundWallet.new(admin, backupAdmin);

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

});
