import React , { Component }from "react";
import busj from "./bus.png";
import { Link } from "react-router-dom";
import { post,get } from "../../utilities.js";
import Nowtime from "../newmod/Nowtime.js"
import "./Busmap.css";
class Busmap extends Component{
  constructor(props){
    super(props);
    this.state={
    }
  };
  render(){
    console.log("mymap");
    return (
      <div>
        <div >
             <img width={800} src={busj} />
             <Nowtime posx={1050} posy={350} width={300} height={100}/>
        </div>
    </div>
    );
  }
}



export default Busmap;
