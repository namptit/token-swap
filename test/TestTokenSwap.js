const TCB1Token = artifacts.require("TCB223");
const TCB2Token = artifacts.require("TCB20");
const TokenSwap = artifacts.require("TokenSwap");
const BigNumber = require('bignumber.js');
var assert = require('assert');

contract("TokenSwap", accounts => {
    let total1, owner1, token1, balance1, amount1;
    let total2, owner2, token2, balance2, amount2;
    let owner3, tokenSwap;
    beforeEach(async function(){
        // init token1
        this.total1 = BigNumber(web3.utils.toWei('100'));
        this.owner1 = accounts[0];
        this.token1 = await TCB1Token.new("TCB coin", "TCB223", {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        this.amount1 = BigNumber(web3.utils.toWei('10'));

        // init token2
        this.owner2 = accounts[1];
        this.total2 = BigNumber(web3.utils.toWei('100'));
        this.token2 = await TCB2Token.new("TCB coin", "TCB20", {from: this.owner2})
        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        this.amount2 = BigNumber(web3.utils.toWei('5'));

        // init tokenSwap
        this.owner3 = accounts[2]
        this.tokenSwap = await TokenSwap.new({from: this.owner3})
    });

    it('T01 swap successful', async function () {

        // transfer token1 from owner1 to tokenSwap
        let uuid1= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid1, {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        let balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.total1.eq(this.balance1.plus(this.amount1)), "owner1 transfer fail")
        assert(balanceSwap1.eq(this.amount1), "token swap not receive enough token1")

        // deposit token2 from owner2 to tokenSwap
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        let allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        let uuid2= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid2, {from: this.owner2});

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        let zero = BigNumber("0")
        let balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(balanceSwap2.eq(zero), "swap token transfer owner1 fail balanceSwap2= " +  balanceSwap2)
        assert(balanceSwap1.eq(zero), "swap token transfer owner2 fail balanceSwap1= " + balanceSwap1)
        assert(this.total2.eq(this.balance2.plus(this.amount2)), "owner2 transfer fail, balance2 = " + this.balance2)

        let balaneOwner1Token2 = BigNumber(await this.token2.balanceOf(this.owner1))
        assert(balaneOwner1Token2.eq(this.amount2), "owner1 not own token2, balaneOwner1Token2= " + balaneOwner1Token2)

        let balaneOwner2Token1 = BigNumber(await this.token1.balanceOf(this.owner2))
        assert(balaneOwner2Token1.eq(this.amount1), "owner2 not own token1, balaneOwner2Token1= " + balaneOwner2Token1)
    });

    it.skip('T02 swap fail with 2 user use the same sessionId and token type erc223', async function () {
        
        
        // send 50 erc223 to owner2
        this.total2 = BigNumber(web3.utils.toWei('50'));
        await this.token1.transfer(this.owner2, this.total2, {from: this.owner1})

        this.balance2 = BigNumber(await this.token1.balanceOf(this.owner2))
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        // check total = balance
        assert(this.total2.eq(this.balance2), "token2 not total 50")
        assert(this.balance1.eq(this.balance2), "token1 not total 50")

        this.total1 = this.balance1

        // transfer token1 from this.this.owner1 to tokenSwap
        let uuid1= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid1, {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.total1.eq(this.balance1.plus(this.amount1)), "owner1 transfer fail")
        assert(balanceSwap1.eq(this.amount1), "token swap not receive enough token1")

        // transfer token1 from owner2 to tokenSwap
        try{
            await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount2, uuid1, {from: this.owner2})
            assert.equal(1, 2, "Error: transfer same sessionID from 2 user complete\nExpected: transfer failed.")
        }catch(e){
            assert.equal(e.reason, "Cannot receive any additional ERC223 token with the same sessionID from another one", "Error not the same: "+ e.reason)
        }

    });

    it.skip('T03 swap fail with 2 user use the same sessionId and token type erc20', async function () {
        
        // send 50 erc223 to owner2
        this.total1 = BigNumber(web3.utils.toWei('50'));
        await this.token2.transfer(this.owner1, this.total1, {from: this.owner2})

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        this.balance1 = BigNumber(await this.token2.balanceOf(this.owner1))
        // check total = balance
        assert(this.total1.eq(this.balance1), "token2-owner2 not total 50")

        this.total1 = this.balance1
        this.total2 = this.balance2

       // deposit token2 from owner2 to tokenSwap
       await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
       let allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
       assert(allow.eq(this.amount2), "token swap not allow amount")

       // exec deposit and automatic swap token1 and token2
       let uuid= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
       await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid, {from: this.owner2});

       this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
       assert(this.balance2.eq(this.total2.minus(this.amount2)), "owner1 deposit fail, balance1 = " + this.balance2)

        // transfer token1 from owner2 to tokenSwap
        try{
             // deposit token2 from owner2 to tokenSwap
            await this.token2.approve(this.tokenSwap.address, this.amount1, {from: this.owner1});
                
            let allow = BigNumber(await this.token2.allowance(this.owner1, this.tokenSwap.address));
            assert(allow.eq(this.amount1), "token swap not allow amount")

            // exec deposit and automatic swap token1 and token2
            let uuid= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
            await this.tokenSwap.deposit(this.token2.address, this.amount1, uuid, {from: this.owner1});
            assert.equal(1, 2, "Error: transfer same sessionID from 2 user complete\nExpected: transfer failed.")
        }catch(e){
            // console.log(e)
            assert.equal(e.reason, "Cannot receive any additional ERC20 token with the same sessionID from another one", "Error not the same: "+ e.reason)
        }

    });

    it.skip('T04 second swap fail with sessionId already used', async function () {

        // transfer token1 from this.owner1 to tokenSwap
        let uuid= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid, {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.total1.eq(this.balance1.plus(this.amount1)), "owner1 transfer fail")
        assert(balanceSwap1.eq(this.amount1), "token swap not receive enough token1")
        this.total1 = this.balance1

        // deposit this.token2 from owner2 to tokenSwap
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        let allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid, {from: this.owner2});

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        zero = BigNumber("0")
        balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(balanceSwap2.eq(zero), "swap token transfer owner1 fail balanceSwap2= " +  balanceSwap2)
        assert(balanceSwap1.eq(zero), "swap token transfer owner2 fail balanceSwap1= " + balanceSwap1)
        assert(this.total2.eq(this.balance2.plus(this.amount2)), "owner2 transfer fail, balance2 = " + this.balance2)

        let balaneOwner1Token2 = BigNumber(await this.token2.balanceOf(this.owner1))
        assert(balaneOwner1Token2.eq(this.amount2), "owner1 not own token2, balaneOwner1Token2= " + balaneOwner1Token2)

        let balaneOwner2Token1 = BigNumber(await this.token1.balanceOf(this.owner2))
        assert(balaneOwner2Token1.eq(this.amount1), "owner2 not own token1, balaneOwner2Token1= " + balaneOwner2Token1)

        // exce swap same sessionID
        // init token1 for user 4
        let owner4 = accounts[3]
        let amount4 = BigNumber(web3.utils.toWei('5'));
        await this.token1.transfer(owner4, web3.utils.toWei('50'), {from: this.owner1})
        let balance4 = BigNumber(await this.token1.balanceOf(owner4))
        assert(balance4.eq(BigNumber(web3.utils.toWei('50'))))

        // init token2 for user 5
        let owner5 = accounts[4]
        let amount5 = BigNumber(web3.utils.toWei('10'));
        await this.token2.transfer(owner5, web3.utils.toWei('50'), {from: this.owner2})
        let balance5 = BigNumber(await this.token2.balanceOf(owner5))
        assert(balance5.eq(BigNumber(web3.utils.toWei('50'))))

        try{
            await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, amount4, uuid, {from: owner4})
            assert.equal(1, 2, "Error: transfer same sessionID of second swap complete\nExpected: swap failed.")
        }catch(e){
            assert.equal(e.reason, "Cannot receive any additional ERC223 token with the same sessionID from another one", "Error not the same: "+ e.reason)
        }

    });

    it.skip('T05 withdraw ERC223 successful without swap', async function () {

        // transfer token1 from owner1 to tokenSwap
        let uuid= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid, {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.total1.eq(this.balance1.plus(this.amount1)), "owner1 transfer fail")
        assert(balanceSwap1.eq(this.amount1), "token swap not receive enough token1")
        this.total1 = this.balance1
    
        await this.tokenSwap.withdraw223("123e4567-e89b-12d3-a456-426614174000", {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        let zero = BigNumber("0")
        assert(this.balance1.eq(this.total1.plus(this.amount1)), "owner1 dont receive enough token1")
        assert(balanceSwap1.eq(zero), "swapContract refund fail")
    });

    it.skip('T06 withdraw ERC20 successful without swap', async function () {
        
        // deposit token2 from owner2 to tokenSwap
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        let allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        let uuid= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid, {from: this.owner2});
        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        let balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))
        assert(this.balance2.eq(this.total2.minus(this.amount2)), "deposit fail")
        this.total2 = this.balance2

        await this.tokenSwap.withdraw20("123e4567-e89b-12d3-a456-426614174000", {from: this.owner2})
        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))
        let zero = BigNumber("0")
        assert(this.balance2.eq(this.total2.plus(this.amount2)), "owner2 dont receive enough token2")
        assert(balanceSwap2.eq(zero), "swapContract refund fail")
    
    });

    it.skip('T07 user1 withdraw token223 then transfer token223 successlly to token swap with the same sessionID', async function(){

        // 1 transfer
        let uuid1_hex= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid1_hex, {from: this.owner1})

        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1)) 
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.balance1.eq(this.total1.minus(this.amount1)))
        assert(balanceSwap1.eq(this.amount1))
        this.total1 = this.balance1

        //2 withdraw
        let uuid_string = "123e4567-e89b-12d3-a456-426614174000"
        await this.tokenSwap.withdraw223(uuid_string, {from: this.owner1})
        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        let zero = BigNumber("0")
        assert(this.balance1.eq(this.total1.plus(this.amount1)), "owner1 dont receive enough token1")
        assert(balanceSwap1.eq(zero), "swapContract refund fail")

        this.total1 = this.balance1

        // 3 transfer again
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid1_hex, {from: this.owner1})

        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1))
        assert(this.balance1.eq(this.total1.minus(this.amount1)))
    });

    it.skip('T08 user2 withdraw token20 then transfer token20 successlly to token swap with the same sessionID', async function(){

        // 1 transfer
        let uuid1_hex= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        let allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid1_hex, {from: this.owner2});

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2)) 
        balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))

        assert(this.balance2.eq(this.total2.minus(this.amount2)))
        assert(balanceSwap2.eq(this.amount2))
        this.total2 = this.balance2

        //2 withdraw
        let uuid_string = "123e4567-e89b-12d3-a456-426614174000"
        await this.tokenSwap.withdraw20(uuid_string, {from: this.owner2})
        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2))
        balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))
        let zero = BigNumber("0")
        assert(this.balance2.eq(this.total2.plus(this.amount2)), "owner2 dont receive enough token2")
        assert(balanceSwap2.eq(zero), "swapContract refund fail")

        this.total2 = this.balance2

        // 3 transfer again
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid1_hex, {from: this.owner2});

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2)) 
        balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))
        
        assert(this.balance2.eq(this.total2.minus(this.amount2)))
        assert(balanceSwap2.eq(this.amount2))
    });

    it.skip('T09 user1 transfer token223 successlly to token swap with 2 sessionID', async function(){

        // 1 transfer
        let uuid1_hex= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid1_hex, {from: this.owner1})

        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1)) 
        balanceSwap1 = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.balance1.eq(this.total1.minus(this.amount1)))
        assert(balanceSwap1.eq(this.amount1))
        this.total1 = this.balance1

        //2 transfer
        let uuid2_hex= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174001")
        await this.token1.methods['transfer(address,uint256,bytes)'](this.tokenSwap.address, this.amount1, uuid2_hex, {from: this.owner1})

        this.balance1 = BigNumber(await this.token1.balanceOf(this.owner1)) 
        balanceSwap1After = BigNumber(await this.token1.balanceOf(this.tokenSwap.address))
        assert(this.balance1.eq(this.total1.minus(this.amount1)))
        assert(balanceSwap1After.eq(balanceSwap1.plus(this.amount1)))
        this.total1 = this.balance1
    });

    it.skip('T10 user2 transfer token20 successlly to token swap with 2 sessionID', async function(){

        // 1 transfer
        let uuid1_hex= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174000")
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        let allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid1_hex, {from: this.owner2});

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2)) 
        balanceSwap2 = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))

        assert(this.balance2.eq(this.total2.minus(this.amount2)))
        assert(balanceSwap2.eq(this.amount2))
        this.total2 = this.balance2

        // 1 transfer
        let uuid2_hex= web3.eth.abi.encodeParameter("string", "123e4567-e89b-12d3-a456-426614174001")
        await this.token2.approve(this.tokenSwap.address, this.amount2, {from: this.owner2});
        
        allow = BigNumber(await this.token2.allowance(this.owner2, this.tokenSwap.address));
        assert(allow.eq(this.amount2), "token swap not allow amount")

        // exec deposit and automatic swap token1 and token2
        await this.tokenSwap.deposit(this.token2.address, this.amount2, uuid2_hex, {from: this.owner2});

        this.balance2 = BigNumber(await this.token2.balanceOf(this.owner2)) 
        balanceSwap2After = BigNumber(await this.token2.balanceOf(this.tokenSwap.address))

        assert(this.balance2.eq(this.total2.minus(this.amount2)))
        assert(balanceSwap2After.eq(balanceSwap2.plus(this.amount2)))
        this.total2 = this.balance2
    });

});