import React , { Component }from "react";
import Textbox  from "../newmod/Textbox.js"
import Text from "../newmod/Text.js";
import east from "./123.jpg";
import "./Map.css";
class Map extends Component{
  constructor(props){
    super(props);
    this.state={
      lasttime:0,
      begin:null,
      end:null,
      result:null
    }
    this.handle= this.handle.bind(this);
  };
  handle=(text)=>{
    let time=+new Date().getTime();
    if(time-this.state.lasttime<=500)return;
    if(text==null||text==undefined)text="????";
    console.log("handleing"+text);
    if(this.state.begin==null||this.state.end!=null){
      this.setState({begin:text,end:null,result:null});
    }else if(this.state.end==null){
      this.setState({end:text,result:null});
    }
    console.log(this.state.begin);
    console.log(this.state.end);
    lasttime=time;
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
          <Text posx={540} posy={955} width={120} height={50} contain={"五教的说明"}
              rcon={"五教的详细的说明"}/>
          <Text posx={330} posy={845} width={110} height={70} contain={"一教的说明"}
          rcon={"1教的详细的说明"}/>
          <Text posx={450} posy={735} width={90} height={70} contain={"食堂的说明"}
          rcon={"非常详细的说明"}/>
          <Text posx={630} posy={945} width={110} height={40} contain={"隧道的说明"}
          rcon={"隧道的非常非常非常详细的说明"}/>  
           {/* <Load contain={"11111111"}/> 
          <div>1231323</div> */}
        </div>
        <div>  
        {this.state.begin!=null?(<Textbox contain={"起点"+this.state.begin}/>):<div/>}
          {this.state.end!=null?(<Textbox contain={"终点"+this.state.end}/>):<div/>}
          {/* {this.state.end!=null?(
            <div onClick={this.search.bind(this)}>
              <button>搜索</button>
            </div>  
          ):null}
          {this.state.result!=null?(
            <Link to={"/app/"+this.state.result+"/path"}>
              <button>跳转界面</button>
            </Link>
          ):null} */}
        </div>
    </div>
    );
  }
}



export default Map;
