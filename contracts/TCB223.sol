// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./token/ERC223.sol";

contract TCB223 is ERC223{
    constructor(string memory name, string memory symbol) ERC223(name, symbol, 18) {
        _mint(msg.sender, 100 * 10**18);
    }
}