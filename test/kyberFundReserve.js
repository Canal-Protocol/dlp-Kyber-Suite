const ConversionRates = artifacts.require("./ConversionRates.sol");
const TestToken = artifacts.require("./mockContracts/TestToken.sol");
const SanityRates = artifacts.require("./SanityRates");
const MockFundWallet = artifacts.require("./mockContracts/MockFundWallet.sol");
const Reserve = artifacts.require("./KyberFundReserve");

const Helper = require("./helper.js");
const BigNumber = require('bignumber.js');

//global vars
const precisionUnits = (new BigNumber(10).pow(18));
const ethAddress = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const precision = new BigNumber(10).pow(18);

//balances
let expectedReserveBalanceWei = 0;
let reserveTokenBalance = [];
let reserveTokenImbalance = [];

//permission groups
let admin;
let operator;
let alerter;
let network;
let withDrawAddress;

//contracts
let convRatesInst;
let reserveInst;
let sanityRate = 0;
let fundWallet;

//block data
let priceUpdateBlock;
let currentBlock;
let validRateDurationInBlocks = 1000;

//tokens data
////////////
let numTokens = 5;
let tokens = [];
let tokenAdd = [];

// imbalance data
let minimalRecordResolution = 2; //low resolution so I don't lose too much data. then easier to compare calculated imbalance values.
let maxPerBlockImbalance = 4000;
let maxTotalImbalance = maxPerBlockImbalance * 12;

//base buy and sell rates (prices)
let baseBuyRate = [];
let baseSellRate = [];

//quantity buy steps
let qtyBuyStepX = [-1400, -700, -150, 0, 150, 350, 700,  1400];
let qtyBuyStepY = [ 1000,   75,   25, 0,  0, -70, -160, -3000];

//imbalance buy steps
let imbalanceBuyStepX = [-8500, -2800, -1500, 0, 1500, 2800,  4500];
let imbalanceBuyStepY = [ 1300,   130,    43, 0,   0, -110, -1600];

//sell
//sell price will be 1 / buy (assuming no spread) so sell is actually buy price in other direction
let qtySellStepX = [-1400, -700, -150, 0, 150, 350, 700, 1400];
let qtySellStepY = [-300,   -80,  -15, 0,   0, 120, 170, 3000];

//sell imbalance step
let imbalanceSellStepX = [-8500, -2800, -1500, 0, 1500, 2800,  4500];
let imbalanceSellStepY = [-1500,  -320,   -75, 0,    0,  110,   650];


//compact data.
let sells = [];
let buys = [];
let indices = [];
let compactBuyArr = [];
let compactSellArr = [];

//init; KyberFundReserve, TestToken, MockFundWallet, ConversionRates, admin, operator, user, send tokens and ether to MockFundWallet;

//set base rates, compact data and step function

//set reserve

//small buys only in operational -- success
//small buys only in liquidation  -- success

//stepped buy in opeprational
//stepped buy in liquidation
//buys in other time peiods should fail

//small sell in opperational

//stepped sells in opperational

//sells in other periods should fail

//should return no zero getBalance eth only in opperational

//should return non zero  getBalance token only in opperational and liquidations

//should verify trade success when validation disabled

//should test sell trade reverted without token approved.

//should test trade reverted when trade disabled

//should test trade reverted when conversion rate 0

//should test trade reverted when dest amount is 0

//should test buy trade reverted when not sending correct ether value

//should test trade reverted when not sent from network

//should test trade reverted when sending ether value with sell trade

//should test reverted scenario for set contracts call

//should test get src qty when dst qty is very small and source is near 0

//should test get src qty reverted when decimals diff > max decimals diff (18)

//should approve withdraw address and withdraw. token and ether. only wihtdraw ether in opperational, only token in operational and liquidaiton

//should test reverted scenarios for withdraw

//should test get dest qty depending on time periods

//should test get src qty depending on time periods

//should test get conversion rate options -- only returns conversion rates when balance is non-zero

//should test get conversion rate return 0 when sanity rate is lower the calculated rate

//should zero reserve balance and see that get rate returns zero when not enough dest balanc

//should test can't init this contract with empty contracts (address 0)

