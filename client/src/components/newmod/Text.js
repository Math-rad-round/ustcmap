import React , { Component }from "react";
import RealText from "./RealText.js";
import "./Text.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */
class Text extends Component{
  
  constructor(props){
    super(props);
    this.state = {
      on: 0,
      cl: 0
    };
  }
  
  componentDidMount() {
    document.addEventListener('mousedown', this.handleClick, false);
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClick, false);
  }
  handleClick = () => {
    if(this.state.cl==1)this.setState({cl:0})
    else if(this.state.on==1)this.setState({cl:1});
  };
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
          {this.state.on?(<div class="contain">{this.props.contain}</div>):""}</div>
          <div >
            {this.state.cl?(<RealText contain={this.props.rcon}/>):<div/>}
          </div>
      </div>
    );
  }
}

export default Text;
