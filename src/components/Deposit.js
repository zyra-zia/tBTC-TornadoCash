import React from 'react';
import { toBN } from 'web3-utils';
import * as constants from '../config';
import tUtils from '../TornadoUtils';
import Spinner from './Spinner';

class Deposit extends React.Component {
  constructor(props) {
    super(props);
    this.clickDeposit = this.clickDeposit.bind(this);
    this.state = {
      working: false
    };
  }
  
  async deposit() {
    const deposit = tUtils.createDeposit(tUtils.rbigint(31), tUtils.rbigint(31));
    const note = tUtils.toHex(deposit.preimage, 62);
    const currency = constants.CURRENCY;
    const amount = document.querySelector('input[name="amount"]:checked').value;

    const balance = await this.props.tokenContract.methods.balanceOf(this.props.defaultAccount).call();

    const netId = 3; //because demo only works with ropsten
    const noteString = `tornado-${currency}-${amount}-${netId}-${note}`;
    console.log(`Your note: ${noteString}`);
    
    const senderAccount = this.props.defaultAccount;
    
    const decimals = constants.TOKEN_DECIMALS;
    const tokenAmount = tUtils.fromDecimals( {amount, decimals} );
    console.log("token amount to deposit is " + tokenAmount);

     //check there is enough balance
    if (toBN(balance).lt(toBN(tokenAmount))) {
      this.props.setMessage("Not enough tokens in account", true);
      this.setState({
        working: false
      });
      return;
    }

    const tornadoContract = this.props.tornadoContract(amount);

    try {
      const allowance = await this.props.tokenContract.methods.allowance(senderAccount, tornadoContract._address).call({ from: senderAccount });

      console.log('Current allowance is', allowance);
      if (toBN(allowance).lt(toBN(tokenAmount))) {
        this.props.setMessage('Approving tokens for deposit');
        await this.props.tokenContract.methods.approve(tornadoContract._address, tokenAmount).send({ from: senderAccount, gas: 1e6 });
      }

      this.props.setMessage('Submitting deposit transaction');
      return tornadoContract.methods.deposit(tUtils.toHex(deposit.commitment)).send({ from: senderAccount, gas: 2e6 })
    }
    catch(error){
      this.props.setMessage("Unknown Error. Please try again", true);
      this.setState({
        working: false
      });
    }
  }

  async clickDeposit(event){
    event.preventDefault();
    this.setState({
      working: true
    });
    const note = await this.deposit();
    if(note !== undefined){
      this.props.setMessage("Deposit Successful");
      console.log('Deposited note:', note);
    }
    this.setState({
      working: false
    });

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

                { this.state.working?
                  <Spinner />
                  : 
                  <button type="submit" onClick={this.clickDeposit} >Submit</button>
                }
            </form>
        </section>
    );
  }
}

export default Deposit;
