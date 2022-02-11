#  Contract Wallet

We have issued a bunch of ERC20 tokens. There is an owner of all these ERC20 tokens which is an EOA right now.  The people holding the private key of the owner need to mint and burn ERC20 tokens manually according to the  supply-demand and allocate the fund to different hotwallet. Now we want to introduce smart contract implemented wallets to improve the automaticity, reduce the operating burden and fund management risk. 

## Introduction

The whole system contains none smart contract parts which are confidential, the audit scope only contains the smart contract part.  The smart contracts contains:
1. **Operator Contract**. The contract who is responsible to mint and transfer tokens to whitelist accounts. 
2. **Burn Contract**. The contract who is responsible to temporarily hold funds and eventually burn it.


### Role

#### Operator Contract
The owner of ERC20 token will transfer to an Operator Contract rather than an EOA. 
This Operator Contract  has 2 roles:
Operator;  EOA, custody account who can mint and transfer ERC20 token.
Owner:  EOA,  ledger account who can manage owner and whitelist hot wallet accounts.

This Operator Contract  has 5 interfaces:
1. [Operator] Mint token to owner contract or hot wallet;  mint(token address, to address, amount uint256)
2. [Operator] Transfer token to whitelist hot wallet;  transfer(token address, to address, amount uint256)
3. [Owner] Add whitelist address;  addWhitelist(hotwallet address)	
4. [Owner] Remove whitelist address; removeWhitelist(hotwallet address)
5. [Owner] Change Operator; changeOperator(newOperator address)

#### Burn Contract
This contract has an owner address which is a custody EOA. 

This contract can accept any token and has one function:
1. [owner] burns the token that the Burn Contract holds.  burn(token address)


## Test

Run tests:

```bash
npm run testrpc
npm run truffle:test
```

## Deployed contracts

Run deploy:

```bash
 truffle migrate --network  testnet
```

### Testnet
Factory: https://testnet.bscscan.com/address/0x4dE8DB8a9151793e82ff8830184E184DF4bb401F

OperatorWallet: https://testnet.bscscan.com/address/0x5c66e52d1b410F787715c75a7bB68914D6860986

BurnWallet: https://testnet.bscscan.com/address/0x6B1C6ED390Adba685Cc4E8Fb148c203De000B2D2