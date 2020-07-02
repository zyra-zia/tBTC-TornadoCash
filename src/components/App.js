import React, { Fragment } from 'react'
import Web3 from 'web3';
import Message from './Message';
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Spinner from "./Spinner";
import * as constants from '../config';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      message: {
        text: "",
        isError: false
      }
    };

    this.getContractForDenomination = this.getContractForDenomination.bind(this);
    this.setMessage = this.setMessage.bind(this);
  }

  componentDidMount(){
    this.fetchData().then(() => {
      return this.initWeb3();
    })
    .then(() => {
      this.setState({
        loading: false
      });
    });
  }

  async initWeb3(){
    let web3 = new Web3(window.web3.currentProvider);
    this.web3 = web3;
    // Initialise default account.
    const accounts = await this.web3.eth.getAccounts();
    this.web3.eth.defaultAccount = accounts[0];

    this.netId = await web3.eth.net.getId();
    this.tornadoContract = this.getContractForDenomination("0.01")
    this.tokenContract = new web3.eth.Contract(this.TBtcContract.abi, constants.TBTC_TOKEN_CONTRACT_ADDRESS);
  }

  async fetchData(){
    let p1 = fetch(constants.TBTC_TOKEN_CONTRACT_ABI)
      .then(resp => resp.json())
      .then((data) => this.TBtcContract = data);
    let p2 = fetch(constants.TORNADO_CONTRACT_ABI)
      .then(resp => resp.json())
      .then((data) => this.Erc20Tornado = data);
    return Promise.all([p1, p2]);
  }

  getContractForDenomination(denomination){
    let contract;
    switch(denomination){
      case "1":
        contract = new this.web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS_1);
        break;
      case "0.1":
        contract = new this.web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS_01);
        break;
      case "0.01":
      default:
        contract = new this.web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS_001);
    }
    return contract;
  }

  setMessage(text, isError=false){
    this.setState({
      message: {
        text: text,
        isError: isError
      }
    });
  }

  render(){
    return (
      <div className="App">
        <header className="App-header">
          <h1>
            TBTC + Tornado Cash
          </h1>
        </header>
        <main>
            <Message text={this.state.message.text} isError={this.state.message.isError}/>
            { this.state.loading ?
              <Spinner/>
              :
              <Fragment>
                <Deposit 
                  defaultAccount = {this.web3.eth.defaultAccount} 
                  tokenContract = {this.tokenContract} 
                  tornadoContract = {this.getContractForDenomination} 
                  setMessage = {this.setMessage}
                />
                <Withdraw
                  web3 = {this.web3}
                  defaultAccount = {this.web3.eth.defaultAccount}
                  tornadoContract = {this.getContractForDenomination} 
                  setMessage = {this.setMessage}
                />
              </Fragment>
            }
        </main>
      </div>
    );
  }
}

export default App;
