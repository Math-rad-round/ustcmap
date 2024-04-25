import React , { Component }from "react";
import Text from "../newmod/Text.js";
import east from "./123.jpg";
import "./Map.css";
class Map extends Component{
  constructor(props){
    super(props);
  };
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
    </div>
    );
  }
}



export default Map;
