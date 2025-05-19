import React, { Component } from "react";
import Getimg from "../newmod/Getimg.js";
import ProfileHeaderDetail from "./ProfileHeaderDetail.js";
import ProfileHeaderActions from "./ProfileHeaderActions.js";

class ProfileHeader extends Component{
  constructor(props){
    super(props);
  }
	
  render(){
    return (
      <div className="profile-header">
        <Getimg width={"100px"} height={"100px"} parent={"userlogo_"+this.props.userId}/>
        <h1 className="user-name">{this.props.name}</h1>
        <ProfileHeaderActions _id={this.props._id} />
        <ProfileHeaderDetail intro={this.props.intro}/>
      </div>
    );
  }
}

export default ProfileHeader;

