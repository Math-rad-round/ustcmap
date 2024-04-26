import React , { Component }from "react";

import "./RealText.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */
class RealText extends Component{
  constructor(props){
    super(props);
    this.state = {
    };
  }
  
  render(){
  //  let con="bottom:"+posy+";left:"+posx+";width:"+width+";height:"+height;
    return (
      <div >
          <div class="fix"
          // style={{bottom,width,height}}
           >

          {this.props.contain}</div>
      </div>
    );
  }
}

export default RealText;
