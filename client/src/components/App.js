import React, { Component } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PropTypes from "prop-types";
import PathParamsHOC from "./PathParamsHOC.js";
import Root from "./pages/Root.js";
import VRroute from "./pano/VRroute.js";

import VRgame from "./pano/VRgame.js";
import AppPage from "./pages/AppPage.js";
import Profile from "./pages/Profile.js";
import Search from "./pages/Search.js";
import NewProjectPage from "./pages/NewProjectPage.js";
import SignInPage from "./pages/SignInPage.js";
import SignUpPage from "./pages/SignUpPage.js";
import AppSettings from "./pages/AppSettings.js";
import ProfileSettingsPage from "./pages/ProfileSettingsPage.js";
import NotFound from "./pages/NotFound.js";
import Map from "./newpage/Map.js";
import Room from "./unipage/Room.js";
import Path from "./newpage/Path.js";
import Addguess from "./unipage/Addguess.js";
import Guess from "./unipage/guess.js";
import { post } from "../utilities.js";
import Busmap from "./newpage/Busmap.js";
import Footer from "./modules/Footer.js";
import NavBar from "./modules/NavBar.js";
import Panvr from "./unipage/Panvr.js";
import "../utilities.css";
import "./App.css";

class App extends Component{
  constructor(props){
    super(props);
    
    this.state = {
      whoami: {},
      whereAmI: "/",
    };
  }
  
  componentDidMount(){
    this.updateWhoami();
  }
  
  updateWhoami(){
    return new Promise((resolve, reject) => {
      let newWhoami = {name: "", _id: 0};
      if(!window.localStorage.getItem("token")){
        this.setState({
          whoami: {name: "", _id: 0},
        }, () => (resolve("success updated whoami")));
      }
      else{
        post("/api/whoami", {})
        .then((res) => {
          this.setState({
            whoami: res,
          }, () => (resolve("success updated whoami")));
        })
        .catch((e) => {
          console.log(e);
          resolve("fail updated whoami");
        });
      }
    });
  }
  
  deleteWhoami(){
    this.setState({
      whoami: {name: "", _id: 0},
    });
  }
  
  updateWhereAmI(where){
    this.setState({
      whereAmI: where,
    }, () => console.log("where am i now?? "+where));
  }
  
  static childContextTypes = {
    whoami: PropTypes.object,
    deleteWhoami: PropTypes.func,
  }
  getChildContext(){
    return {
      whoami: this.state.whoami,
      deleteWhoami: this.deleteWhoami.bind(this),
    }
  }
  
  render(){
    return (
      <>
        <div className="app-container">
          <BrowserRouter>
            <NavBar _id={this.state.whoami._id} whereAmI={this.state.whereAmI}/>
            <Routes>
              <Route path="/" element={<Root updateWhoami={this.updateWhoami.bind(this)}
                                             updateWhereAmI={this.updateWhereAmI.bind(this)}
                                       />}
                              errorElement={<NotFound />}
              >
                <Route path="/" element={<Search />} />
                <Route path="/app/:appId/path" element={<PathParamsHOC component={Path}/>} />
                <Route path="/map" element={<Map />} />
                <Route path="/map/bus" element={<Busmap />} />
                <Route path="/room/:place" element={<PathParamsHOC component={Room}/>}/>
                <Route path="/vr/:pos" element={<PathParamsHOC component={Panvr}/>}/>
                <Route path="/game/:pos" element={<PathParamsHOC component={Panvr}/>} />
                <Route path="/app/:appId/settings" element={<PathParamsHOC component={AppSettings} />} />
                <Route path="/app/:appId" element={<PathParamsHOC component={AppPage} />} />
                <Route path="/user/:userId" element={<PathParamsHOC component={Profile} />} />
                <Route path="/user/:userId/settings" element={<PathParamsHOC component={ProfileSettingsPage} />} />
                <Route path="/search/" element={<Search />} />
                <Route path="/new/" element={<NewProjectPage />} />
                <Route path="/addguess/" element={<Addguess />} />
                <Route path="/guess" element={<Guess />} />
                <Route path="/signin/" element={<SignInPage updateWhoami={this.updateWhoami.bind(this)} />} />
                <Route path="/signup/" element={<SignUpPage />} />
                <Route path="/vr" element={<VRroute />} />
                <Route path="/game" element={<VRgame />} />
           {//     <Route path="*" element={<NotFound />} />
           }
              </Route>
            </Routes>
          </BrowserRouter>
        </div>
        <Footer />
      </>
    );
  }
}

export default App;

