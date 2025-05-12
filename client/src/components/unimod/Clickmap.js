import React , { Component }from "react";
import "./Clickmap.css";
import east from "./123.jpg";
class Clickmap extends Component{
  constructor(props){
    super(props);
    this.state = {
      };
  };

  handleClick = (event) => {
    const img = event.target;
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left; 
    const y = event.clientY - rect.top; 
    const xP = x / rect.width*100;
    const yP = y / rect.height*100;
    console.log("pass",xP,yP);
    this.props.handle(xP,yP);
  };
  render(){
    console.log("render",this.props.x,this.props.xp);
    return (
        <div style={{position:"relative",width:"100%",height:"100%"}}>
            {this.props.xp!=null&&(<div style={{position:"absolute",transform: 'translate(-50%, -50%)',left:this.props.xp+"%",top:this.props.yp+"%"}}><div className="green"/></div>)}
            {this.props.x !=null&&(<div style={{position:"absolute",transform: 'translate(-50%, -50%)',left:this.props.x +"%",top:this.props.y +"%"}}><div className="red"/></div>)}
            <img width="100%" height="100%" src={east} style={{display:'block'}} onClick={this.handleClick}></img>
       </div>
    );
  }
}


export default Clickmap;



