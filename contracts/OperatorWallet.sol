pragma solidity 0.8.4;

import "./lib/IMintAndBurnable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract OperatorWallet is Initializable, ContextUpgradeable, ReentrancyGuardUpgradeable {

    using SafeERC20Upgradeable for IERC20Upgradeable;

    address private _owner;
    address private _operator;
    address private _pendingOwner;

    mapping(address => uint256) hotWalletsMap;
    address[] public hotWallets;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipAccepted(address indexed previousOwner, address indexed newOwner);
    event HotWalletAdded(address indexed hotwallet);
    event HotWalletRemoved(address indexed hotwallet);
    event OperatorTransferred(address indexed previousOperator, address indexed newOperator);


    constructor() {
    }

    receive() external payable {}

    function initialize(address initialOwner, address initialOperator) external initializer{
        __ContractWallet_init(initialOwner, initialOperator);
    }

    function __ContractWallet_init(address initialOwner, address initialOperator) internal {
        __Context_init_unchained();
        __ReentrancyGuard_init_unchained();
        __ContractWallet_init_unchained(initialOwner, initialOperator);
    }

    function __ContractWallet_init_unchained(address initialOwner, address initialOperator) internal {
        require(initialOwner != address(0), "OperatorWallet: owner is a zero address");

        _owner = initialOwner;
        _operator = initialOperator;

        emit OwnershipTransferred(address(0), initialOwner);
        emit OperatorTransferred(address(0), initialOperator);
    }

    function owner() external view returns (address) {
        return _owner;
    }

    function operator() external view returns (address) {
        return _operator;
    }

    modifier onlyOwner() {
        require(_owner == msg.sender, "OperatorWallet: caller is not the owner");
        _;
    }

    modifier onlyOperator() {
        require(_operator == msg.sender, "OperatorWallet: caller is not the operator");
        _;
    }

    function isHotWallet(address account) public view returns (bool){
        return hotWalletsMap[account] > 0;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "OperatorWallet: new owner is a zero address");
        require(newOwner != _owner, "OperatorWallet: new owner is the same as the current owner");

        emit OwnershipTransferred(_owner, newOwner);
        _pendingOwner = newOwner;
    }

    function acceptOwnership() external {
        require(msg.sender == _pendingOwner, "OperatorWallet: no authorization");
        emit OwnershipAccepted(_owner, _pendingOwner);
        _owner = _pendingOwner;
        _pendingOwner = address(0);
    }

    function addHotWallet(address hotwallet) external onlyOwner {
        require(hotwallet != address(0), "OperatorWallet: hotwallet is a zero address");
        require(hotWalletsMap[hotwallet] == 0, "OperatorWallet: hotwallet already exist");
        hotWallets.push(hotwallet);
        hotWalletsMap[hotwallet] = hotWallets.length;
        emit HotWalletAdded(hotwallet);
    }

    function numOfHotWallets() external view returns(uint256) {
        return hotWallets.length;
    }

    function removeHotWallet(address hotwallet) external onlyOwner {
        require(hotwallet != address(0), "OperatorWallet: hotwallet is a zero address");
        require(hotWalletsMap[hotwallet] > 0, "OperatorWallet: hotwallet do not exist");
        uint256 idx = hotWalletsMap[hotwallet];
        if (idx != hotWallets.length) {
            hotWallets[idx-1] = hotWallets[hotWallets.length-1];
            hotWalletsMap[hotWallets[idx-1]] = idx;
        }
        hotWallets.pop();
        delete hotWalletsMap[hotwallet];
        emit HotWalletRemoved(hotwallet);
    }

    function changeOperator(address newOperator) external onlyOwner {
        require(newOperator != address(0), "OperatorWallet: operator is a zero address");
        require(newOperator != _operator, "OperatorWallet: already an operator");

        emit OperatorTransferred(_operator, newOperator);
        _operator = newOperator;
    }

    function mint(address token, address recipient, uint256 amount) external onlyOperator nonReentrant{
        require(isHotWallet(recipient) || address(this) == recipient, "OperatorWallet: recipient is not a hot wallet or self");
        bool success = IMintAndBurnable(token).mint(amount);
        require(success, "OperatorWallet: failed to mint");
        if(isHotWallet(recipient)){
            IERC20Upgradeable(token).safeTransfer(recipient, amount);
        }
    }

    function transfer(address token, address recipient, uint256 amount) external onlyOperator nonReentrant{
        require(isHotWallet(recipient), "OperatorWallet: recipient is not a hotwallet");
        IERC20Upgradeable(token).safeTransfer(recipient, amount);
    }

    function execTransaction(address to, uint256 value, bytes calldata data) external payable onlyOwner nonReentrant returns (bool success) {
        success = execute(to, value, data, gasleft());
    }

    function execute(address to, uint256 value, bytes memory data, uint256 txGas) internal returns (bool success) {
    // solhint-disable-next-line no-inline-assembly
        assembly {
            success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function withdraw(address token) external onlyOwner nonReentrant {
        uint256 assetBalance;
        if (token == address(0)) {
            address self = address(this);
            assetBalance = self.balance;
            if (assetBalance != 0) {
                payable(msg.sender).transfer(assetBalance);
            }
        } else {
            assetBalance = IERC20Upgradeable(token).balanceOf(address(this));
            if (assetBalance != 0) {
                IERC20Upgradeable(token).safeTransfer(_owner, assetBalance);
            }
        }
    }
}