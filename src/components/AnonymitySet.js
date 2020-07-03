import React from 'react';
import moment from 'moment';

class AnonymitySet extends React.Component {

    constructor(props) {
        super(props);
        
        this.state = {
            events: []
        };
    }

    componentDidMount(){
        this.updateDepositEvents();
    }

    async componentDidUpdate(prevProps, prevState, snapshot){
        if(prevProps.denomination !== this.props.denomination){
            this.updateDepositEvents();
        }
    }

    updateDepositEvents(){
        this.props.currentContract.getPastEvents('Deposit', {
            filter: {},
            fromBlock: 0,
            toBlock: 'latest'
        })
        .then((events) => {
            this.setState({
                events: events
            });
        });
    }

    render(){

        if(this.state.events === undefined){
            return null;
        }

        const recentEvents = this.state.events.reverse().slice(0,5).map((event, index) =>
            <li key={index}>{index+1}. {moment.unix(event.returnValues.timestamp).fromNow()}</li>
        );
        
        return (
            <div>
                <h3>Anonymity Set for ({this.props.denomination}) tBtc</h3>
                <p>{this.state.events.length} equal user deposits</p>
                <h4>Latest Deposits</h4>
                <ul>{recentEvents}</ul>
            </div>
        );
    }
}

export default AnonymitySet;