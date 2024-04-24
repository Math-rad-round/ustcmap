import React , { Component }from "react";
import Text from "../newmod/Text.js";
import Load from "../newmod/Load.js";
import Textbox from "../newmod/Textbox.js";
import east from "./123.jpg";
import { get } from "../../utilities.js";
import "./Map.css";
class Map extends Component{
  constructor(props){
    super(props);
    this.state={
      begin:null,
      end:null,
      result:null
    }
  };
  handle(text){
    if(this.state.begin==null||this.state.end!=null){
      this.setState({begin:text,end:null,result:null});
    }else if(this.state.end==null){
      this.setState({end:text,result:null});
    }
  }
  search(e){
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
        
        <div >
             <img width={800} src={east} />
          <Text posx={540} posy={955} width={120} height={50} contain={"五教的说明"} click={this.handle} name={"五教"}
              rcon={"五教的详细的说明"}/>
          <Text posx={330} posy={845} width={110} height={70} contain={"一教的说明"} click={this.handle} name={"一教"}
          rcon={"1教的详细的说明"}/>
          <Text posx={450} posy={735} width={90} height={70} contain={"食堂的说明"} click={this.handle} name={"食堂"}
          rcon={"非常详细的说明"}/>
          <Text posx={630} posy={945} width={110} height={40} contain={"隧道的说明"} click={this.handle} name={"隧道"}
          rcon={"隧道的非常非常非常详细的说明"}/> 
        </div>
        <div>  
        {this.state.begin!=null?(<Textbox posx={1000} posy={200} width={100} height={40} contain={"起点"+this.state.begin}/>):null}
          {this.state.end!=null?(<Textbox posx={1000} posy={200} width={100} height={40} contain={"终点"+this.state.end}/>):null}
          {this.state.end!=null?(
            <div onClick={this.search.bind(this)}>
              <button>搜索</button>
            </div>  
          ):null}
          {this.state.result!=null?(
            <Link to={"/app/"+this.state.result+"/path"}>
              <button>跳转界面</button>
            </Link>
          ):null}
        </div>
    </div>
    );
  }
}



export default Map;
