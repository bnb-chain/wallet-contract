const WalletFactory = artifacts.require("WalletFactory");

contract('Wallet Factory Ownership', (accounts) => {
    it('Transfer ownership', async () => {
        const factory = await WalletFactory.deployed();
        let owner = await factory.owner();
        assert.ok(owner === accounts[0]);

        await factory.transferOwnership(accounts[1], {from: accounts[0]});
        await factory.acceptOwnership({from: accounts[1]});

        let newOwner = await factory.owner();
        assert.ok(newOwner === accounts[1]);
    });

    it('Ownership authentication', async () => {
        const factory = await WalletFactory.deployed();
        const owner = accounts[1];
        const noneOwner = accounts[2];
        try{
            await factory.createOperatorWallet(accounts[2], accounts[3], accounts[4],  {from: noneOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("ContractWalletFactory: caller is not the owner"));
        }
        try{
            await factory.createBurnWallet(accounts[2], accounts[3], {from: noneOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("ContractWalletFactory: caller is not the owner"));
        }
    });
});

contract('Wallet Factory Deploy Wallet', (accounts) => {
    it('Creare operator wallet and burn wallet', async () => {
        const factory = await WalletFactory.deployed();
        const owner = accounts[0];
        await factory.createOperatorWallet(accounts[1], accounts[2], accounts[3],  {from: owner});
        await factory.createBurnWallet(accounts[2], accounts[3],  {from: owner});
    });
});