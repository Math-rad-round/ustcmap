import React, { Component } from "react";
import { Link } from "react-router-dom";
import CommentStars from "./CommentStars.js";
import Getimg from "../newmod/Getimg.js";

class SingleComment extends Component{
  constructor(props){
    super(props);
  }
  
  UNUSED_handleScore(){
    
  }

  render(){
    return (
      <div className="comment-card-commentbody">
        <div className="single-comment-author">
          <Getimg height="80px" width="80px" parent={"userlogo_"+this.props.author._id}/>
          <Link className="single-comment-authorname" to={"/user/"+this.props.author._id}>
            {this.props.author.name}
          </Link>
        </div>
        <div className="single-comment-main">
          <CommentStars handleScore={this.UNUSED_handleScore.bind(this)} score={this.props.score}/>
          <div className="single-comment-content">
            {this.props.content}
          </div>
          <div className="single-comment-actions">
            <span className="show-reply-button" onClick={this.props.handle_show_reply}>回复</span>
          </div>
        </div>
      </div>
    );
  }
}

export default SingleComment;

