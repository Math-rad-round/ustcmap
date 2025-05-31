import React, { Component } from "react";
import Dragmap from "./Dragmap.js";
import wholemap from "./wholemap.jpg";

class Clickmap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      markers: [],
      x: null,
      y: null
    };
    this.initialMarkers = this.getInitialMarkers(); // 保存初始标记
  }

  // 获取初始标记（只在构造函数调用一次）
  getInitialMarkers = () => {
    const { initialX, initialY } = this.props;
    if (initialX !== undefined && initialY !== undefined) {
      return [{
        x: initialX,
        y: initialY,
        color: '#00ff00',
        id: 'initial-marker',
        isInitial: true
      }];
    }
    return [];
  }

  componentDidUpdate(prevProps) {
    if (this.props.initialX !== prevProps.initialX || 
        this.props.initialY !== prevProps.initialY) {
      this.updateInitialMarker();
    }
  }

  // 重置方法（保持最小改动）
  reset = () => {
    this.setState({
      markers: [...this.initialMarkers], // 恢复初始标记
      x: null,
      y: null
    });
  };

  updateInitialMarker = () => {
    const { initialX, initialY } = this.props;
    if (initialX !== undefined && initialY !== undefined) {
      this.setState(prevState => ({
        markers: [
          ...prevState.markers.filter(m => !m.isInitial),
          {
            x: initialX,
            y: initialY,
            color: '#00ff00',
            id: 'initial-marker',
            isInitial: true
          }
        ]
      }));
    }
  };

  // 保持原有方法不变
  handleMarkerAdd = (newMarker) => {
    this.setState(prevState => ({
      markers: [
        ...prevState.markers.filter(m => m.isInitial),
        {
          ...newMarker,
          color: '#ffa502',
          isInitial: false
        }
      ],
      x: newMarker.x,
      y: newMarker.y
    }));
    this.props.handle(newMarker.x, newMarker.y);
  };

  handleMarkerRemove = (id) => {
    this.setState(prevState => ({
      markers: prevState.markers.filter(marker => marker.id !== id)
    }));
  };

  render() {
    return (
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        right: '15px',
        bottom: '15px',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Dragmap 
          src={wholemap} 
          alt="地图"
          markers={this.state.markers}
          onMarkerAdd={this.handleMarkerAdd}
          onMarkerRemove={this.handleMarkerRemove}
          markerColor="#ffa502"
        />
      </div>
    );
  }
}

export default Clickmap;