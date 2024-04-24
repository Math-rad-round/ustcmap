import React , { Component }from "react";
import "./Map.css";
import { post,get } from "../../utilities.js";
class Path extends Component{
  constructor(props){
    super(props);
    this.state = {
        base:"",
      };
  };
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
    </div>
    );
  }
}



export default Path;
