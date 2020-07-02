import React from 'react';

class Message extends React.Component {
  
    componentDidMount(){
        this.visiblityClass = "visible";
        setTimeout(()=>{
            this.visiblityClass = "hidden";
        }, 5000);
    }

  render(){
    return (
        <div id="message" className = {this.visiblityClass + " " + this.props.isError ? "error" : "" }>
            <p>{this.props.text}</p>
        </div>
    );
  }
}

export default Message;
