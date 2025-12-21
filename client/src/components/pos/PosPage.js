import React, { Component } from 'react';
import NearbyPlaces from '../posmod/Show';
import { get,post } from '../../utilities.js';
import './Pos.css';
class PosPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      location: null,
      accuracy: null,
      error: null,
      text: null,
      start: null, // 起点（由 NearbyPlaces 回传）
      end: '',     // 终点（输入框输入）
      startname:'',
      endname:''
    };
  }
  send=()=>{
    if(this.state.text==null||this.state.text.length===0){
      alert('请输入导航内容');
      return;
    }
    post("/ai/parse", { text: this.state.text })
      .then((data) => {
        if(data.s==null){
          this.setState({end:data.e,endname:data.end})
        }else this.setState({start:data.s, end:data.e,endname:data.end,startname:data.start})
        console.log('AI解析成功:', data);
      })
      .catch((err) => {
        console.error('AI解析失败:', err);
        this.setState({ 
          error: err.message || '解析失败',
          loading: false 
        });
      });
  }
geoplace=()=>{  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        const dlong=0.01497748079602431 * longitude + -1.7617585034728322;
        const dlat=-0.4120287587707277 * latitude + 13.120712464364;
        longitude-=dlong;
        latitude-=dlat*1.8;
       // latitude-=0.00215;
        console.log('完整位置信息:', {
          latitude, 
          longitude, 
          accuracy,  // 这是关键值（米）
          altitude,
          altitudeAccuracy,
          heading,
          speed,
          timestamp: position.timestamp
        });
        
        // 添加坐标验证
        console.log(`Google Maps查看: https://www.google.com/maps?q=${latitude},${longitude}`);
        
        this.setState({ 
          location: { latitude, longitude }, 
          accuracy,
          rawCoords: position.coords  // 保存完整信息
        });
        
        if(this.state.accuracy !== null) {
          alert(`重新定位成功！精度: ${accuracy}米`);
        }
      },
      (err) => {
        console.error('定位错误:', {
          code: err.code,
          message: err.message,
          PERMISSION_DENIED: err.PERMISSION_DENIED || 1,
          POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE || 2,
          TIMEOUT: err.TIMEOUT || 3
        });
        this.setState({ error: '无法获取位置信息: ' + err.message });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,  // 延长超时
        maximumAge: 0,
      }
    );
  } else {
    this.setState({ error: '此浏览器不支持地理位置功能' });
  }
}
  componentDidMount() {
    this.geoplace();
  }

  /** NearbyPlaces 回传起点 */
  onSelectStart = (roomId) => {
    console.log('选中的起点:', roomId);
    get("/ai/getname",{node:roomId}).then((data)=>{
      console.log("获取节点名称成功:",data);
      this.setState({startname:data.name,start:roomId});
    }).catch((err)=>{
      console.error("获取节点名称失败:",err);
      this.setState({start:roomId});
    })
  }

  /** 输入终点 */
  onEndChange = (e) => {
    get("/ai/getname",{node:e.target.value}).then((data)=>{
      console.log("获取节点名称成功:",data);
      if(this.state.endname!=null)alert("识别完成！");
      this.setState({end:e.target.value,endname:data.name});
    }).catch((err)=>{
      console.error("获取节点名称失败:",err);
      this.setState({ end: e.target.value });
    });
  }
  onTextChange = (e) => {
    this.setState({ text: e.target.value });
  }
  /** 点击按钮跳转 */
  jump = () => {
    const { start, end } = this.state;

    if (!start || !end) {
      alert('请先选择起点并输入终点');
      return;
    }

    const url = `/guide/${start}/${end}`;
    console.log('跳转到:', url);
    window.location.href = url;
  }

  render() {
    const { location, accuracy, error, start, end, text, startname, endname } = this.state;

    return (
      <div className="navigation-container">
        {/* 错误提示 */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">!</span>
            <p>{error}</p>
          </div>
        )}

        {/* 主内容区 */}
        <div className="content-wrapper">
          {location && location.latitude !== undefined ? (
            <div className="navigation-content">
              {/* 位置信息卡片 */}
              <div className="location-card">
                <div className="card-header">
                  <div className="header-left">
                    <h3>当前位置信息</h3>
                    <span className="location-badge">已定位</span>
                  </div>
                  
                  <button 
                    className="btn-reposition"
                    onClick={this.geoplace}  // 这里需要添加对应的处理函数
                    title="重新获取位置信息"
                  >
                    <span className="btn-reposition-icon">🔄</span>
                    重新定位
                  </button>
                </div>
                <div className="card-body">
                  <div className="location-info-grid">
                    <div className="info-item">
                      <span className="info-label">纬度</span>
                      <span className="info-value">{location.latitude.toFixed(6)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">经度</span>
                      <span className="info-value">{location.longitude.toFixed(6)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">定位精度</span>
                      <span className="info-value">{accuracy} 米</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 导航控制区 */}
                <div className="navigation-controls">
                  {/* 起点和终点始终在一行显示 */}
                  <div className="route-info-row">
                    {/* 起点显示 */}
                    <div className="location-display">
                      <div className="location-header">
                        <span className="location-indicator start-indicator">A</span>
                        <h4>起点</h4>
                      </div>
                      <div className="location-name-display">
                        <span className="location-name-text">
                          {startname || start || "未设置起点"}
                        </span>
                      </div>
                    </div>
                    
                    {/* 连接箭头 */}
                    <div className="route-arrow">
                      <span>→</span>
                    </div>
                    
                    {/* 终点显示 */}
                    <div className="location-display">
                      <div className="location-header">
                        <span className="location-indicator end-indicator">B</span>
                        <h4>终点</h4>
                      </div>
                      <div className="location-name-display">
                        <span className="location-name-text">
                          {endname || end || "未设置终点"}
                        </span>
                      </div>
                    </div>
                  </div>
                


                {/* AI导航输入 */}
                <div className="input-card">
                  <h4>AI智能导航</h4>
                  <div className="input-with-icon">
                    <span className="input-icon">🤖</span>
                    <input
                      type="text"
                      placeholder="例：宿舍到第五教学楼"
                      value={text}
                      onChange={this.onTextChange}
                      className="modern-input"
                    />
                  </div>
                  <div className="button-group">
                    <button onClick={this.send} className="btn btn-primary btn-with-icon">
                      <span className="btn-icon">⚡</span>
                      自动AI分析
                    </button>
                  </div>
                </div>

                {/* 导航按钮 */}
                <div className="navigation-actions">
                  <button 
                    onClick={this.jump} 
                    className="btn btn-navigate"
                    disabled={!start || !end}
                  >
                    <span className="btn-icon">🚀</span>
                    开始导航
                    {(!start || !end) && (
                      <span className="tooltip">请先设置起点和终点</span>
                    )}
                  </button>
                </div>
              </div>

              {/* 附近地点组件 */}
              <NearbyPlaces
                latitude={location.latitude}
                longitude={location.longitude}
                maxDistance={accuracy * 3 + 30 + 1e10}
                pass={this.onSelectStart}
              />
            </div>
          ) : (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>正在获取位置信息...</p>
              <p className="loading-subtext">请确保已授权位置访问权限</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default PosPage;
