import React, { Component } from "react";

import SingleTalk from "./SingleTalk.js";
import { NewTalk } from "../modules/PostInput.js";

import { get } from "../../utilities.js";

class Chatmod extends Component{
  constructor(props){
    super(props);
    
   this.scrollref= React.createRef();
    this.state = {
	    comments: [],
      last:0,
      all:0,
    };
  }
  
  componentDidMount(){
    this.fetch();
    window.addEventListener('wheel', this.handleWheel, { passive: false });
  }
  componentWillUnmount(){
    window.removeEventListener('wheel', this.handleWheel, { passive: false });
  }
  fetch=()=>{
    get("/api/talks", {_id: this.props.roomId}).then((comments) => {
      this.setState({
        comments: comments,
        last: comments.length,
        all: comments.length,
      });
    });
  }
  handleWheel = (e) => {
      e.preventDefault();
      // 检查是否在元素内滚动
      if (!this.scrollref.current.contains(e.target)) return;
      if(e.deltaY>0&&this.state.last!=this.state.all){
        this.setState({last:this.state.last+1});
      }else if(e.deltaY<0&&this.state.last>this.props.number){
        this.setState({last:this.state.last-1});
      }
      // console.log('滚动方向:', e.deltaY > 0 ? '向下' : '向上');
      
      // // 检查滚动边界
      // const { scrollTop, scrollHeight, clientHeight } = this.scrollref.current;
      // const isAtTop = scrollTop === 0;
      // const isAtBottom = scrollTop + clientHeight >= scrollHeight;
      
      // // 自定义滚动行为
      // if (isAtTop && e.deltaY < 0) {
      //   console.log('已到达顶部');
      // } else if (isAtBottom && e.deltaY > 0) {
      //   console.log('已到达底部');
      // }
    };
  render(){
    const num=this.props.number;
    const cnt=this.state.all;
    return (
      <div className="comments-page sub-page-main"  >
        <div ref={this.scrollref}> 
            {
              this.state.comments.filter((comment)=>{
                return comment.sequence <=this.state.last&&comment.sequence>=this.state.last-num+1;
              }).map((comment) => {
                  return (
                    <div on>
                <SingleTalk _id={comment._id} date={comment.date}
                      author={comment.author} content={comment.content} 
                />
                </div>
                );
              })
            }</div>
        <div className="new-comment">
          <span className="new-comment-title">{this.props.title}</span>
          <NewTalk roomId={this.props.roomId} idcnt={cnt+1} pass={this.fetch}/>
        </div>
      </div>
    );
  }
}

export default Chatmod;

