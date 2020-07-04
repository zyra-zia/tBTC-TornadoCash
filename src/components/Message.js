import React from 'react';
import MuiAlert from '@material-ui/lab/Alert';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

class Message extends React.Component {

    render(){
        let severity = this.props.isError ? "error" : "info";
        if(this.props.isSuccess === true){
            severity = "success";
        }
        const visible = this.props.text.length > 0 ? "visible" : "hidden";
        const classes = `${visible} ${severity}`;
        return (
            <Alert className = {classes} severity={severity} style={{maxWidth: "400px"}}>
                {this.props.text}
            </Alert>
        );
    }
}

export default Message;
