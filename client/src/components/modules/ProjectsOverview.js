import React, { Component } from "react";

class ProjectsOverview extends Component{
  constructor(props){
    super(props);
  }

  render(){
    return (
      <div className="projects-overview">
        <span>{"共 "+this.props.projects_num+" 个路线"}</span>
      </div>
    )
  }
}

export default ProjectsOverview;

