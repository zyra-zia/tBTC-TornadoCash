import React, {Fragment} from 'react';
import Message from "./Message";
import {bigInt as snarkBigInt} from 'snarkjs';
import tUtils from '../TornadoUtils';
import MerkleTree from '../lib/MerkleTree';
import buildGroth16 from 'websnark/src/groth16';
import websnarkUtils from 'websnark/src/utils';
import Spinner from "./Spinner";
import { Grid, Button, TextField} from '@material-ui/core';

class Withdraw extends React.Component {
  constructor(props) {
    super(props);
    this.clickWithdraw = this.clickWithdraw.bind(this);
    this.setMessage = this.setMessage.bind(this);

    this.state = {
        loading: true,
        working: false,
        message: {
          text: "",
          isError: false,
          isSuccess: false
        }
    };
  }

  componentDidMount(){
    this.init();
  }

  async init(){
    let p1 = fetch('assets/circuits/withdraw.json').then((response)=>{
        return response.json();
    })
    .then((data)=>{
        this.circuit = data;
    });
    let p2 = fetch('assets/circuits/withdraw_proving_key.bin').then((response)=>{
        return response.arrayBuffer();
    })
    .then((data)=>{
        this.proving_key = data;
    });
    this.groth16 = await buildGroth16();

    Promise.all([p1, p2, this.groth16]).then(()=>{
        this.setState({
            loading: false
        });
    });
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

  async withdraw(note, recipient) {
    try{
      const deposit = this.parseNote(note);
      this.denomination = this.parseAmount(note);
      const { proof, args } = await this.generateSnarkProof(deposit, recipient);
      this.setMessage('Sending withdrawal transaction...');
      const currentAccount = await this.props.currentAccount();
      const tx = await this.props.tornadoContract(this.denomination).methods.withdraw(proof, ...args).send({ from: currentAccount, gas: 1e6 });
      return tx.status;
    }
    catch(error){
      return false;
    }
  }

    /**
    * Generate merkle tree for a deposit.
    * Download deposit events from the contract, reconstructs merkle tree, finds our deposit leaf
    * in it and generates merkle proof
    * @param deposit Deposit object
    */
    async generateMerkleProof(deposit) {
    
    const events = await this.props.tornadoContract(this.denomination).getPastEvents('Deposit', { fromBlock: 0, toBlock: 'latest' });
    const leaves = events
      .sort((a, b) => a.returnValues.leafIndex - b.returnValues.leafIndex) // Sort events in chronological order
      .map(e => e.returnValues.commitment);
    
    const MERKLE_TREE_HEIGHT = 20;
    const tree = new MerkleTree(MERKLE_TREE_HEIGHT, leaves);
  
    // Find current commitment in the tree
    let depositEvent = events.find(e => e.returnValues.commitment === tUtils.toHex(deposit.commitment));
    let leafIndex = depositEvent ? depositEvent.returnValues.leafIndex : -1;
  
    // Validate that our data is correct (optional)
    //const isValidRoot = await this.props.tornadoContract.methods.isKnownRoot(Utils.toHex(await tree.root())).call();
    //const isSpent = await this.props.tornadoContract.methods.isSpent(Utils.toHex(deposit.nullifierHash)).call();
    
    // Compute merkle proof of our commitment
    return await tree.path(leafIndex);
  }

  async generateSnarkProof(deposit, recipient) {
    // Compute merkle proof of our commitment
    const { root, path_elements, path_index } = await this.generateMerkleProof(deposit);
  
    // Prepare circuit input
    const input = {
      // Public snark inputs
      root: root,
      nullifierHash: deposit.nullifierHash,
      recipient: snarkBigInt(recipient),
      relayer: 0,
      fee: 0,
      refund: 0,
  
      // Private snark inputs
      nullifier: deposit.nullifier,
      secret: deposit.secret,
      pathElements: path_elements,
      pathIndices: path_index,
    };
  
    this.setMessage('Generating SNARK proof...');
    const proofData = await websnarkUtils.genWitnessAndProve(this.groth16, input, this.circuit, this.proving_key);
    const { proof } = websnarkUtils.toSolidityInput(proofData);
  
    const args = [
      tUtils.toHex(input.root),
      tUtils.toHex(input.nullifierHash),
      tUtils.toHex(input.recipient, 20),
      tUtils.toHex(input.relayer, 20),
      tUtils.toHex(input.fee),
      tUtils.toHex(input.refund)
    ];
  
    return { proof, args };
  }  

  parseAmount(noteString) {
    const noteRegex = /tornado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g
    const match = noteRegex.exec(noteString);
    return match.groups.amount;
  }

  parseNote(noteString) {
    const noteRegex = /tornado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g
    const match = noteRegex.exec(noteString);
  
    const buf = Buffer.from(match.groups.note, 'hex');
    const nullifier = snarkBigInt.leBuff2int(buf.slice(0, 31));
    const secret = snarkBigInt.leBuff2int(buf.slice(31, 62));
    
    return tUtils.createDeposit(nullifier, secret);
  }

  isValidNote(note){
    const noteRegex = /tornado-(?<currency>\w+)-(?<amount>[\d.]+)-(?<netId>\d+)-0x(?<note>[0-9a-fA-F]{124})/g
    const match = noteRegex.exec(note);
    if(match === null){
      this.setMessage("Invalid Note", true);
    }
    else {
      return true;
    }
  }

  isValidAddress(address){
    if(this.props.web3.utils.isAddress(address)){
      return true;
    }
    else {
      this.setMessage("Invalid recipient address", true);
    }
  }

  async clickWithdraw(event){
    event.preventDefault();
    const note = document.getElementById("note").value;
    const address = document.getElementById("recipient").value;
    if(!this.isValidNote(note) || !this.isValidAddress(address)){
      return;
    }

    this.showSpinner();
    
    const status = await this.withdraw(note, address);
    if(status === true){
      this.setMessage("Successfull withdrawal to " + address, false, true);
    }
    else {
      this.setMessage("Invalid Note or The note has already been spent", true);
    }
    this.hideSpinner();
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

  render(){
    return (
      <Grid container={true} justify="center" >
        <Grid item={true} xs={12} >
            {this.state.loading?
            <Spinner />
            :
            <Fragment>
              <Message text={this.state.message.text} isError={this.state.message.isError} isSuccess={this.state.message.isSuccess}/>
              <form id="WithdrawForm">
                  <Grid container={true} justify="center" direction="column">
                    <Grid item={true} xs={12} >
                      <TextField id="note" name="note" label="Note" placeholder="Note" style={{minWidth: "400px", margin: "10px"}} />
                    </Grid>
                    <Grid item={true} xs={12} >
                      <TextField id="recipient" name="recipient" label="Recipient Address" placeholder="Recipient Address" style={{minWidth: "400px", margin: "10px"}} />
                    </Grid>
                    {
                      this.state.working?
                      <Grid item={true} xs={12} >
                        <Spinner />
                      </Grid>
                      :
                      <Grid item={true} xs={12} >
                        <Button variant="contained" type="submit" onClick={this.clickWithdraw} style={{margin:"15px"}}>
                           Withdraw 
                        </Button>
                      </Grid>
                    }
                  </Grid>
              </form>
            </Fragment>
            }
        </Grid>
      </Grid>
    );
  }
}

export default Withdraw;