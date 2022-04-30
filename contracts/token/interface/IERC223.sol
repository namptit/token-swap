// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/**
 * @dev Interface of the ERC223 standard token as defined in the EIP.
 */

interface IERC223 {
    function name()        external view returns (string memory);
    function symbol()      external view returns (string memory);
    function standard()    external view returns (string memory);
    function decimals()    external view returns (uint8);
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool success);
    function transfer(address to, uint256 value, bytes calldata data) external returns (bool success);
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event TransferData(bytes data);
}