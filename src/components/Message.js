import React from 'react';

class Message extends React.Component {

    constructor(props) {
        super(props);
        this.visible = false;
    }
  
    componentDidUpdate(){
       this.visible = true;
       setTimeout(()=>{
           this.visible = false;
           this.forceUpdate();
       }, 10000);
    }

    componentDidMount(){
        this.visible = true;
    }

    render(){
        const error = this.props.isError ? "error" : "";
        const visible = this.visible ? "visible" : "hidden";
        const classes = `${visible} ${error}`;
        return (
            <div id="message" className = {classes}>
                <p>{this.props.text}</p>
            </div>
        );
    }
}

export default Message;
