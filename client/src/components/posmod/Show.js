import React, { Component } from 'react';
import './Show.css';
import { get } from "../../utilities.js";
class NearbyPlaces extends Component {
  constructor(props) {
    super(props);
    this.state = {
      places: [], // 存储查询结果
      error: '',
      num:5
    };
  }
  componentDidMount(){
    this.fetchNearbyPlaces();
  }
  usepass=(roomId)=>{
    console.log("pass");
    if(this.props.pass!=undefined)this.props.pass(roomId);
    else console.log("no pass function");
  }
  // 查询附近地点
  fetchNearbyPlaces = async (num=5) => {
    const { latitude, longitude,maxDistance } = this.props; // 从 props 中获取经纬度d
    console.log('查询附近地点，位置：', latitude, longitude, '最大距离：', maxDistance);
    // 检查经纬度是否有效
    if (!latitude || !longitude) {
      this.setState({ error: '无效的经纬度！' });
      return;
    }

    get("/api/nearby", {latitude:latitude, longitude:longitude, maxDistance:maxDistance,num:num})
        .then((data) => {
            console.log(data);
             this.setState({ places:data, error: ''   ,num:num + 5});
        }).catch((err) => 
          this.setState({ error: '查询失败：' + err.message }));
          
  };
  reset=()=>{
    this.fetchNearbyPlaces(this.state.num+5);
  }
render() {
  const { places, error } = this.state;

  return (
    <div className="nearby-places">
      <div className="places-header">
        <h3 className="places-title">附近地点</h3>
        <button 
          onClick={this.reset} 
          className="btn-expand-search"
          title="扩大搜索范围"
        >
          <span className="btn-icon">🔍</span>
          扩大范围
        </button>
      </div>

      <div className="places-content">
        {places == null ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>正在加载...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏢</span>
            <p>未找到附近地点</p>
          </div>
        ) : (
          <div className="places-list">
            {places.map((place) => (
              <div key={place._id} className="place-item">
                <div className="place-content">
                  <div className="place-main">
                    <div className="place-name-section">
                      <span className="place-name">{place.name}</span>
                      <div className="place-stats">
                        {place.priority && (
                          <span className="priority-stat">
                            优先级 {place.priority}
                          </span>
                        )}
                        {(place.sortScore || place.score) && (
                          <span className="score-stat">
                            排名分数 {(place.sortScore || place.score).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="place-meta">
                      <span className="place-distance">
                        {place.distance >= 1000 
                          ? `${(place.distance / 1000).toFixed(1)}km`
                          : `${place.distance}m`}
                      </span>
                      <button 
                        onClick={() => this.usepass(place.pos)}
                        className="btn-set-start"
                      >
                        <span className="btn-icon">📍</span>
                        设为起点
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
}

export default NearbyPlaces;
