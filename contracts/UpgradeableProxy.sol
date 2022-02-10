pragma solidity 0.8.4;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract UpgradeableProxy is TransparentUpgradeableProxy {
    constructor(address logic, address admin, bytes memory data) TransparentUpgradeableProxy(logic, admin, data) {
    }
}