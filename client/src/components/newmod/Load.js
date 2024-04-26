import React, { Component } from "react";
import ReactFileReader from "react-file-reader";
import { post } from "../../utilities.js";
class load extends Component{
    constructor(props){
        super(props);
      }
      handleFiles = (files) => {
        let e=files.base64;
        console.log("posting");   
        console.log("gointo"+( this.props.appId?this.props.appId:"65f158381a957e154d6cd112"));
        post("/api/loadphoto", {
          content: e,
          _id: this.props.appId?this.props.appId:"65f158381a957e154d6cd112"
        }).then(() => {alert("上传成功！");});
    }
      render(){
        return(
            <div>
              <ReactFileReader fileTypes={[".jpg",".png"]} base64={true} multipleFiles={true} handleFiles={this.handleFiles}>        
              <button className='btn'>{this.props.content?this.props.content:"Upload"}</button>
              </ReactFileReader>
            </div>
        );
      }
      
   
   
  // 获取上传的图片的base64地址
   

}
export default load;