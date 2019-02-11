let TestToken = artifacts.require("./mockContracts/TestToken.sol");

let Helper = require("./helper.js");
let BigNumber = require('bignumber.js');

let admin;
let backupAdmin;
let contributior1;
let ocntributor2;
let reserve;

const precisionUnits = (new BigNumber(10).pow(18));
const ethAddress = '0x00eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const precision = new BigNumber(10).pow(18);

//init variables (accounts, admins, tokens and wallets) stake, performance, contributors, time periods, reserve

//failiure conditions of constrctor

//admin hsould set reserve in adminP

//fail if non adminn sets reserve

//fail if reserve set in non admin P

//admins stake failiure

//fail amdin stake in non admin P

//should change admin to back up

//fail change admin otherwise

//fail if non admin adds contributors

//fail if not in admin P

//fail if non admin removes contributors

//fail if not in admin p

//contrib contribs in raise P

//fail contribs for non contributors

//fail contribs if admin hasnt made theri contribution

//fail contribs if not in raisP

//fail if already conrtib

//refund contrib amount

//fail if not in raiseP

//fail if no deposit

//fail if non conrtib

//admin conrib in raiseP

//fail if non admin

//fail if already contrib

//fail if not in raiseP

//admin refund in raie p, only if admin has contributed and only if the total raised amount is only admin amount

//admin withdraw token onli in opperate periods, fail in other epriods, fail if non admin

//admin withdraw ether only in opperate perids, fail in other epriods, fail if non admin

//log end balance, only if not logged, only in claimP

//adminClaim public onlyAdmin inClaimP endBalanceIsLogged hasNotClaimed

//contributorClaim public onlyContributor inClaimP endBalanceIsLogged hasNotClaimed

//pull token only reserve only in opeprate and liquidP

//pull ether only reserve only in opperateP

//check balance only returns token bal in opperate and liquidP, and eth in opperate otherwise 0.

//include balance checks after deposits refunds etc
