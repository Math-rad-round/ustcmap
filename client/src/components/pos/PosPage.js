import React , { Component }from "react";
import { Link } from "react-router-dom";
import { post,get } from "../../utilities.js";
import Textbox from "../newmod/Textbox.js";
import PosBox from "../posmod/PosBox.js";
class PosPage extends Component{
  constructor(props){
    super(props);
    this.state={
      latitude:"未定位",
      longitude:"未定位",
      accuracy:"未定义",
      timestamp:"未定义",
    };
    this.changexy= this.changexy.bind(this);
    this.handleLocationUpdate= this.handleLocationUpdate.bind(this);
    this.handleLocationError= this.handleLocationError.bind(this);
    this.handleUseLocation= this.handleUseLocation.bind(this);
  };
  changexy=(pos)=>{
    console.log(pos);
    this.setState(pos);
  }
  handleLocationUpdate = (location) => {
    console.log('位置更新:', location);
    // 精度达到10米以内才认为是有效的
    if (location.isHighAccuracy) {
      // 可以在地图上显示位置
      // updateMap(location.latitude, location.longitude);
    }
  };

  handleLocationError = (error) => {
    console.error('定位错误:', error);
  };
  handleUseLocation = (location) => {
    alert(`使用位置: ${location.latitude}, ${location.longitude}`);
  };

  render(){
    return (
      <div>
      <PosBox
        autoOptimize={true}
        onLocationUpdate={this.handleLocationUpdate}
        onLocationError={this.handleLocationError}
        onUseLocation={this.handleUseLocation}
      />
    </div>
    );
  }
}



export default PosPage;
