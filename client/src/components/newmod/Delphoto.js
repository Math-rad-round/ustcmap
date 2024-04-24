import React, { Component } from "react";
import { post} from "../../utilities.js";
class Delphoto extends Component{
    constructor(props){
        super(props);
      }
      handle(e){
        console.log("happening");
        post("/api/deletephoto", {
          _id: this.props.appId?this.props.appId:"65f158381a957e154d6cd112"
        }).then(() => {alert("删除成功！");});
    }
      render(){
        return(
            <div onClick={this.handle.bind(this)}>
              <button>{this.props.content?this.props.content:"deletephoto"}</button>
            </div>
        );
      }
      
   
   
  // 获取上传的图片的base64地址
   

}
export default Delphoto;