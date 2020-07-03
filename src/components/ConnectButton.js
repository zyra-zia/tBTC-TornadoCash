import React from 'react';

class ConnectButton extends React.Component {

    constructor(props) {
        super(props);
        this.connect = this.connect.bind(this);
        this.state = {
            connected: false
        };
    }

    async connect(){
        if(this.state.connected){
            return;
        }

        if (window.ethereum) {
            await window.ethereum.enable();
            this.setState({
                connected: true
            });
            this.props.walletConnected();
        }
        else {
            this.props.setMessage("Please install an Ethereum-compatible browser or extension like MetaMask to use this dApp");
        }
    }

    render(){

        return (
            <button onClick={this.connect} className={this.state.connected?"connected":"unconnected"}>
                {this.state.connected?"Connected":"Connect to a Wallet"}
            </button>
        );
    }
}

export default ConnectButton;