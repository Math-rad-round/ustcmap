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
          <h3>附近地点：</h3>
          {places==null||places.length === 0 ? (
            <p>未找到附近地点</p>
          ) : (
            <ul>
              {places.map((place) => (
                <li key={place._id}>
                  <strong>{place.name}</strong>
                  <button onClick={()=>this.usepass(place.pos)}>跳转到对应位置</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

export default NearbyPlaces;
