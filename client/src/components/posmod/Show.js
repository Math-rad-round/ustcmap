import React, { Component } from 'react';

import { get } from "../../utilities.js";
class NearbyPlaces extends Component {
  constructor(props) {
    super(props);
    this.state = {
      places: [], // 存储查询结果
      error: ''
    };
  }
  usepass=(roomId)=>{
    console.log("pass");
    if(this.props.pass!=undefined)this.props.pass(roomId);
    else console.log("no pass function");
  }
  // 查询附近地点
  fetchNearbyPlaces = async () => {
    const { latitude, longitude,maxDistance } = this.props; // 从 props 中获取经纬度d
    console.log('查询附近地点，位置：', latitude, longitude, '最大距离：', maxDistance);
    // 检查经纬度是否有效
    if (!latitude || !longitude) {
      this.setState({ error: '无效的经纬度！' });
      return;
    }

    get("/api/nearby", {latitude:latitude, longitude:longitude, maxDistance:maxDistance,num:5})
        .then((data) => {
            console.log(data);
             this.setState({ places:data, error: '' });
        }).catch((err) => 
          this.setState({ error: '查询失败：' + err.message }));
          
  };

  render() {
    const { places, error, maxDistance } = this.state;

    return (
      <div className="nearby-places-container">
        <h2>查询附近地点</h2>


        <button onClick={this.fetchNearbyPlaces}>查询附近地点</button>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
  <h3>附近地点（按距离/优先级排序）：</h3>
  {places == null || places.length === 0 ? (
    <p>未找到附近地点</p>
  ) : (
    <div>
      <p>基础搜索距离：{maxDistance}米</p>
      <ul>
        {places.map((place) => (
          <li key={place._id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd' }}>
            <div>
              <strong>{place.name}</strong>
              <span style={{ marginLeft: '10px', color: '#666' }}>
                距离：{place.distance >= 1000 
                  ? `${(place.distance / 1000).toFixed(1)}公里` 
                  : `${place.distance}米`}
              </span>
              <span style={{ marginLeft: '10px', color: place.priority === 1 ? '#f00' : place.priority === 2 ? '#f90' : '#09f' }}>
                优先级：{place.priority || '无'}
              </span>
              <span style={{ marginLeft: '10px', color: '#999', fontSize: '12px' }}>
                排序得分：{place.sortScore?.toFixed(2) || place.score?.toFixed(2) || 'N/A'}
              </span>
              <button onClick={()=>this.usepass(place.pos)}>设定起点</button>
            </div>
            <div style={{ marginTop: '5px', fontSize: '12px', color: '#888' }}>
              {place.priority ? 
                `搜索范围：${(maxDistance * (place.priority === 1 ? 1 : place.priority === 2 ? 0.5 : 0.25)).toFixed(0)}米` :
                `搜索范围：${(maxDistance * 0.125).toFixed(0)}米`
              }
            </div>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>
      </div>
    );
  }
}

export default NearbyPlaces;
