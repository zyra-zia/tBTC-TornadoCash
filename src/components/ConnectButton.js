import React from 'react';
import Fab from '@material-ui/core/Fab';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';

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
        const styles = {
            padding: '20px',
            margin: '20px auto',
            width: "fit-content"
        };

        const iconStyles = {
            marginRight: '10px'
        };
        return (
            <Fab 
                color = "secondary"
                onClick={this.connect} 
                className={this.state.connected?"connected":"unconnected"}
                aria-label = "connect"
                variant="extended"
                style = {styles}
            >
                <PowerSettingsNewIcon style={iconStyles} />
                {this.state.connected?"Connected":"Connect to a Wallet"}
            </Fab>
        );
    }
}

export default ConnectButton;