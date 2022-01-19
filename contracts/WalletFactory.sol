pragma solidity ^0.8.0;

import './UpgradeableProxy.sol';
import './lib/IProxyInitialize.sol';
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract WalletFactory is ContextUpgradeable{
    address private _owner;
    address private _pendingOwner;

    address private _operatorWalletImplement;
    address private _burnWalletImplement;

    event OperatorWalletCreated(address indexed wallet);
    event BurnWalletCreated(address indexed wallet);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipAccepted(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner, address operatorImplement, address burnImplement) {
        _owner = initialOwner;
        _operatorWalletImplement = operatorImplement;
        _burnWalletImplement = burnImplement;
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function operatorWalletImplement() external view returns (address) {
        return _operatorWalletImplement;
    }

    function burnWalletImplement() external view returns (address) {
        return _burnWalletImplement;
    }

    modifier onlyOwner() {
        require(_owner == _msgSender(), "ContractWalletFactory: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ContractWalletFactory: new owner is the zero address");
        require(newOwner != _owner, "ContractWalletFactory: new owner is the same as the current owner");
        emit OwnershipTransferred(_owner, newOwner);
        _pendingOwner = newOwner;
    }

    function acceptOwnership() external {
        require(msg.sender == _pendingOwner, "ContractWalletFactory: invalid new owner");
        emit OwnershipAccepted(_owner, _pendingOwner);
        _owner = _pendingOwner;
        _pendingOwner = address(0);
    }

    function createOperatorWallet(address walletOwner, address walletOperator, address proxyAdmin) external onlyOwner returns (address) {
        require(walletOwner != proxyAdmin, "wallet owner is the same as the proxy admin");
        require(walletOperator != proxyAdmin, "wallet operator is the same as the proxy admin");
        UpgradeableProxy walletProxy = new UpgradeableProxy(_operatorWalletImplement, proxyAdmin, "");
        IProxyOperatorInitialize wallet = IProxyOperatorInitialize(address(walletProxy));
        wallet.initialize(walletOwner, walletOperator);
        emit OperatorWalletCreated(address(wallet));
        return address(wallet);
    }

    function createBurnWallet(address walletOwner, address proxyAdmin) external onlyOwner returns (address) {
        require(walletOwner != proxyAdmin, "wallet owner is the same as the proxy admin");
        UpgradeableProxy walletProxy = new UpgradeableProxy(_burnWalletImplement, proxyAdmin, "");
        IProxyBurnInitialize wallet = IProxyBurnInitialize(address(walletProxy));
        wallet.initialize(walletOwner);
        emit BurnWalletCreated(address(wallet));
        return address(wallet);
    }
}