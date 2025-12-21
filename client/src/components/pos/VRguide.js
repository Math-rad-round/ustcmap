import React, { Component } from "react";
import tar from "./../../../dist/assets/audio/tar.mp3";
class VRguide extends Component {
  constructor(props) {
    super(props);
    this.audio= React.createRef();
    this.state = {
    };
  }
  
  env_on=()=>{
    console.log("env_on");
    this.audio.current.play();
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
      console.log("[React] Received message:", e.data);
      if (e.data?.type === "PANO_READY") {
        console.log("✅ React: pano ready");
        this.sendRouteToPano();
      }else if (e.data?.type === "FINISH") {
        setTimeout(() => {
          console.log("到达");
          alert("您已到达目的地！");
        }, 1000);
      }else if (e.data?.type === "RELOAD_NAVIGATION") {
        this.env_on();
        alert("您似乎走错路了，正在为您重新规划路径...");
        const currentNode = e.data.currentNode;

        // 在上层页面进行跳转
        const newUrl = `/guide/${currentNode}/${this.props.route[this.props.route.length - 1]}`;
        console.log(`[Parent Page] Received message. Redirecting to: ${newUrl}`);
        window.location.href = newUrl;  // 跳转到目标路径
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
      <div>
        <audio id="audioPlayer" src={tar} preload="auto" ref={this.audio}></audio>

      <iframe
        id="panoFrame"
        src={"/askroom/guide/index.html#"+this.props.route[0]}
        width="100%"
        height="550"
        allow="fullscreen"
      />
      </div>
    );
  }
}

export default VRguide;
