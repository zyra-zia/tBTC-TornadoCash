import React from 'react';
import { toBN } from 'web3-utils';
import * as constants from '../config';
import tUtils from '../TornadoUtils';
import Spinner from './Spinner';
import Message from './Message';
import AnonymitySet from "./AnonymitySet";
import { Grid, Card, Button, RadioGroup, Radio, FormControlLabel, FormControl } from '@material-ui/core';

class Deposit extends React.Component {
  constructor(props) {
    super(props);
    this.clickDeposit = this.clickDeposit.bind(this);
    this.denominationChange = this.denominationChange.bind(this);
    this.setMessage = this.setMessage.bind(this);

    this.state = {
      working: false,
      note: "",
      showNote: false,
      denomination: "0.001",
      currentContract: props.tornadoContract("0.01"),
      message: {
        text: "",
        isError: false,
        isSuccess: false
      }
    };
  }
  
  setMessage(text, isError=false, isSuccess=false){
    this.setState({
      message: {
        text: text,
        isError: isError,
        isSuccess: isSuccess
      }
    });
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
      this.setMessage("Not enough tokens in account", true);
      this.setState({
        working: false
      });
      return;
    }

    const tornadoContract = this.props.tornadoContract(amount);

    try {
      const allowance = await this.props.tokenContract.methods.allowance(senderAccount, tornadoContract._address).call({ from: senderAccount });

      if (toBN(allowance).lt(toBN(tokenAmount))) {
        this.setMessage('Approving tokens for deposit');
        await this.props.tokenContract.methods.approve(tornadoContract._address, tokenAmount).send({ from: senderAccount, gas: 1e6 });
      }

      this.setMessage('Submitting deposit transaction');
      await tornadoContract.methods.deposit(tUtils.toHex(deposit.commitment)).send({ from: senderAccount, gas: 2e6 })
      return noteString;
    }
    catch(error){
      this.setMessage("Unknown Error. Please try again", true);
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
      this.setMessage("Deposit Successful", false, true);
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
        <Grid container={true} justify="center">
          <Grid item={true} xs={12} >
            <Message text={this.state.message.text} isError={this.state.message.isError} isSuccess={this.state.message.isSuccess}  style={{minWidth: "400px"}}/>
          </Grid>
          <Grid item={true} xs={6} >
            <form id="depositForm" style={{maxWidth : "400px"}}>
                <Grid container justify="center" >
                  <Grid item={true} xs={12} align="center">
                  <p style={{textAlign:'center'}}>
                    Select tBTC amount to deposit
                  </p>
                    <FormControl component="fieldset">
                      <RadioGroup row aria-label="amount" name="amount" value={this.state.denomination} onChange={this.denominationChange}>
                        <FormControlLabel value="0.001" control={<Radio />} label="0.001 tBTC" />
                        <FormControlLabel value="0.01" control={<Radio />} label="0.01 tBTC" />
                        <FormControlLabel value="0.1" control={<Radio />} label="0.1 tBTC" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item={true} xs={12}>
                    { this.state.working?
                      <Spinner />
                      : 
                      <Button variant="contained" type="submit" onClick={this.clickDeposit} style={{margin:"10px"}}> 
                        Deposit 
                      </Button>
                    }
                  </Grid>
                </Grid>
            </form>
            {this.state.showNote &&
              <Card style={{maxWidth : "400px", padding: "10px"}}>
                <em>Please save this note, you will need it to withdraw your tBtc</em>
                <p style={{border: "1px black dashed", overflowWrap: "anywhere"}}>{this.state.note}</p>
              </Card>
            }
          </Grid>
          <Grid item={true} xs={6} style={{textAlign:"left"}}>
            <AnonymitySet currentContract={this.state.currentContract} denomination={this.state.denomination} />
          </Grid>
        </Grid>
    );
  }
}

export default Deposit;
