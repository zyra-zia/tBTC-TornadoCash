import React from 'react';
import {bigInt as snarkBigInt} from 'snarkjs';
import tUtils from '../TornadoUtils';
import MerkleTree from '../lib/MerkleTree';
import buildGroth16 from 'websnark/src/groth16';
import websnarkUtils from 'websnark/src/utils';
import Spinner from "./Spinner";

class Withdraw extends React.Component {
  constructor(props) {
    super(props);
    this.clickWithdraw = this.clickWithdraw.bind(this);
    this.state = {
        loading: true,
        working: false
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

  async withdraw(note, recipient) {
    const deposit = this.parseNote(note);
    this.denomination = this.parseAmount(note);
    const { proof, args } = await this.generateSnarkProof(deposit, recipient);
    this.props.setMessage('Sending withdrawal transaction...');
    try{
      const tx = await this.props.tornadoContract(this.denomination).methods.withdraw(proof, ...args).send({ from: this.props.defaultAccount, gas: 1e6 });
      console.log(`https://ropsten.etherscan.io/tx/${tx.transactionHash}`);
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
    console.log('Getting contract state...');
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
  
    this.props.setMessage('Generating SNARK proof...');
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
      this.props.setMessage("Invalid Note", true);
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
      this.props.setMessage("Invalid recipient address", true);
    }
  }

  async clickWithdraw(event){
    event.preventDefault();
    const note = document.getElementById("note").value;
    const address = document.getElementById("recipient").value;
    if(!this.isValidNote(note) || !this.isValidAddress(address)){
      return;
    }

    this.setState({
      working: true
    });
    
    const status = await this.withdraw(note, address);
    if(status === true){
      this.props.setMessage("Successfull withdrawal to " + address);
    }
    else {
      this.props.setMessage("Invalid Note or The note has already been spent", true);
    }
    this.setState({
      working: false
    });
  }

  render(){
    return (
        <section>
            {this.state.loading?
            <Spinner />
            :
            <form id="WithdrawForm">
                <h2>Withdraw TBTC</h2>
                <input type="text" placeholder="Note" name="note" id="note"/>
                <input type="text" placeholder="Recipient Address" name="recipient" id="recipient"/>
                {this.state.working?
                <Spinner />
                :
                <button type="submit" onClick={this.clickWithdraw} >Withdraw</button>
                }
            </form>
            }
        </section>
    );
  }
}

export default Withdraw;