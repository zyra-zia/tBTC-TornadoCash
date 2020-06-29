import React from 'react';
import { fromWei, toBN, BN } from 'web3-utils';
import {bigInt as snarkBigInt} from 'snarkjs';
import crypto from 'crypto';
import circomlib from 'circomlib';
import * as constants from '../config';

class Deposit extends React.Component {
  constructor(props) {
    super(props);
    this.clickDeposit = this.clickDeposit.bind(this);
  }

  fromDecimals( {amount, decimals} ) {
    amount = amount.toString()
    let tbtc = amount.toString()
    const base = new BN('10').pow(new BN(decimals))
    const baseLength = base.toString(10).length - 1 || 1
  
    const negative = tbtc.substring(0, 1) === '-'
    if (negative) {
      tbtc = tbtc.substring(1)
    }
  
    if (tbtc === '.') {
      throw new Error('Error while converting number ' + amount + ' to decimals, invalid value')
    }
  
    // Split it into a whole and fractional part
    const comps = tbtc.split('.')
    if (comps.length > 2) {
      throw new Error(
        'Error while converting number ' + amount + ' to decimals,  too many decimal points'
      )
    }
  
    let whole = comps[0]
    let fraction = comps[1]
  
    if (!whole) {
      whole = '0'
    }
    if (!fraction) {
      fraction = '0'
    }
    if (fraction.length > baseLength) {
      throw new Error(
        'Error while converting number ' + amount + ' to decimals, too many decimal places'
      )
    }
  
    while (fraction.length < baseLength) {
      fraction += '0'
    }
  
    whole = new BN(whole)
    fraction = new BN(fraction)
    let decimal = whole.mul(base).add(fraction)
  
    if (negative) {
      decimal = decimal.mul(negative)
    }
  
    return new BN(decimal.toString(10), 10)
  }

  /** Generate random number of specified byte length */
  rbigint(nbytes){
    let rb = crypto.randomBytes(nbytes);
    let bg =  snarkBigInt.leBuff2int(rb);
    return bg;
  }
  
  /** Compute pedersen hash */
  pedersenHash(data){ 
    return circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];
  }

  /** BigNumber to hex string of specified length */
  toHex(number, length = 32){
    return '0x' + (number instanceof Buffer ? number.toString('hex') : snarkBigInt(number).toString(16)).padStart(length * 2, '0');
  }

  createDeposit(nullifier, secret) {
    let deposit = { nullifier, secret };
    deposit.preimage = Buffer.concat([deposit.nullifier.leInt2Buff(31), deposit.secret.leInt2Buff(31)]);
    deposit.commitment = this.pedersenHash(deposit.preimage);
    deposit.commitmentHex = this.toHex(deposit.commitment);
    deposit.nullifierHash = this.pedersenHash(deposit.nullifier.leInt2Buff(31));
    deposit.nullifierHex = this.toHex(deposit.nullifierHash);
    return deposit;
  }

  async deposit() {
    const deposit = this.createDeposit(this.rbigint(31), this.rbigint(31));
    const note = this.toHex(deposit.preimage, 62);
    const currency = constants.CURRENCY;
    const amount = document.querySelector('input[name="amount"]:checked').value;
    const noteString = `tornado-${currency}-${amount}-3-${note}`;
    console.log(`Your note: ${noteString}`);
    
    const senderAccount = this.props.defaultAccount;
    
    const decimals = constants.TOKEN_DECIMALS;
    const tokenAmount = this.fromDecimals( {amount, decimals} );
    console.log("token amount to deposit is " + tokenAmount);

    const allowance = await this.props.tokenContract.methods.allowance(senderAccount, this.props.tornadoContract._address).call({ from: senderAccount });

    console.log('Current allowance is', allowance);
    if (toBN(allowance).lt(toBN(tokenAmount))) {
      console.log('Approving tokens for deposit');
      await this.props.tokenContract.methods.approve(this.props.tornadoContract._address, tokenAmount).send({ from: senderAccount, gas: 1e6 });
    }

    console.log('Submitting deposit transaction')
    return this.props.tornadoContract.methods.deposit(this.toHex(deposit.commitment)).send({ from: senderAccount, gas: 2e6 })
  }

  async clickDeposit(event){
    event.preventDefault();
    const note = await this.deposit();
    console.log('Deposited note:', note);

  }

  render(){
    return (
        <section>
            <form id="depositForm">
                <h2>Deposit TBTC</h2>
                <input type="radio" name="amount" value="0.01" id="amount001" defaultChecked/>
                  <label htmlFor="amount001">0.01</label>

                  <input type="radio" name="amount" value="0.1" id="amount01"/>
                  <label htmlFor="amount01">0.1</label>

                  <input type="radio" name="amount" value="1" id="amount1"/>
                  <label htmlFor="amount1">1</label>
                  
                <button type="submit" onClick={this.clickDeposit} >Submit</button>
                {console.log(this.props)}
            </form>
        </section>
    );
  }
}

export default Deposit;
