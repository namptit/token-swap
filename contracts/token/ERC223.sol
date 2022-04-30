// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./interface/IERC223.sol";
import "../../utils/Address.sol";
import "../TokenSwap.sol";

contract ERC223 is IERC223 {

    string  private _name;
    string  private _symbol;
    uint8   private _decimals;
    uint256 private _totalSupply;
    mapping(address => uint256) public balances; // List of user balances.

    constructor(string memory new_name, string memory new_symbol, uint8 new_decimals)
    {
        _name     = new_name;
        _symbol   = new_symbol;
        _decimals = new_decimals;
    }

    function standard() public pure override returns (string memory)
    {
        return "erc223";
    }

    function name() public view override returns (string memory)
    {
        return _name;
    }

    function symbol() public view override returns (string memory)
    {
        return _symbol;
    }

    function decimals() public view override returns (uint8)
    {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256)
    {
        return _totalSupply;
    }

    function balanceOf(address _owner) public view override returns (uint256)
    {
        return balances[_owner];
    }
    
    function transfer(address _to, uint256 _value, bytes calldata _data) public override returns (bool success)
    {
        balances[msg.sender] = balances[msg.sender] - _value;
        balances[_to] = balances[_to] + _value;
        if(Address.isContract(_to)) {
            TokenSwap(_to).handleReceived(msg.sender, _value, _data);
        }
        emit TransferData(_data);
        return true;
    }

    function transfer(address _to, uint256 _value) public override returns (bool success)
    {
        bytes memory _empty = hex"00000000";
        balances[msg.sender] = balances[msg.sender] - _value;
        balances[_to] = balances[_to] + _value;
        if(Address.isContract(_to)) {
            TokenSwap(_to).handleReceived(msg.sender, _value, _empty);
        }
        // emit Transfer(msg.sender, _to, _value);
        // emit TransferData(_empty);
        return true;
    }

    

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        balances[account] += amount;
    }
}