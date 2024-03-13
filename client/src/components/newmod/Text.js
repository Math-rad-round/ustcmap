import React , { Component }from "react";

import "./Text.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */
class Text extends Component{
  constructor(props){
    super(props);
    this.state = {
      on: 0
    };
  }
  goin=()=>{
    if(this.state.on!=1)this.setState({on:1});
  }
  goout=()=>{
    if(this.state.on!=0)this.setState({on:0});
  }
  render(){
    let bottom=this.props.posy+'px';
    let left=this.props.posx+'px';
    let width=this.props.width+'px';
    let height=this.props.height+'px';
  //  let con="bottom:"+posy+";left:"+posx+";width:"+width+";height:"+height;
    return (
      <div >
          <div class="five" onMouseOut={this.goout} onMouseOver={this.goin} 
          style={{bottom,left,width,height}} >

          {this.state.on?this.props.contain:""}</div>
      </div>
    );
  }
}

export default Text;