function convertRateToPricingRate (baseRate) {
// conversion rate in pricing is in precision units (10 ** 18) so
// rate 1 to 50 is 50 * 10 ** 18
// rate 50 to 1 is 1 / 50 * 10 ** 18 = 10 ** 18 / 50a
    return ((new BigNumber(10).pow(18)).mul(baseRate).floor());
};

function getExtraBpsForBuyQuantity(qty) {
    for (let i = 0; i < qtyBuyStepX.length; i++) {
        if (qty <= qtyBuyStepX[i]) return qtyBuyStepY[i];
    }
    return qtyBuyStepY[qtyBuyStepY.length - 1];
};

function getExtraBpsForSellQuantity(qty) {
    for (let i = 0; i < qtySellStepX.length; i++) {
        if (qty <= qtySellStepX[i]) return qtySellStepY[i];
    }
    return qtySellStepY[qtySellStepY.length - 1];
};

function getExtraBpsForImbalanceBuyQuantity(qty) {
    for (let i = 0; i < imbalanceBuyStepX.length; i++) {
        if (qty <= imbalanceBuyStepX[i]) return imbalanceBuyStepY[i];
    }
    return (imbalanceBuyStepY[imbalanceBuyStepY.length - 1]);
};

function getExtraBpsForImbalanceSellQuantity(qty) {
    for (let i = 0; i < imbalanceSellStepX.length; i++) {
        if (qty <= imbalanceSellStepX[i]) return imbalanceSellStepY[i];
    }
    return (imbalanceSellStepY[imbalanceSellStepY.length - 1]);
};

function addBps (price, bps) {
    return (price.mul(10000 + bps).div(10000));
};

function compareRates (receivedRate, expectedRate) {
    expectedRate = expectedRate - (expectedRate % 10);
    receivedRate = receivedRate - (receivedRate % 10);
    assert.equal(expectedRate, receivedRate, "different prices");
};

function calculateRateAmount(isBuy, tokenInd, srcQty, maxDestAmount) {
    let expectedRate;
    let expectedAmount;
    let baseArray;
    let imbalanceArray;
    let expected = [];

    imbalanceArray = reserveTokenImbalance;


    if (isBuy) {
        baseArray = baseBuyRate;
    } else {
        baseArray = baseSellRate;
    }

    if (isBuy) {
        expectedRate = (new BigNumber(baseArray[tokenInd]));
        let dstQty = calcDstQty(srcQty, 18, tokenDecimals[tokenInd], expectedRate);
        let extraBps = getExtraBpsForBuyQuantity(dstQty);
        expectedRate = addBps(expectedRate, extraBps);
        let relevantImbalance = imbalanceArray[tokenInd] * 1 + dstQty * 1;
        extraBps = getExtraBpsForImbalanceBuyQuantity(relevantImbalance);
        expectedRate = addBps(expectedRate, extraBps);
        expectedAmount = calcDstQty(srcQty, 18, tokenDecimals[tokenInd], expectedRate);
    } else {
        expectedRate = (new BigNumber(baseArray[tokenInd]));
        let extraBps = getExtraBpsForSellQuantity(srcQty);
        expectedRate = addBps(expectedRate, extraBps);
        let relevantImbalance = imbalanceArray[tokenInd] - srcQty;
        extraBps = getExtraBpsForImbalanceSellQuantity(relevantImbalance.valueOf());
        expectedRate = addBps(expectedRate, extraBps);
        expectedAmount = calcDstQty(srcQty, tokenDecimals[tokenInd], 18, expectedRate);
    }
    expectedAmount = expectedAmount.floor();
    expectedRate = expectedRate.floor();

    expected = [expectedRate, expectedAmount];
    return expected;
}


function calcDstQty(srcQty, srcDecimals, dstDecimals, rate) {
    rate = new BigNumber(rate);
    if (dstDecimals >= srcDecimals) {
        let decimalDiff = (new BigNumber(10)).pow(dstDecimals - srcDecimals);
        return (rate.mul(srcQty).mul(decimalDiff).div(precisionUnits)).floor();
    } else {
        let decimalDiff = (new BigNumber(10)).pow(srcDecimals - dstDecimals);
        return (rate.mul(srcQty).div(decimalDiff.mul(precisionUnits))).floor();
    }
}
