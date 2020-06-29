import React from 'react';
import Web3 from 'web3';
import Deposit from "./Deposit";
import * as constants from '../config';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
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
    this.tornadoContract = new web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS);
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


  render(){
    return (
      <div className="App">
        <header className="App-header">
          <h1>
            TBTC + Tornado Cash
          </h1>
        </header>
        <main>
            { this.state.loading ?
              <p>Loading...</p>
              :
              <Deposit 
                defaultAccount = {this.web3.eth.defaultAccount} 
                tokenContract = {this.tokenContract} 
                tornadoContract = {this.tornadoContract} 
              />
            }
        </main>
      </div>
    );
  }
}

export default App;
