import React, { Component } from "react";

import { get } from "../../utilities.js";

import "./SideBar.css";

class SideBar extends Component{
  constructor(props){
    super(props);
  }

  render(){
    return (
      <div className="sidebar-part">
        <span className="sidebar-part-title">{this.props.title}</span>
        <ul className="sidebar-part-list">
        {
          this.props.elements.map((ele) => {
            return (
              <li>{ele}</li>
            );
          })
        }
        </ul>
      </div>
    );
  }
}

class AppSideBar extends Component{
  constructor(props){
    super(props);
  }
  
  render(){
		const about_elements = [
      "创建时间: "+this.props.createdate,
      "最后编辑: "+this.props.updatedate,
      "支持平台: "+this.props.platforms,
		];
		const links_elements = [
		  this.props.links.map((link) => {
		    return (
			  <>
		      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.webname}</a>
			  </>
			);
		  })
		];
		const tags_elements = this.props.tags.map((tag) => tag.name);
    return (
      <div className="app-sidebar">
        <SideBar title="About:" elements={about_elements} />
        <SideBar title="Links:" elements={links_elements} />
        <SideBar title="Tags:" elements={tags_elements} />
      </div>
    );
  }
}

class ProfileSideBar extends Component{
  constructor(props){
    super(props);
    this.state = {
      about_elements: [],
      links_elements: [],
    };
  }
  
  render(){
  	const about_elements = [
      "用户类型："+this.props.type,
      "注册时间："+this.props.regdate,
      "最后访问："+this.props.visdate,
  	];
  	const links_elements = [
  	  this.props.links.map((link) => {
  	    return (
  		  <>
  		    <a href={link.url} rel="noopener noreferrer">{link.webname}</a>
  		  </>
  		);
  	  })
  	];
    return (
      <div className="profile-sidebar">
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-label">图寻平均成绩</span>
            <span className="stat-value">
              {this.props.times ? 
                (this.props.alldev / this.props.times).toFixed(1) +"米": 
                "尚未进行图寻"}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">图寻次数</span>
            <span className="stat-value">
              {this.props.times || "尚未进行图寻"}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">学习时间</span>
            <span className="stat-value">
              {this.props.studytime ? 
                `${(this.props.studytime/60).toFixed(2)}分钟` : 
                "尚未自习过"}
            </span>
          </div>
        </div>
        <SideBar title="About:" elements={about_elements} />
        <SideBar title="Links:" elements={links_elements} />
      </div>
    );
  }
}

export default SideBar;
export { AppSideBar, ProfileSideBar };

