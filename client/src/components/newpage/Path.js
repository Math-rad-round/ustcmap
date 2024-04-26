import React , { Component }from "react";
import Textbox from "../newmod/Textbox.js";
import "./Map.css";
import { post,get } from "../../utilities.js";
class Path extends Component{
  constructor(props){
    super(props);
    this.state = {
        base:"",
      };
  };
  jump=()=>{
    console.log("jump,ye2!!");
    let e=window.location.href;
    e=e.slice(0,-5);
    window.location.href=e;
  }
  componentDidMount(){
    get("/api/getphoto", {_id: this.props.appId})
    .then((thing) => {
      console.log(thing);
      this.setState({base:thing.str});
    })
    
  }
  render(){
    console.log("kkkk3");
    return (
      <div>
        {this.state.base?(
             <img width={800} src={this.state.base} alt=""/>):(<div>正在搜索</div>)}
             {this.state.base?<Textbox posx={1000} posy={200} width={100} height={50} pass={this.jump} contain={"返回路线界面"}/>:<div/>}
    </div>
    );
  }
}



export default Path;
