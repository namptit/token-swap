// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./token/interface/IERC223.sol";


contract TokenSwap {

    struct Tx223{
        address owner;
        IERC223 token;
        uint256 amount;
    }

    struct Tx20{
        address owner;
        IERC20 token;
        uint256 amount;
    }

    struct Asset223{
        IERC223 token;
        uint256 amount;
    }
    struct Asset20{
        IERC20 token;
        uint256 amount;
    }

    // key, val = uuid, Tx223
    mapping (string => Tx223) private tx223;

    // key, val = uuid, Tx20
    mapping (string => Tx20) private tx20;

    // key, val = uuid, false
    mapping (string => bool) private passedSession;

    // key, val = ownerADdress, Asset
    mapping (address =>  mapping (string => Asset223)) private asset223;
    mapping (address => mapping (string => Asset20)) private asset20;

    event ReceiveToken(address, uint256, bytes);
    event DepositToken(address, uint256, bytes);
    event TransferData(string, address, address, uint256, address, address, uint256);
    event Withdraw(address, address, uint256);

    // function to handle receiving token 223
    function handleReceived(address _from, uint256 _value, bytes memory _data) public
    {
        string memory sessionId = abi.decode(_data, (string));
        if (tx223[sessionId].owner != address(0)){
            require(tx223[sessionId].owner == _from, "Cannot receive any additional ERC223 token with the same sessionID from another one");
        }

        Tx223 memory tx223_tmp = Tx223({owner: _from, token: IERC223(msg.sender), amount: _value});
        tx223[sessionId] = tx223_tmp;
        emit ReceiveToken(_from, _value, _data);

        Asset223 memory assetTmp = Asset223({token: IERC223(msg.sender), amount: _value});
        asset223[_from][sessionId] = assetTmp;

        if(tx20[sessionId].owner != address(0)){
            triggerSwap(sessionId);
        }
    }


    // function to handle deposit token 20
    function deposit(address _token, uint256 _amount, bytes memory _data) public{
        require(IERC20(_token).allowance(msg.sender, address(this)) >= _amount, "amount to large");

        string memory sessionId = abi.decode(_data, (string));
        if (tx20[sessionId].owner != address(0)){
            require(tx20[sessionId].owner ==  msg.sender, "Cannot receive any additional ERC20 token with the same sessionID from another one");
        }
        
        Tx20 memory tx20_tmp = Tx20({owner: msg.sender, token: IERC20(_token), amount: _amount});
        tx20[sessionId] = tx20_tmp;

        bool sent = tx20_tmp.token.transferFrom(tx20_tmp.owner, address(this), tx20_tmp.amount);

        require(sent, "deposit erc20 failed");
        emit DepositToken(msg.sender, _amount, _data);
        Asset20 memory assetTmp = Asset20({token: IERC20(_token), amount: _amount});
        asset20[msg.sender][sessionId] = assetTmp;

        if(tx223[sessionId].owner != address(0)){
            triggerSwap(sessionId);
        }
    }

    function triggerSwap(string memory sessionId) private{
        require(passedSession[sessionId] == false, "invalid sessionId because it already used in previous swap");

        Tx223 memory trans223 = tx223[sessionId];
        Tx20 memory trans20 = tx20[sessionId];
        
        bool sent = trans223.token.transfer(trans20.owner, trans223.amount);
        require(sent, "swap token223 fail");

        sent = trans20.token.transfer(trans223.owner, trans20.amount);
        require(sent, "swap token20 fail");

        passedSession[sessionId] = true;
        asset223[trans223.owner][sessionId].amount = asset223[trans223.owner][sessionId].amount - trans223.amount;
        asset20[trans20.owner][sessionId].amount = asset20[trans20.owner][sessionId].amount - trans20.amount; 
        // delete tx223[sessionId];
        // delete tx20[sessionId];
        emit TransferData(sessionId, trans223.owner, address(trans223.token), trans223.amount, trans20.owner, address(trans20.token), trans20.amount);
    }

    function withdraw223(string memory sessionId) public{
        require(asset223[msg.sender][sessionId].amount > 0, "amount 223 is zero");

        IERC223 token223 = asset223[msg.sender][sessionId].token;
        bool sent = token223.transfer(msg.sender, asset223[msg.sender][sessionId].amount);

        require(sent, "withdraw token223 failed");
        delete tx223[sessionId];
        emit Withdraw(msg.sender, address(token223), asset223[msg.sender][sessionId].amount);
        
    }

    function withdraw20(string memory sessionId) public{
        require (asset20[msg.sender][sessionId].amount > 0, "amount 223 is zero");

        IERC20 token20 = asset20[msg.sender][sessionId].token;
        bool sent = token20.transfer(msg.sender, asset20[msg.sender][sessionId].amount);

        require(sent, "withdrae token20 failed");
        delete tx20[sessionId];
        emit Withdraw(msg.sender, address(token20), asset20[msg.sender][sessionId].amount);
    }
}

