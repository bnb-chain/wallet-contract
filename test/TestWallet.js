const ERC20ABC = artifacts.require("ERC20ABC");
const OperatorWallet = artifacts.require("OperatorWallet");
const BurnWallet = artifacts.require("BurnWallet");


const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

contract('Wallet Common', (accounts) => {
    it('Operator: Transfer Ownership', async () => {
        const wallet = await OperatorWallet.deployed();
        let owner = await wallet.owner();
        assert.ok(owner === accounts[0]);

        const newOwner = accounts[3];
        await wallet.transferOwnership(newOwner, {from: accounts[0]});
        try {
            await wallet.acceptOwnership({from: accounts[4]});
            assert.fail();
        }catch (error) {
            assert.ok(error.toString().includes("OperatorWallet: no authorization"));
        }

        await wallet.acceptOwnership({from: newOwner});
        let actualNewOwner = await wallet.owner();
        assert.ok(actualNewOwner === newOwner);
    });

    it('Operator: No double initialize', async () => {
        const wallet = await OperatorWallet.deployed();
        try{
            await wallet.initialize(accounts[2], accounts[3]);
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("Initializable: contract is already initialized"));
        }
    });

    it('Burn: Transfer Ownership', async () => {
        const wallet = await BurnWallet.deployed();
        let owner = await wallet.owner();
        assert.ok(owner === accounts[0]);

        const newOwner = accounts[3];
        await wallet.transferOwnership(newOwner, {from: accounts[0]});
        try {
            await wallet.acceptOwnership({from: accounts[4]});
            assert.fail();
        }catch (error) {
            assert.ok(error.toString().includes("BurnWallet: no authorization"));
        }

        await wallet.acceptOwnership({from: newOwner});
        let actualNewOwner = await wallet.owner();
        assert.ok(actualNewOwner === newOwner);
    });

    it('Burn: No double initialize', async () => {
        const wallet = await BurnWallet.deployed();
        try{
            await wallet.initialize(accounts[2]);
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("Initializable: contract is already initialized"));
        }
    });
});


