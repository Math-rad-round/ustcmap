import React, { Component } from "react";
import Dragmap from "./Dragmap.js";
import mapImage from "./wholemap.jpg";
import confirmIcon from "../unipage/env.png";

class Setxy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      x: null,
      nodename: "",
      y: null,
      markers: []
    };
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleMarkerAdd = (newMarker) => {
    this.setState(prevState => ({
      markers: [...prevState.markers, newMarker],
      x: newMarker.x,
      y: newMarker.y
    }));
  };

  handleMarkerRemove = (id) => {
    this.setState(prevState => ({
      markers: prevState.markers.filter(marker => marker.id !== id)
    }));
  };

  confirm = () => {
    const { nodename, x, y } = this.state;
    if (!nodename || x === null || y === null) {
      alert("请确保已填写节点名称并在地图上标记位置");
      return;
    }
    this.props.pass(nodename, x, y);
  };

  render() {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '55% 45%',
        gap: '15px',
        height: '100vh',
        padding: '15px',
        boxSizing: 'border-box',
        backgroundColor: '#f0f2f5'
      }}>
        {/* 左侧游戏区域 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ 
            flex: 1,
            position: 'relative'
          }}>
            <iframe 
              width="100%"
              height="100%"
              src={`/guess/guess/index.html#${this.props.nodeId}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-pointer-lock"
              title="位置猜测游戏"
              style={{ border: 'none' }}
            />
          </div>
          
          <div style={{ 
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '15px',
              marginBottom: '15px'
            }}>
              <button 
                onClick={this.confirm}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3498db, #1a5f9e)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <img 
                  src={confirmIcon} 
                  alt="确认图标" 
                  style={{ width: '24px', height: '24px' }}
                />
                确认位置
              </button>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                marginLeft: 'auto',
                background: '#f0f8ff',
                padding: '10px 15px',
                borderRadius: '8px',
                minWidth: '120px'
              }}>
                <div style={{ fontWeight: '500' }}>坐标信息</div>
                <div>X: {this.state.x !== null ? Math.round(this.state.x) : '未标记'}</div>
                <div>Y: {this.state.y !== null ? Math.round(this.state.y) : '未标记'}</div>
              </div>
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontWeight: '500',
                color: '#333'
              }}>
                节点名称:
              </label>
              <input
                type="text"
                name="nodename"
                value={this.state.nodename}
                onChange={this.handleInputChange}
                placeholder="输入节点名称"
                required
                style={{ 
                  width: '100%', 
                  padding: '12px 15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* 右侧地图区域 */}
        <div style={{
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          position: 'relative'
        }}>
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
              src={mapImage} 
              alt="地图"
              markers={this.state.markers}
              onMarkerAdd={this.handleMarkerAdd}
              onMarkerRemove={this.handleMarkerRemove}
              markerColor="#ffa502"
            />
          </div>
          
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 15px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 50
          }}>
            地图标记工具
          </div>
        </div>
      </div>
    );
  }
}

export default Setxy;