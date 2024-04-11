import React , { Component }from "react";

import "./UpText.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */
class UpText extends Component{
  constructor(props){
    super(props);
    this.state = {
      on: 0,
      cl: 0
    };
  }
  goin=()=>{
    if(this.state.on!=1)this.setState({on:1});
  }
  goclick=()=>{
    if(this.state.cl==1)this.setState({cl:0});
    else if(this.state.on==1)this.setState({cl:1});
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
          <div class="fix" onMouseOut={this.goout} onMouseOver={this.goin}  onClick={this.goclick}
          style={{bottom,left,width,height}} >

          {this.state.on?(this.state.cl?this.props.contain:"1111"):""}</div>
      </div>
    );
  }
}

export default UpText;
