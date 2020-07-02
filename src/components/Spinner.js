import React from 'react';

class Spinner extends React.Component {
  
  render(){
    return (
        <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
    );
  }
}

export default Spinner;
