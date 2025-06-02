import React , { Component }from "react";
import hello from "./hello.mp3";
import heart from "./heart.ogg";
import Tomato from "../unimod/Tomato.js";
import env from "./env.png";
import tomato from "./tomato.png";
import env2 from "./env2.png";
import chat from "./chat.png";
import ustc from "./ustc.png";

import { post } from '../../utilities.js';
import "./Room.css";
import "./Choose.css"
import music from "./music.png";
import music2 from "./music2.png";
import Chatmod from "../unimod/Chatmod";
const config1='100px 1fr 100px';
const config2='8% 47% 45%';

class Room extends Component{
  constructor(props){
    super(props);
    this.audioenv= React.createRef();
    this.audiomusic = React.createRef();
    this.state = {
        isplayenv : true,
        isplaymusic : false,
        pos:null,
        nodeId:null,
        chat: false,
        tomato:false,
        timeSpent: 0, // 新增状态
      };
    this.intervalId = null; // 新增定时器ID
  };
  
  componentDidMount(){
    console.log("start audio componentDidMount");
    this.audioenv.current.play();
    
    // 新增：设置定时器每秒更新停留时间
    this.intervalId = setInterval(() => {
      this.setState(prevState => ({
        timeSpent: prevState.timeSpent + 1
      }));
    }, 1000);
  }
  
  componentWillUnmount() {
    // 新增：组件卸载时清除定时器并发送数据
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.sendTimeDataToServer(this.state.timeSpent);
    }
  }
  
  sendTimeDataToServer = (time) => {
    post("/askroom/addtime",{time:time,roomId:this.props.place}).catch(error => {
      console.error('Error sending time data:', error);
    });
  };

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
    this.setState({chat:!this.state.chat,tomato:false});
  }
  
  sw_tomato=()=>{
    this.setState({chat:false,tomato:!this.state.tomato});
  }
  
  jumpout=(url)=>{
    window.open(url,"blank");
  }
  
  render(){
    const roomId =this.props.place;
    return (
      <div style={{
          display: 'grid',
          gridTemplateColumns: (this.state.chat||this.state.tomato)?config2:config1, // iframe占剩余空间，右侧固定100px
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
          
          <img className="clickimg" src={chat}  onClick={this.sw_chat}/>
          <img className="clickimg" src={tomato}  onClick={this.sw_tomato}/>
          <a href="https://wdkd.feixu.site/" target="_blank" rel="noopener noreferrer">
            <img className="clickimg" src={ustc}   />
          </a>
        </div>
        <div onClick={this.close}>
        <iframe type="text/babel" src={"/askroom/room/index.html#"+roomId}  width="100%" height="550" allow="fullchat"/>
        </div>
        <div>
            {this.state.tomato&&<Tomato studyDuration={50} breakDuration={10} />}
            {this.state.chat&&<Chatmod roomId={"s_"+roomId+"_"+this.state.nodeId} title={roomId+"留言交流板"}number={5}/>}
        </div>
       </div>
    );
  }
}

export default Room;