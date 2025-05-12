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
  
  usepass=()=>{
    this.props.pass();
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
    if(this.state.on==1){
      console.log("going");
      this.usepass();
    }console.log(this.props.name+this.state.on);
  };
  goin=()=>{
    if(this.state.on!=1)this.setState({on:1});
  }
  goout=()=>{
    if(this.state.on!=0)this.setState({on:0});
  }
  render() {
    let bottom = this.props.posy + 'px';
    let left = this.props.posx + 'px';
    let width = this.props.width + 'px';
    let height = this.props.height + 'px';
    return (
      <div>
        <div class="five" onMouseOut={this.goout} onMouseEnter={this.goin} 
        style={{ bottom: bottom, left: left, width: width, height: height ,opacity: this.state.on?0.5:0}}>

          {this.state.on ? this.props.contain:""}
        </div>
        <div>
          {this.state.cl ? <RealText contain={this.props.rcon} /> : <div />}
        </div>
      </div>
    );
  }
}

export default Text;
