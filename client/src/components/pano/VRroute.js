import React , { Component }from "react";
import process from "process";
class VRroute extends Component{
  constructor(props){
    super(props);
    this.state={
    }
  };
  render() {
    console.log(process.env.PUBLIC_URL);
    console.log(process.env.PUBLIC_URL +"/pano/index.html");
    console.log("finish");
    return (
      <div>
        <iframe type="text/babel" src={process.env.PUBLIC_URL +"/pano/index.html"} width="100%" height="550" allow="fullscreen"></iframe>
      </div>
    );
  }
}



export default VRroute;

