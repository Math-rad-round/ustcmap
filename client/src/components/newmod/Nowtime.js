import React , { Component }from "react";
import Textbox from "./Textbox.js";
import "./Text.css";

/**
 * The navigation bar at the top of all pages. Takes no props.
 */

let dong=[445,560,575,695,740,810,930,950,1050,1070,1120,1210,1275,1330,1885];
let djie=[445,695,810,1050,1120,1275,1885];
let gao=[410,480,770,870,1070,1280,1325,1850];
let gjie=[420,770,1070,1310,1860];
class Nowtime extends Component{
  constructor(props){
    super(props);
    this.state = {
        d:null
    };
  }
  componentDidMount() {
    this.setState({d:0});
    setInterval(()=>this.setState({d:1}),1000);
  }
  render() {
    let day=new Date();
    var s = day.getHours()
    var f = day.getMinutes()
    var x = day.getSeconds()
    let p=s + '时' + f + '分' + x + '秒';
    var week = ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    var w = week[day.getDay()];
    let out="今天是" +w+p;
    let bool=(day.getDay()%6==0);
    let min=s*60+f;
    let tim=0,tim2=0;
    if(bool){
        for(let i=0;i<djie.length;i++){
            if(djie[i]>min){
                tim=djie[i];break;
            }
        }
        for(let i=0;i<gjie.length;i++){
            if(gjie[i]>min){
                tim2=gjie[i];break;
            }
        }
    }else{
        for(let i=0;i<dong.length;i++){
            if(dong[i]>min){
                tim=dong[i];break;
            }
        }
        for(let i=0;i<gao.length;i++){
            if(gao[i]>min){
                tim2=gao[i];break;
            }
        }
    }
    let dongtext="到西区下一班车在"+String(Math.floor(tim/60)%24)+"时"+String(tim%60)+"分，还有"+String(tim-min)+"分钟发车";    
    let gaotext="到高新区下一班车在"+String(Math.floor(tim2/60)%24)+"时"+String(tim2%60)+"分，还有"+String(tim2-min)+"分钟发车";

    return (
      <div>
        <Textbox posx={this.props.posx} posy={this.props.posy} width={this.props.width} height={this.props.height} contain={out}/>
        <Textbox posx={this.props.posx} posy={this.props.posy-150} width={this.props.width} height={this.props.height} contain={dongtext+"\n"+gaotext}/>

      </div>
    );
  }
}

export default Nowtime;
