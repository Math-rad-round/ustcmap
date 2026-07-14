import React , { Component }from "react";
import hello from "./wind.mp3";
import heart from "./water.mp3";

import env from "./env.png";
import map from "./map.png";
import "./Choose.css";
import process from "process";
import env2 from "./env2.png";
import chat from "./chat.png";
import "./Room.css";
import music from "./music.png";
import music2 from "./music2.png";
import Chatmod from "../unimod/Chatmod";
import { get ,post} from "../../utilities.js";
const config1='9% 1fr 20px';
const config2='9% 40% 50%';
class Room extends Component{
  constructor(props){
    super(props);
    this.audioenv= React.createRef();
    this.audiomusic = React.createRef();
    this.state = {
        isplayenv : false,
        isplaymusic : false,
        screen: true,
        pos:null,
        id: Math.floor(Math.random()*1000000000),
        nodeId:null,
        ans:false,
        me:null,
      };
  };
  componentDidMount(){
    post("/api/whoami",{}).then((res)=>
      this.setState({me:res})
    )
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
          ans:false,
        });
      });
    }else{
        this.setState({screen:true,ans:false});
      }
  }
  sw_map=()=>{
    console.log("sw_map");
    if(!this.state.ans){
      get("/askvr/pos", {id: this.state.id}).then((res) => {
        this.setState({
          nodeId: res.content, 
          screen:true,
          ans:true,
        });
      });
    }else{
        this.setState({screen:true,ans:false});
      }
  }
  close=()=>{
    console.log("close");
    this.setState({screen:true,nodeId:null});
  }
  render(){
    const roomId =this.props.pos;
    return (
      <div style={{
          display: 'grid',
          gridTemplateColumns:( this.state.screen&&(!this.state.ans))?config1:config2, // iframe占剩余空间，右侧固定100px
          gap: '10px',
        }}>
        <div className="rowclick">
          <audio src={hello} ref= {this.audioenv} loop/>
          <audio src={heart} ref= {this.audiomusic} loop/>
          {this.state.isplayenv?
            (<img className="clickimg" src={env}  onClick={this.env_off}/>):
            (<img className="clickimg" src={env2} onClick={this.env_on}/>)}
          {this.state.isplaymusic?
            (<img className="clickimg" src={music} onClick={this.mus_off}/>):
            (<img className="clickimg" src={music2} onClick={this.mus_on}/>)}
          {(this.props.pos=="game")&&<img className="clickimg" src={map}  onClick={this.sw_map}/>}
          <img className="clickimg" src={chat}  onClick={this.sw_chat}/>
        </div>
        <div onClick={this.close}>
        <iframe type="text/babel" src={"/askvr/"+String(this.state.id)+'/'+this.props.pos+"/index.html"}  width="100%" height="550" allow="fullscreen" onClick={this.close}/>
        </div>
        <div>
            {!this.state.screen&&<Chatmod roomId={"r_"+roomId+"_"+this.state.nodeId} title={roomId+this.state.nodeId+"留言交流板"}number={5}/>}
            {this.state.ans&&<Chatmod roomId={"Ans_"+roomId+"_"+this.state.nodeId} stop={this.state.me==undefined||this.state.me.type!="高级用户"} title={this.state.nodeId+"攻略"}number={5}/>}            
       </div>
      </div>
    );
  }
}



export default Room;



