import React, { Fragment } from 'react';
import moment from 'moment';
import {Card, Divider, List, ListItem, Typography} from '@material-ui/core';

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
            <Fragment key={"f"+index}>
                <ListItem key={index}>
                    {index+1}. {moment.unix(event.returnValues.timestamp).fromNow()}
                </ListItem>
                <Divider key={"d"+index}/>
            </Fragment>
        );
        
        return (
            <Card style={{maxWidth: "400px"}}>
                <Typography variant="h6" align="center">
                    Anonymity Set for ({this.props.denomination}) tBtc
                </Typography>
                <Typography variant="body1" align="center">
                    {this.state.events.length} equal user deposits
                </Typography>

                {
                    recentEvents.length > 0 &&
                    <Fragment>
                        <Typography variant="body2" align="center">
                            Latest Deposits
                        </Typography>
                        <List component="ul" style={{fontSize: "0.9rem"}}>
                            {recentEvents}
                        </List>
                    </Fragment>
                }
            </Card>
        );
    }
}

export default AnonymitySet;