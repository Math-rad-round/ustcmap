import React , { Component }from "react";
import Textbox from "../newmod/Textbox.js";
import "./Map.css";
import east from "./123.jpg";
import { post,get } from "../../utilities.js";
class Path extends Component{
  constructor(props){
    super(props);
    this.state = {
        base:"",
        base2:"",
      };
  };
  jump=()=>{
    console.log("jump,ye2!!");
    let e=window.location.href;
    e=e.slice(0,-5);
    window.location.href=e;
  }
  componentDidMount(){
    get("/api/getphoto", {_id: this.props.appId,type:0})
    .then((thing) => {
      console.log(thing);
      this.setState({base:thing.str});
    });
    get("/api/getphoto", {_id: this.props.appId,type:1})
    .then((thing) => {
      console.log(thing);
      this.setState({base2:thing.str});
    });
  }
  render(){
    console.log("kkkk3");
    return (
      <div>
        {this.state.base?
              (<div>
             <img className="doubb" width={800} src={this.state.base} alt=""/>
             <img className="douba" width={800} src={east} />
             </div>)
             :(<div>正在搜索</div>)}
             {this.state.base?
              (<div>
             <img className="doubc" width={400} src={this.state.base2} alt=""/>
             </div>)
             :(<div></div>)}
             {this.state.base?<Textbox posx={1000} posy={200} width={100} height={50} pass={this.jump} contain={"返回路线界面"}/>:<div/>}
    </div>
    );
  }
}



export default Path;
