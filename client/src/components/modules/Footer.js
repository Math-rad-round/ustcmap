import React, { Component } from "react";

import "./Footer.css";

class Footer extends Component{
  constructor(props){
    super(props);
  }

  render(){
    return (
      <div className="footer">
        <span className="footer-text">
          ustc-school-map
        </span>
        <div className="footer-info">
          <div className="footer-content">
            <a href="https://github.com/Math_rad_round/schoolmap">code</a>
          </div>
          <div className="footer-content">
            <a href="https://github.com/Math-rad-round">author</a>
          </div>
          <div className="footer-content">
            <a href="https://github.com/suxxsfe">author</a>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;

