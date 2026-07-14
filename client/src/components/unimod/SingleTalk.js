import React, { Component } from "react";
import { Link } from "react-router-dom";
import "./Talk.css";

class SingleComment extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const date2= new Date(this.props.date);
    const Strtime = date2.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 24小时制
    });
    console.log(Strtime);
    return (
      <div className="above">
        <div className="people">
          <img className="img" src={"/upload/userlogo/"+this.props.author._id} />
          <Link className="name" to={"/user/"+this.props.author._id}>
            {this.props.author.name}
          </Link>
        </div>
        <div className="main">
          <div className="date">
            {Strtime}
          </div>
          <div className="content">
            {this.props.content}
          </div>
        </div>
      </div>
    );
  }
}

export default SingleComment;

