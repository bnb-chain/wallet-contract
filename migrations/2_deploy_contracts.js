const ERC20ABC = artifacts.require("ERC20ABC");
const BurnWallet = artifacts.require("BurnWallet");
const OperatorWallet = artifacts.require("OperatorWallet");
const WalletFactory = artifacts.require("WalletFactory");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {

    if (network === "development"){
      const token = await deployer.deploy(ERC20ABC);

      const burnImpl = await deployer.deploy(BurnWallet);
      await burnImpl.initialize(accounts[0]);
      const operatorImpl = await deployer.deploy(OperatorWallet);
      await operatorImpl.initialize(accounts[0], accounts[1]);
      await token.setOwner(operatorImpl.address);
      await deployer.deploy(WalletFactory, accounts[0], operatorImpl.address, burnImpl.address, {from: accounts[0]});
    }else{
      const burnImpl = await deployer.deploy(BurnWallet);
      const operatorImpl = await deployer.deploy(OperatorWallet);
      await deployer.deploy(WalletFactory, accounts[0], operatorImpl.address, burnImpl.address, {from: accounts[0]});
    }

  });
};
