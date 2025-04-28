import React , { Component }from "react";
import hello from "./hello.mp3";
import heart from "./heart.ogg";
import env from "./env.png";
import env2 from "./env2.png";
import music from "./music.png";
import music2 from "./music2.png";
class Room extends Component{
  constructor(props){
    super(props);
    this.audioref= React.createRef();
    this.audioref2 = React.createRef();
    this.state = {
        isplayenv : true,
        isplaymusic : false,
      };
  };
  env_on=()=>{
    console.log("env_on");
    this.audioref.current.play();
    this.setState({isplayenv:true});
  }
  env_off=()=>{
    console.log("env_off");
    this.audioref.current.pause();
    this.setState({isplayenv:false});
  }
  mus_on=()=>{
    console.log("mus_on");
    this.audioref2.current.play();
    this.setState({isplaymusic:true});
  }
  mus_off=()=>{
    console.log("mus_off");
    this.audioref2.current.pause();
    this.setState({isplaymusic:false});
  }
  render(){
    console.log("start audio rende2233r");
    return (
      <div>
        <audio src={hello} ref= {this.audioref} loop/>
        <audio src={heart} ref= {this.audioref2} loop/>
        {this.state.isplayenv?
        (<img src={env} width={100} height={100} onClick={this.env_off}/>):
        (<img src={env2}width={100} height={100} onClick={this.env_on}/>)}
        {this.state.isplaymusic?
        (<img src={music}width={100} height={100} onClick={this.mus_off}/>):
        (<img src={music2}width={100} height={100} onClick={this.mus_on}/>)}
      </div>
    );
  }
}



export default Room;
