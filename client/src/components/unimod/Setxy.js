import React , { Component }from "react";
import map from "../unipage/map.png";
import Clickmap from "./Clickmap.js";

class Guess extends Component{
  constructor(props){
    super(props);
    this.state = {
        screen: false,
        x:null,
        nodename: "",
        y:null,
        chat:false,
      };
  };
  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value
    });
  };
  handle = (x,y) => {
    this.setState({x:x,y:y});
    console.log("x,y",x,y);
  };
  confirm = () => {
    this.props.pass(this.state.nodename,this.state.x,this.state.y);
  };
  render(){
    console.log("target"+'  /guess/guess/index.html#'+this.props.nodeId);
    return (
      <div style={{
          display: 'grid',
          gridTemplateColumns: '65% 35%',
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
                  src={'/guess/pano/index.html#'+this.props.nodeId}
                  sandbox="allow-same-origin allow-scripts allow-popups"
                />
            </div>
            <div>
              <img src={map} width="40px" height="40px" onClick={this.confirm}/>
              <div>X {this.state.x}</div>
              <div>Y {this.state.y}</div>
                <div style={{ marginBottom: '15px' }}>
                  <label>节点名称:</label>
                  <input
                    type="text"
                    name="nodename"
                    value={this.state.nodename}
                    onChange={this.handleInputChange}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                  />
                </div>
            </div>
        </div>
        <div>
             <Clickmap handle={this.handle} x={this.state.x} y={this.state.y} 
             xp={this.state.ok?this.state.target.posx:null} yp={this.state.ok?this.state.target.posy:null}/>
       </div>
      </div>
    );
  }
}



export default Guess;



