import React, { Component } from "react";
import { Link } from "react-router-dom";

import "./NavBar.css";

class NavBar extends Component{
  constructor(props){
    super(props);
  }
  
  handleLogout(){
    window.localStorage.removeItem("token");
    window.location.reload();
  }
  getNode = () => {
    const nodes = ["7", "8", "9", "11", "13"];
    return nodes[Math.floor(Math.random() * nodes.length)];
  };
  render(){
    const accountPath = this.props._id ? "/user/"+this.props._id : "/signin";
    const accountText = this.props._id ? "Profile" : "LogIn";
    return (
      <nav className="navbar">
        <div className="navbar-title">
          <Link className="navbar-title-link" to="/">ustc-school-map</Link>
        </div>
        <div className="navbar-links-container">
          <Link className="navbar-link" to="/">Home</Link>
          <Link className="navbar-link" to="/vr/pano">VR Map</Link>
          <Link className="navbar-link" to="/getpos">Nav</Link>
          <Link className="navbar-link" to="/game/game">Game</Link>
          <Link className="navbar-link" to="/ustcgame">DeckGame</Link>
          <Link className="navbar-link" to="/dbg">DBG</Link>
          <Link className="navbar-link" to="/search">Search</Link>
          <Link className="navbar-link" to={accountPath} state={{from: this.props.whereAmI}}>{accountText}</Link>
          <p className="navbar-link" onClick={this.handleLogout.bind(this)}>Logout</p>
        </div>
      </nav>
    );
  }
}

export default NavBar;

