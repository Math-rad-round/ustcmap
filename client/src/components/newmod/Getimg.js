import React, { Component } from "react";
import ReactFileReader from "react-file-reader";
import { get } from "../../utilities.js";
class Getimg extends Component{
    constructor(props){
        super(props);
        this.state = {
            base:"",
          };
      }
    componentDidMount(){
        get("/api/getphoto", {_id: this.props.parent,type:this.props.type===undefined?0:this.props.type})
        .then((thing) => {
        this.setState({base:thing.str});
        });
    }
      render(){
        return(
            <img width={this.props.width==undefined?"100px":this.props.width} 
                height={this.props.height==undefined?"100px":this.props.height} src={this.state.base} alt=""/>
        );
      }
}
export default Getimg;

