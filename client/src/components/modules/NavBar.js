import React, { Component } from "react";
import { createBrowserHistory } from "history";
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
    return (
      <nav className="navbar">
        <div className="navbar-title">
          <Link className="navbar-title-link" to="/">ustc-school-map</Link>
        </div>
        <div className="navbar-links-container">

          <Link className="navbar-link" to="/">Home</Link>
          <Link className="navbar-link" to="/vr/pano">VR</Link>
          <Link className="navbar-link" to="/game/game">Game</Link>
          <Link className="navbar-link" to="/guess">Guess</Link>
          <Link className="navbar-link" to="/map">Map</Link>
          <Link className="navbar-link" to={this.props._id ? "/user/"+this.props._id : "/signin"} state={{from: this.props.whereAmI}}>Profile</Link>
         
          {
          //   <Link className="navbar-link" to="/search">Catalog</Link>
          (<Link className="navbar-link" to="/new">New</Link>)
          }

          <Link className="navbar-link" to="/signin" state={{from: this.props.whereAmI}}>LogIn</Link>
          <Link className="navbar-link" to={"/room/node"+this.getNode()}>Room</Link>
          <p className="navbar-link" onClick={this.handleLogout.bind(this)}>Logout</p>
        </div>
      </nav>
    );
  }
}

export default NavBar;

