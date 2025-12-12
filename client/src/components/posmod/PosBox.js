import React, { Component } from 'react';
import './PosBox.css'; // 你可以创建相应的CSS文件

class PosBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: null,
      longitude: null,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: null,
      isLocating: false,
      locationError: null,
      watchId: null,
      lastUpdated: null,
      locationCount: 0
    };
    
    this.defaultOptions = {
      enableHighAccuracy: true,      // 启用高精度模式
      timeout: 10000,               // 10秒超时
      maximumAge: 0                 // 不缓存位置
    };
  }

  componentDidMount() {
    // 组件加载时自动开始定位
    this.startLocation();
  }

  componentWillUnmount() {
    // 组件卸载时停止监听
    this.stopLocation();
  }

  // 开始获取位置
  startLocation = () => {
    this.setState({ isLocating: true, locationError: null });
    
    if (navigator.geolocation) {
      // 先获取一次即时位置
      navigator.geolocation.getCurrentPosition(
        this.handlePositionSuccess,
        this.handlePositionError,
        this.defaultOptions
      );
      
      // 开始持续监听位置变化（可选）
      const watchId = navigator.geolocation.watchPosition(
        this.handlePositionSuccess,
        this.handlePositionError,
        this.defaultOptions
      );
      
      this.setState({ watchId });
    } else {
      this.setState({
        locationError: '浏览器不支持地理定位功能',
        isLocating: false
      });
    }
  };

  // 停止定位
  stopLocation = () => {
    if (this.state.watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.state.watchId);
      this.setState({ watchId: null, isLocating: false });
    }
  };

  // 重新定位
  refreshLocation = () => {
    this.stopLocation();
    this.startLocation();
  };

  // 位置获取成功
  handlePositionSuccess = (position) => {
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed
    } = position.coords;

    // 检查精度是否符合10米级要求
    const isHighAccuracy = accuracy <= 10;
    
    this.setState({
      latitude,
      longitude,
      accuracy,
      altitude,
      altitudeAccuracy,
      heading,
      speed,
      timestamp: position.timestamp,
      isLocating: false,
      locationError: null,
      lastUpdated: new Date().toLocaleTimeString(),
      locationCount: this.state.locationCount + 1
    });

    // 触发父组件的回调（如果提供了）
    if (this.props.onLocationUpdate) {
      this.props.onLocationUpdate({
        latitude,
        longitude,
        accuracy,
        isHighAccuracy,
        timestamp: position.timestamp
      });
    }

    // 如果精度不符合要求且开启了自动优化，可以尝试重新获取
    if (this.props.autoOptimize && !isHighAccuracy && accuracy > 10) {
      setTimeout(() => {
        if (this.state.isLocating === false) {
          this.refreshLocation();
        }
      }, 2000);
    }
  };

  // 位置获取失败
  handlePositionError = (error) => {
    let errorMessage = '';
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '用户拒绝位置访问权限';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '无法获取位置信息';
        break;
      case error.TIMEOUT:
        errorMessage = '获取位置超时';
        break;
      default:
        errorMessage = '未知错误';
    }
    
    this.setState({
      locationError: `${errorMessage} (代码: ${error.code})`,
      isLocating: false
    });

    if (this.props.onLocationError) {
      this.props.onLocationError(error);
    }
  };

  // 格式化精度显示
  formatAccuracy = (accuracy) => {
    if (accuracy === null) return '--';
    return `${accuracy.toFixed(1)} 米`;
  };

  // 复制位置信息到剪贴板
  copyToClipboard = () => {
    const text = `纬度: ${this.state.latitude}, 经度: ${this.state.longitude}, 精度: ${this.formatAccuracy(this.state.accuracy)}`;
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('位置信息已复制到剪贴板');
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  };

  // 渲染精度状态指示器
  renderAccuracyIndicator = () => {
    const { accuracy } = this.state;
    
    if (accuracy === null) return null;
    
    let className = 'accuracy-indicator';
    let status = '';
    
    if (accuracy <= 5) {
      className += ' excellent';
      status = '极好';
    } else if (accuracy <= 10) {
      className += ' good';
      status = '良好';
    } else if (accuracy <= 20) {
      className += ' fair';
      status = '一般';
    } else {
      className += ' poor';
      status = '较差';
    }
    
    return (
      <div className={className}>
        <span className="status-dot"></span>
        {status} ({this.formatAccuracy(accuracy)})
      </div>
    );
  };

  render() {
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      isLocating,
      locationError,
      lastUpdated,
      locationCount
    } = this.state;

    return (
      <div className="pos-box">
        <div className="pos-box-header">
          <h3>校园位置定位</h3>
          <div className="controls">
            <button 
              onClick={this.refreshLocation}
              disabled={isLocating}
              className="refresh-btn"
            >
              {isLocating ? '定位中...' : '刷新位置'}
            </button>
            <button 
              onClick={this.stopLocation}
              className="stop-btn"
            >
              停止
            </button>
          </div>
        </div>

        <div className="pos-box-content">
          {isLocating ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>正在获取高精度位置信息...</p>
              <small>请确保已开启位置权限和GPS</small>
            </div>
          ) : locationError ? (
            <div className="error">
              <p className="error-message">⚠️ {locationError}</p>
              <button 
                onClick={this.refreshLocation}
                className="retry-btn"
              >
                重试
              </button>
            </div>
          ) : latitude ? (
            <div className="location-info">
              <div className="coordinate-section">
                <div className="coordinate-row">
                  <span className="label">纬度:</span>
                  <span className="value">{latitude.toFixed(6)}°</span>
                </div>
                <div className="coordinate-row">
                  <span className="label">经度:</span>
                  <span className="value">{longitude.toFixed(6)}°</span>
                </div>
                <div className="coordinate-row">
                  <span className="label">水平精度:</span>
                  <span className="value accuracy-value">
                    {this.renderAccuracyIndicator()}
                  </span>
                </div>
              </div>

              {altitude && (
                <div className="additional-info">
                  <div className="info-row">
                    <span className="label">海拔:</span>
                    <span className="value">{altitude.toFixed(1)} 米</span>
                  </div>
                </div>
              )}

              {(heading !== null || speed !== null) && (
                <div className="motion-info">
                  {heading !== null && (
                    <div className="info-row">
                      <span className="label">方向:</span>
                      <span className="value">{heading.toFixed(0)}°</span>
                    </div>
                  )}
                  {speed !== null && (
                    <div className="info-row">
                      <span className="label">速度:</span>
                      <span className="value">{(speed * 3.6).toFixed(1)} km/h</span>
                    </div>
                  )}
                </div>
              )}

              <div className="meta-info">
                {lastUpdated && (
                  <div className="meta-row">
                    <span className="label">更新时间:</span>
                    <span className="value">{lastUpdated}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="label">定位次数:</span>
                  <span className="value">{locationCount}</span>
                </div>
              </div>

              <div className="actions">
                <button 
                  onClick={this.copyToClipboard}
                  className="copy-btn"
                >
                  复制位置信息
                </button>
                {this.props.onUseLocation && (
                  <button 
                    onClick={() => this.props.onUseLocation({
                      latitude,
                      longitude,
                      accuracy
                    })}
                    className="use-btn"
                  >
                    使用此位置
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="no-data">
              <p>点击"刷新位置"开始定位</p>
            </div>
          )}
        </div>

        <div className="pos-box-footer">
          <small>
            精度说明: 
            <span className="accuracy-excellent">绿色</span> (&lt;5m) | 
            <span className="accuracy-good">蓝色</span> (5-10m) | 
            <span className="accuracy-fair">黄色</span> (10-20m) | 
            <span className="accuracy-poor">红色</span> (&gt;20m)
          </small>
        </div>
      </div>
    );
  }
}

// Prop Types 定义
PosBox.defaultProps = {
  autoOptimize: true,  // 自动优化精度
  onLocationUpdate: null,
  onLocationError: null,
  onUseLocation: null
};

export default PosBox;