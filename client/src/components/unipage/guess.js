import React , { Component }from "react";
import { get ,post} from "../../utilities.js";
import chat from "./chat.png";
import Clickmap from "../unimod/Clickmap";
const config1='100%';
const config2='65% 35%';
class Guess extends Component{
  constructor(props){
    super(props);
    this.state = {
        screen: false,
        target: null,
        x:null,
        y:null,
        ok:false,
      };
  };
  componentDidMount(){
    this.fetch();
  }
  fetch = () => {
    get("/guess/gen").then((res) => {
      this.setState({
        x:null,
        y:null,
        target: res,
        div:null,
        ok:false,
      });
      console.log("guess",res);
    });
  }
  
    
  sw_mode=()=>{
    this.setState({screen:!this.state.screen});
  }
  handle = (x,y) => {
    this.setState({x:x,y:y});
    console.log("x,y",x,y);
  };
  confirm = () => {
    const x=this.state.x;
    const y=this.state.y;
    const dx=x-this.state.target.posx,dy=y-this.state.target.posy;
    const div=Math.sqrt(dx*dx+dy*dy);
    post("/guess/pass",{nodeId:this.state.target.nodeId,div:div}).then((res) => 
        this.setState({target:res,ok:true,div:div})
    );
  };
  render(){
    console.log("target",this.state.target);
    if(this.state.target==null){
      return <div>Loading...</div>;
    }
    return (
      <div style={{
          display: 'grid',
          gridTemplateColumns: this.state.screen?config1:config2, 
          gap : '15px',
        }}>
          <div style={{
              display: 'grid',
              gridTemplateRow: "85% 15%", 
            }}>
            <div>
                <iframe 
                  width="100%"
                  height="500px"
                  src={`/guess/pano/index.html#${encodeURIComponent(JSON.stringify(this.state.target.nodeId))}`}
                  sandbox="allow-same-origin allow-scripts allow-popups"
                />
            </div>
            <div>
              <img src={chat} width="40px" height="40px" onClick={this.sw_mode}/>
              <button onClick={this.fetch}>换一题</button>
              <button onClick={this.confirm}>确认</button>
              {this.state.ok&&(<div>你的误差{this.state.div}</div>)}
              {this.state.ok&&this.state.target.meetnum!=0&&(<div>平均误差{this.state.target.div/this.state.target.meetnum}</div>)}
            </div>
        </div>
        <div>
            {!this.state.screen&&
             <Clickmap handle={this.handle} x={this.state.x} y={this.state.y} 
             xp={this.state.ok?this.state.target.posx:null} yp={this.state.ok?this.state.target.posy:null}/>}
       </div>
      </div>
    );
  }
}



export default Guess;



