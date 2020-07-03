import React from 'react';
import { toBN } from 'web3-utils';
import * as constants from '../config';
import tUtils from '../TornadoUtils';
import Spinner from './Spinner';
import AnonymitySet from "./AnonymitySet";

class Deposit extends React.Component {
  constructor(props) {
    super(props);
    this.clickDeposit = this.clickDeposit.bind(this);
    this.denominationChange = this.denominationChange.bind(this);

    this.state = {
      working: false,
      note: "",
      showNote: false,
      denomination: "0.01",
      currentContract: props.tornadoContract("0.01")
    };
  }
  
  async deposit() {
    const deposit = tUtils.createDeposit(tUtils.rbigint(31), tUtils.rbigint(31));
    const note = tUtils.toHex(deposit.preimage, 62);
    const currency = constants.CURRENCY;
    const amount = document.querySelector('input[name="amount"]:checked').value;
    const currentAccount = await this.props.currentAccount();

    const balance = await this.props.tokenContract.methods.balanceOf(currentAccount).call();

    const netId = 3; //because demo only works with ropsten
    const noteString = `tornado-${currency}-${amount}-${netId}-${note}`;
    
    const senderAccount = currentAccount;
    
    const decimals = constants.TOKEN_DECIMALS;
    const tokenAmount = tUtils.fromDecimals( {amount, decimals} );

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

      if (toBN(allowance).lt(toBN(tokenAmount))) {
        this.props.setMessage('Approving tokens for deposit');
        await this.props.tokenContract.methods.approve(tornadoContract._address, tokenAmount).send({ from: senderAccount, gas: 1e6 });
      }

      this.props.setMessage('Submitting deposit transaction');
      await tornadoContract.methods.deposit(tUtils.toHex(deposit.commitment)).send({ from: senderAccount, gas: 2e6 })
      return noteString;
    }
    catch(error){
      this.props.setMessage("Unknown Error. Please try again", true);
      this.hideSpinner();
    }
  }

  showSpinner(){
    this.setState({
      working: true
    });
  }

  hideSpinner(){
    this.setState({
      working: false
    });
  }

  showNote(note){
    this.setState({
      note: note,
      showNote: true
    });
  }

  hideNote(){
    this.setState({
      showNote: false
    });
  }

  async clickDeposit(event){
    event.preventDefault();
    this.hideNote();
    this.showSpinner();
    
    const note = await this.deposit();
    if(note !== undefined){
      this.props.setMessage("Deposit Successful");
      this.showNote(note);
    }
    
    this.hideSpinner();
  }

  denominationChange(){
    const value = document.querySelector('input[name="amount"]:checked').value;
    this.setState({
      denomination: value,
      currentContract: this.props.tornadoContract(value)
    });
  }

  render(){
    return (
        <section>
            <form id="depositForm">
                <h2>Deposit TBTC</h2>
                <input type="radio" name="amount" value="0.01" id="amount001" onChange={this.denominationChange} defaultChecked/>
                <label htmlFor="amount001">0.01</label>

                <input type="radio" name="amount" value="0.1" id="amount01" onChange={this.denominationChange}/>
                <label htmlFor="amount01">0.1</label>

                <input type="radio" name="amount" value="1" id="amount1" onChange={this.denominationChange}/>
                <label htmlFor="amount1">1</label>

                { this.state.working?
                  <Spinner />
                  : 
                  <button type="submit" onClick={this.clickDeposit} >Submit</button>
                }
            </form>
            <AnonymitySet currentContract={this.state.currentContract} denomination={this.state.denomination} />
            {this.state.showNote &&
              <p>
                {this.state.note}
              </p>
            }
        </section>
    );
  }
}

export default Deposit;
