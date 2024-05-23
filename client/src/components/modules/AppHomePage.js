import React, { Component } from "react";

import { marked } from "marked";
import * as DOMPurify from "dompurify";

import { get } from "../../utilities.js";

class AppHomePage extends Component{
  constructor(props){
    super(props);
    this.state = {
      base:"",
    };
  }
  componentDidMount(){
    get("/api/getphoto", {_id: this.props.appId,type:1})
    .then((thing) => {
      console.log(thing);
      this.setState({base:thing.str});
    });
  }
  render(){
    return (
      <div className="home-page sub-page-main">
        <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(marked.parse(this.props.describe))}} ></div>
      <img width={500} src={this.state.base}/>
      </div>
    );
  }
}

export default AppHomePage;

