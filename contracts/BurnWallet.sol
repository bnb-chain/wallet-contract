pragma solidity 0.8.4;

import "./lib/IMintAndBurnable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BurnWallet is Initializable, ContextUpgradeable, ReentrancyGuardUpgradeable {

    address private _owner;
    address private _pendingOwner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipAccepted(address indexed previousOwner, address indexed newOwner);

    constructor() {
    }

    receive() external payable {}

    function initialize(address initialOwner) external initializer {
        __ContractWallet_init(initialOwner);
    }

    function __ContractWallet_init(address initialOwner) internal {
        __Context_init_unchained();
        __ReentrancyGuard_init_unchained();
        __ContractWallet_init_unchained(initialOwner);
    }

    function __ContractWallet_init_unchained(address initialOwner) internal {
        require(initialOwner != address(0), "BurnWallet: owner is a zero address");
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "BurnWallet: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "BurnWallet: new owner is a zero address");
        require(newOwner != _owner, "BurnWallet: new owner is the same as the current owner");

        emit OwnershipTransferred(_owner, newOwner);
        _pendingOwner = newOwner;
    }

    function acceptOwnership() external {
        require(msg.sender == _pendingOwner, "BurnWallet: no authorization");
        emit OwnershipAccepted(_owner, _pendingOwner);
        _owner = _pendingOwner;
        _pendingOwner = address(0);
    }

    function burn(address token, uint256 amount) external onlyOwner nonReentrant returns (bool success){
        success = IMintAndBurnable(token).burn(amount);
    }
}