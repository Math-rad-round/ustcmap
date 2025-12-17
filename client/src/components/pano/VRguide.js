import React, { Component } from "react";

class VRguide extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  componentDidMount() {
    console.log(this.props)
    this.bindMessage();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.route !== this.props.route) {
      this.sendRouteToPano();
    }
  }

  bindMessage() {
    window.addEventListener("message", (e) => {
      if (e.data?.type === "PANO_READY") {
        console.log("✅ React: pano ready");
        this.sendRouteToPano();
      }
    });
  }

  sendRouteToPano() {
    const iframe = document.getElementById("panoFrame");
    if (!iframe || !this.props.route.length) return;

    console.log("[React] send route:", this.props.route);

    iframe.contentWindow.postMessage(
      {
        type: "SET_ROUTE",
        route: this.props.route
      },
      "*"
    );
  }

  render() {
    return (
      <iframe
        id="panoFrame"
        src={"/askroom/guide/index.html#"+this.props.route[0]}
        width="100%"
        height="550"
        allow="fullscreen"
      />
    );
  }
}

export default VRguide;
