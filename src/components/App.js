import React, { Fragment } from 'react'
import Web3 from 'web3';
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import Spinner from "./Spinner";
import ConnectButton from "./ConnectButton";
import * as constants from '../config';
import TabPanel from "./TabPanel";
import CustomTheme from "./CustomTheme";

import {CssBaseline, Grid, AppBar, Typography, Tabs, Tab, Box, ThemeProvider} from '@material-ui/core';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      tabValue: 0
    };

    this.getContractForDenomination = this.getContractForDenomination.bind(this);
    this.walletConnected = this.walletConnected.bind(this);
    this.currentAccount = this.currentAccount.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async currentAccount(){
    // Initialise default account.
    const accounts = await this.web3.eth.getAccounts();
    return accounts[0];
  }

  walletConnected(){
    this.setState({
      loading: true
    });
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
      case "0.1":
        contract = new this.web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS_1);
        break;
      case "0.01":
        contract = new this.web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS_01);
        break;
      case "0.001":
      default:
        contract = new this.web3.eth.Contract(this.Erc20Tornado.abi, constants.TORNADO_CONTRACT_ADDRESS_001);
    }
    return contract;
  }

  a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`
    };
  }
  
  handleChange(event, newValue) {
    this.setState({
      tabValue: newValue
    });
  }

  render(){
    return (
      <ThemeProvider theme={CustomTheme}>
      <Box>
        <CssBaseline />
        <AppBar position="relative" style={{padding:'20px'}}>
          <Typography variant="h4" align="center">
            tBTC + Tornado Cash
          </Typography>
          <p style={{textAlign:'center'}}>
            Private Bitcoin transactions using tBTC and Tornado Cash
          </p>
          <ConnectButton setMessage = {this.setMessage} walletConnected = {this.walletConnected}/>
        </AppBar>
        <Grid container={true} justify="center" style={{padding: "0", margin:"0"}}>
          <Grid item={true} xs={12} align="center" style={{padding: "0", margin:"0"}}>
            {this.web3 === undefined?
              <p style={{marginTop:"50px"}}>Please connect to a wallet. You must have an ethereum wallet like MetaMask installed, to be able to use this app.</p>
              :
              (
                this.state.loading ?
                <Spinner/>
                :
                <Fragment>
                  <AppBar position="relative">
                    <Tabs value={this.state.tabValue} onChange={this.handleChange} centered={true} aria-label="Deposit/Withdraw">
                      <Tab label="Deposit" {...this.a11yProps(0)} />
                      <Tab label="Withdraw" {...this.a11yProps(1)} />
                    </Tabs>
                  </AppBar>
                  <TabPanel value={this.state.tabValue} index={0}>
                    <Deposit 
                      currentAccount = {this.currentAccount} 
                      tokenContract = {this.tokenContract} 
                      tornadoContract = {this.getContractForDenomination} 
                      setMessage = {this.setMessage}
                    />
                  </TabPanel>
                  <TabPanel value={this.state.tabValue} index={1} >
                    <Withdraw
                      web3 = {this.web3}
                      currentAccount = {this.currentAccount}
                      tornadoContract = {this.getContractForDenomination} 
                      setMessage = {this.setMessage}
                    />
                  </TabPanel>
                </Fragment>
              )
            }
          </Grid>
        </Grid>
      </Box>
      </ThemeProvider>
    );
  }
}

export default App;
