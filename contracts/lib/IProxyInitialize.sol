pragma solidity ^0.8.0;

interface IProxyOperatorInitialize {
    function initialize(address owner, address operator) external;
}

interface IProxyBurnInitialize {
    function initialize(address owner) external;
}