const TCB1Token = artifacts.require("TCB223");
const TCB2Token = artifacts.require("TCB20");
const TokenSwap = artifacts.require("TokenSwap");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(TCB1Token, "TCB coin", "TCB223", {from: accounts[0], overwrite: false}).then(()=> console.log("token1 deployed: " + TCB1Token.address));
  let token1 = await TCB1Token.deployed();

  await deployer.deploy(TCB2Token, "TCB coin", "TCB20", {from: accounts[1], overwrite: false}).then(()=> console.log("token2 deployed: " + TCB2Token.address));
  let token2 = await TCB2Token.deployed();


  await deployer.deploy(TokenSwap, {from: accounts[2], overwrite: false}).then(()=> console.log("tokenSwap deployed: " + TokenSwap.address));
  let tokenSwap = await TokenSwap.deployed();

  console.log("token1 addr: " + token1.address);
  console.log("token2 addr: " + token2.address);
  console.log("tokenSwap addr: " + tokenSwap.address);
  console.log("Deploy all done.");
};