contract('Operator Wallet: Owner Operation', (accounts) => {
    it('Change Operator', async () => {
        const wallet = await OperatorWallet.deployed();
        const owner = accounts[0];
        const nonOwner = accounts[9];
        let operator = await wallet.operator.call();
        assert.ok(operator == accounts[1]);
        try{
            await wallet.changeOperator(accounts[2], {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }
        await wallet.changeOperator(accounts[3], {from: owner});
        let actualOperator = await wallet.operator.call();
        assert.ok(actualOperator == accounts[3]);
        await wallet.changeOperator(accounts[1], {from: owner});
    });

    it('Add and Remove HotWallet', async () => {
        const wallet = await OperatorWallet.deployed();
        const owner = accounts[0];
        const nonOwner = accounts[9];
        try{
            await wallet.addHotWallet(accounts[2], {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }
        await wallet.addHotWallet(accounts[2], {from: owner});
        let isHotWallet = await wallet.isHotWallet.call(accounts[2]);
        assert.ok(isHotWallet == true);
        await wallet.addHotWallet(accounts[3], {from: owner});
        isHotWallet = await wallet.isHotWallet.call(accounts[3]);
        assert.ok(isHotWallet == true);
        let numOfHotWallets = await wallet.numOfHotWallets.call();
        assert.ok(numOfHotWallets.toString() === "2");

        try{
            await wallet.removeHotWallet(accounts[3], {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }
        await wallet.removeHotWallet(accounts[3], {from: owner});
        numOfHotWallets = await wallet.numOfHotWallets.call();
        assert.ok(numOfHotWallets.toString() === "1");
    });

    it('execTransaction', async () => {
        const wallet = await OperatorWallet.deployed();
        const owner = accounts[0];
        const nonOwner = accounts[9];
        await wallet.send(web3.utils.toBN(1e18), {from: accounts[1]});

        try{
            await wallet.execTransaction("0x1111111111111111111111111111111111111111", web3.utils.toBN(1e18), web3.utils.hexToBytes('0x'), {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }
        await wallet.execTransaction("0x1111111111111111111111111111111111111111", web3.utils.toBN(1e18), web3.utils.hexToBytes('0x'), {from: owner});

        let balance = await web3.eth.getBalance("0x1111111111111111111111111111111111111111");
        assert.ok(balance.toString() === web3.utils.toBN(1e18).toString());
    });

    it('Withdraw', async () => {
        const wallet = await OperatorWallet.deployed();
        const token = await ERC20ABC.deployed();
        const owner = accounts[0];
        const operator = accounts[1];
        const nonOwner = accounts[9];
        await wallet.send(web3.utils.toBN(1e18), {from: accounts[1]});

        try{
            await wallet.withdraw("0x0000000000000000000000000000000000000000", {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }
        await wallet.withdraw("0x0000000000000000000000000000000000000000", {from: owner});
        await wallet.mint(token.address, wallet.address, web3.utils.toBN(1e18), {from: operator});
        try{
            await wallet.withdraw(token.address, {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }
        await wallet.withdraw(token.address, {from: owner});
        const balance = await token.balanceOf.call(owner);
        assert.ok(balance.toString() === web3.utils.toBN(1e18).toString());

        try{
            await wallet.pause({from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not the owner"));
        }

        await wallet.pause({from: owner});
        try{
            await wallet.withdraw(token.address, {from: owner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("Pausable: paused"));
        }
        await wallet.unpause({from: owner});
        await wallet.withdraw(token.address, {from: owner});
    });
});


contract('Operator Wallet:  Operator and burn', (accounts) => {
    it('Do mint', async () => {
        const wallet = await OperatorWallet.deployed();
        const token = await ERC20ABC.deployed();
        const operator = accounts[1];
        const nonOperator = accounts[9];
        try{
            await wallet.mint(token.address, wallet.address, web3.utils.toBN(1e18), {from: nonOperator});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not operator or owner"));
        }
        try{
            await wallet.mint(token.address, accounts[6], web3.utils.toBN(1e18), {from: operator});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: recipient is not a hot wallet or self"));
        }
        await wallet.addHotWallet(accounts[6], {from: accounts[0]});
        await wallet.mint(token.address, accounts[6], web3.utils.toBN(1e18), {from: operator});
        await wallet.mint(token.address, wallet.address, web3.utils.toBN(1e18), {from: operator});
        const balance = await token.balanceOf.call(wallet.address);
        assert.ok(balance.toString() === web3.utils.toBN(1e18).toString());
    });

    it('Do Transfer', async () => {
        const wallet = await OperatorWallet.deployed();
        const burnWallet = await BurnWallet.deployed();
        const token = await ERC20ABC.deployed();
        const operator = accounts[1];
        const nonOperator = accounts[9];
        await wallet.mint(token.address, wallet.address,  web3.utils.toBN(1e18), {from: operator});
        await wallet.addHotWallet(accounts[2], {from: accounts[0]});
        try{
            await wallet.transfer(token.address, accounts[2], web3.utils.toBN(1e17), {from: nonOperator});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: caller is not operator or owner"));
        }
        try{
            await wallet.transfer(token.address, accounts[3], web3.utils.toBN(1e17), {from: operator});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("OperatorWallet: recipient is not a hotwallet"));
        }
        await wallet.transfer(token.address, accounts[2], web3.utils.toBN(1e17), {from: operator});
        let balance = await token.balanceOf.call(accounts[2]);
        assert.ok(balance.toString() === web3.utils.toBN(1e17).toString());

        // transfer
        await wallet.addHotWallet(burnWallet.address, {from: accounts[0]});
        await wallet.transfer(token.address, burnWallet.address, web3.utils.toBN(1e17), {from: operator});
    });

    it('Do burn', async () => {
        const burnWallet = await BurnWallet.deployed();
        const token = await ERC20ABC.deployed();
        const owner = accounts[0];
        const nonOwner = accounts[9];
        try{
            await burnWallet.burn(token.address, web3.utils.toBN(1e17), {from: nonOwner});
            assert.fail();
        }catch(error){
            assert.ok(error.toString().includes("BurnWallet: caller is not the owner"));
        }

        let balance = await token.balanceOf.call(burnWallet.address);
        assert.ok(balance.toString() === web3.utils.toBN(1e17).toString());


        await burnWallet.burn(token.address, web3.utils.toBN(1e17), {from: owner});
        balance = await token.balanceOf.call(burnWallet.address);
        assert.ok(balance.toString() === web3.utils.toBN(0).toString());
    });
});

