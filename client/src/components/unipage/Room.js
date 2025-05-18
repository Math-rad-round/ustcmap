import React , { Component }from "react";
import hello from "./hello.mp3";
import heart from "./heart.ogg";

import env from "./env.png";
import process from "process";
import env2 from "./env2.png";
import chat from "./chat.png";
import "./Room.css";
import music from "./music.png";
import music2 from "./music2.png";
import Chatmod from "../unimod/Chatmod";
import { get ,post} from "../../utilities.js";
const config1='100px 1fr 100px';
const config2='10% 40% 50%';
class Room extends Component{
  constructor(props){
    super(props);
    this.audioenv= React.createRef();
    this.audiomusic = React.createRef();
    this.state = {
        isplayenv : true,
        isplaymusic : false,
        screen: true,
        pos:null,
        id: Math.floor(Math.random()*1000000000),
        nodeId:null,
      };
  };
  componentDidMount(){
   // post("/askvr/del",{});
    console.log("start audio componentDidMount");
    this.audioenv.current.play();
  }
  env_on=()=>{
    console.log("env_on");
    this.audioenv.current.play();
    this.setState({isplayenv:true});
  }
  env_off=()=>{
    console.log("env_off");
    this.audioenv.current.pause();
    this.setState({isplayenv:false});
  }
  mus_on=()=>{
    console.log("mus_on");
    this.audiomusic.current.play();
    this.setState({isplaymusic:true});
  }
  mus_off=()=>{
    console.log("mus_off");
    this.audiomusic.current.pause();
    this.setState({isplaymusic:false});
  }
  sw_chat=()=>{
    console.log("sw_chat");
    if(this.state.screen){
      get("/askvr/pos", {id: this.state.id}).then((res) => {
        this.setState({
          nodeId: res.content,
          screen:false,
        });
      });
    }else{
        this.setState({screen:true});
      }
  }
  close=()=>{
    console.log("close");
    this.setState({screen:true,nodeId:null});
  }
  render(){
    const roomId =this.props.place!=undefined?this.props.place:this.props.pos;
    const dealplace=this.props.place!=undefined?("#"+this.props.place):"";
    return (
      <div style={{
          display: 'grid',
          gridTemplateColumns: this.state.screen?config1:config2, // iframe占剩余空间，右侧固定100px
          gap: '10px',
        }}>
        <div>
          <audio src={hello} ref= {this.audioenv} loop/>
          <audio src={heart} ref= {this.audiomusic} loop/>
          {this.state.isplayenv?
          (<img src={env} width={100} height={100} onClick={this.env_off}/>):
          (<img src={env2}width={100} height={100} onClick={this.env_on}/>)}
          {this.state.isplaymusic?
          (<img src={music}width={100} height={100} onClick={this.mus_off}/>):
          (<img src={music2}width={100} height={100} onClick={this.mus_on}/>)}
          
          <img src={chat} width={100} height={100} onClick={this.sw_chat}/>
        </div>
        <div onClick={this.close}>
        <iframe type="text/babel" src={"/askvr/"+String(this.state.id)+'/'+this.props.pos+"/index.html"+dealplace}  width="100%" height="550" allow="fullscreen" onClick={this.close}/>
        </div>
        <div>
            {this.state.screen?<div/>:<Chatmod roomId={"r_"+roomId+"_"+this.state.nodeId} title={roomId+(this.props.place!=undefined?"":this.state.nodeId)+"留言交流板"}number={5}/>}
            </div>
       </div>
      
    );
  }
}



export default Room;



