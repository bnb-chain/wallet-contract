pragma solidity 0.8.4;

interface IProxyOperatorInitialize {
    function initialize(address owner, address operator) external;
}

interface IProxyBurnInitialize {
    function initialize(address owner) external;
}