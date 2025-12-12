import React, { Component } from 'react';

class PosPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      location: null,
      accuracy: null,
      error: null,
    };
  }

  componentDidMount() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 获取经纬度和精度信息
          const { latitude, longitude, accuracy } = position.coords;
          this.setState({ location: { latitude, longitude }, accuracy });
        },
        (err) => {
          this.setState({ error: '无法获取位置信息' });
          console.error(err);
        },
        {
          enableHighAccuracy: true, // 启用高精度
          timeout: 10000, // 设置超时时间
          maximumAge: 0, // 不使用缓存的定位信息
        }
      );
    } else {
      this.setState({ error: '此浏览器不支持地理位置功能' });
    }
  }

  render() {
    const { location, accuracy, error } = this.state;

    return (
      <div>
        {error && <p>{error}</p>}
        {location ? (
          <div>
            <p>纬度: {location.latitude}</p>
            <p>经度: {location.longitude}</p>
            <p>定位精度: {accuracy} 米</p> {/* 显示精度 */}
          </div>
        ) : (
          <p>正在获取位置信息...</p>
        )}
      </div>
    );
  }
}

export default PosPage;
