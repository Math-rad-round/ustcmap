import React , { Component }from "react";

import "./Textbox.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */
class Textbox extends Component{
  constructor(props){
    super(props);
  }
  usepass=()=>{
    console.log("clickingme");
    if(this.props.pass!=undefined)this.props.pass();
  }
  render(){
    let bottom=this.props.posy+'px';
    let left=this.props.posx+'px';
    let width=this.props.width+'px';
    let height=this.props.height+'px';
    return (
      <div >
          <div className="five2"
        style={{ bottom: bottom, left: left, width: width, height: height}} onClick={()=>this.usepass()}>
          {this.props.contain}</div>
      </div>
    );
  }
}

export default Textbox;
