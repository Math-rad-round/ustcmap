import React , { Component }from "react";
import process from "process";
class VRguide extends Component{
  constructor(props){
    super(props);
    this.state={
    }
  };
  render() {
    const roomId =this.props.place;
    return (
      <div>
        <iframe type="text/babel" src={"/askroom/pano/index.html#"+roomId}  width="100%" height="550" allow="fullscreen"/>
      </div>
    );
  }
}



export default VRguide;

