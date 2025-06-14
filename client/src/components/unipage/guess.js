import React , { Component }from "react";
import { get ,post} from "../../utilities.js";
import chat from "./chat.png";
import Chatmod from "../unimod/Chatmod.js";
import map from "./map.png";
import Clickmap from "../unimod/Clickmap";
import "./Choose.css";
class Guess extends Component{
  constructor(props){
    super(props);
    this.state = {
        screen: false,
        target: null,
        x:null,
        y:null,
        degree:this.getrand(0,360),
        chat:false,
        ok:false,
      };
      
    this.clickmapRef = React.createRef();
  };
  componentDidMount(){
    this.fetch();
  }
  reset = () => {
    if (this.clickmapRef.current) {
      this.clickmapRef.current.reset();
    }
  };
  fetch = () => {
    this.reset();  
    get("/guess/gen").then((res) => {
      this.setState({
        x:null,
        y:null,
        target: res,
        div:null,
        
        degree:this.getrand(0,360),
        ok:false,
        chat:false,
      });
      console.log("guess",res);
    });
  }
  
  getrand=(min,max)=>{
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  sw_mode=()=>{
    this.setState({screen:!this.state.screen});
  }
  sw_chat=()=>{
    this.setState({chat:!this.state.chat});
  }
  handle = (x,y) => {
    this.setState({x:x,y:y});
    console.log("x,y",x,y);
  };
  confirm = () => {
    if(this.state.x==null||this.state.y==null){
      alert("请点击地图");
      return;
    }
    const x=this.state.x;
    const y=this.state.y;
    const dx=x-this.state.target.posx,dy=y-this.state.target.posy;
    const div=Math.sqrt(dx*dx+dy*dy)*1.202;//比例尺，米/像素
    post("/guess/pass",{nodeId:this.state.target.nodeId,div:div}).then((res) => 
        this.setState({target:res.guess,ok:true,div:div})
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
          gridTemplateColumns: this.state.screen?(this.state.chat?'65% 35%':'100%'):(this.state.chat?'35% 35% 30%':'55% 45%'),
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
                  src={'/guess/guess/index.html#'+this.state.target.nodeId+","+this.state.degree+',10.0,70.0,9'}
                  sandbox="allow-same-origin allow-scripts allow-popups"
                />
            </div>
            <div>
              <img src={map} className="clickimgs" onClick={this.sw_mode}/>
              {this.state.ok&&<img src={chat} className="clickimgs" onClick={this.sw_chat}/>}
              <button onClick={this.fetch}>换一题</button>
              <button onClick={this.confirm}>确认</button>
              {this.state.ok&&(<div>你的误差{this.state.div}米</div>)}
              {this.state.ok&&this.state.target.meetnum!=0&&(<div>平均误差{this.state.target.div/this.state.target.meetnum}</div>)}
            </div>
        </div>
         <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            {!this.state.screen&&
             <Clickmap handle={this.handle}  ref={this.clickmapRef}
             initialX={this.state.ok?this.state.target.posx:undefined} initialY={this.state.ok?this.state.target.posy:undefined} />}
       </div>
       <div>
            {this.state.chat&&
            <Chatmod roomId={this.state.target.nodeId} title={this.state.target.nodeId+"交流板"}number={5}/>}
       </div>
      </div>
    );
  }
}



export default Guess;



