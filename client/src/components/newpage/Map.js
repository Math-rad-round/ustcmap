import React , { Component }from "react";
import Textbox  from "../newmod/Textbox.js"
import Text from "../newmod/Text.js";
import east from "./123.jpg";
import { Link } from "react-router-dom";
import { post,get } from "../../utilities.js";
import "./Map.css";
class Map extends Component{
  constructor(props){
    super(props);
    this.state={
      
      begin:null,
      end:null,
      result:null
    }
    this.handle= this.handle.bind(this);
    this.jump= this.jump.bind(this);
    this.search= this.search.bind(this);
    this.flymap= this.flymap.bind(this);
  };
  jump=()=>{
    console.log("jump,ye!!");
    let e=window.location.href;
    e=e.slice(0,-3);
    e+="app/"+this.state.result+"/path";
    window.location.href=e;
  }
  flymap=(text)=>{
    console.log("fly,ye!!"+text);
    let e=window.location.href;
    e+="/bus";
    window.location.href=e;
  }
  handle=(text)=>{
    if(text==null||text==undefined)text="????";
    console.log("handleing"+text);
    if(this.state.begin==null||this.state.end!=null){
      this.setState({begin:text,end:null,result:null});
    }else if(this.state.end==null){
      this.setState({end:text,result:null});
    }
    console.log(this.state.begin);
    console.log(this.state.end);
  }
  search=()=>{
    console.log("begin");
    let k=this.state.begin+"->"+this.state.end;
    get("/api/search2", {realname:k})
    .then((thing) => {
      console.log(thing.project._id);
      this.setState({result:thing.project._id});
    })
  }
  render(){
    console.log("kkkk3");
    return (
      <div>
        
        <div className="link">
             <img width={800} src={east} />
          <Text posx={250} posy={825} width={60} height={80} contain={"巴士站牌"} name={"站台"} pass={this.flymap}
              rcon={"巴士站牌的详细的说明"}/>
          <Text posx={540} posy={1035} width={120} height={50} contain={"第五教学楼"} name={"五教"} pass={this.handle}
              rcon={"五教的详细的说明"}/>
          <Text posx={330} posy={925} width={110} height={70} contain={"第一教学楼"} name={"一教"} pass={this.handle}
          rcon={"1教的详细的说明"}/>
          <Text posx={450} posy={815} width={90} height={70} contain={"食堂"} name={"食堂"} pass={this.handle}
          rcon={"非常详细的说明"}/>
          <Text posx={130} posy={1025} width={110} height={40} contain={"隧道"} name={"隧道"} pass={this.handle}
          rcon={"隧道的非常非常非常详细的说明"}/>
        {this.state.begin!=null?(<Textbox posx={1000} posy={50} width={90} height={70} contain={"起点 "+this.state.begin}/>):<div/>}
          {this.state.end!=null?(<Textbox posx={1120} posy={50} width={90} height={70} contain={"终点 "+this.state.end}/>):<div/>}
           {this.state.end!=null?(<Textbox posx={1240} posy={50} width={90} height={70} pass={this.search} contain={"搜索"}/>):<div/>}
          {this.state.result!=null?(<Textbox posx={1000} posy={20} width={200} height={40} pass={this.jump} contain={"跳转"}/>):<div/>} 
        </div>
    </div>
    );
  }
}



export default Map;
