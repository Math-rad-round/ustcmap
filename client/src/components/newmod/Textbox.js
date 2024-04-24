import React , { Component }from "react";

import "./Textbox.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */
class Textbox extends Component{
  constructor(props){
    super(props);
  }
  
  render(){
    let bottom=this.props.posy+'px';
    let left=this.props.posx+'px';
    let width=this.props.width+'px';
    let height=this.props.height+'px';
    return (
      <div >
          <div class="five" 
          style={{bottom,left,width,height}} >
          {this.state.on?(<div class="contain">{this.props.contain}</div>):""}</div>
      </div>
    );
  }
}

export default Textbox;
