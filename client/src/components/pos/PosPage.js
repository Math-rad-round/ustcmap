import React, { Component } from 'react';
import NearbyPlaces from '../posmod/Show';
import { get,post } from '../../utilities.js';
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
  componentDidMount() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('获取到的位置:', latitude, longitude, accuracy);
          this.setState({ location: { latitude, longitude }, accuracy });
        },
        (err) => {
          this.setState({ error: '无法获取位置信息' });
          console.error(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      this.setState({ error: '此浏览器不支持地理位置功能' });
    }
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
    const { location, accuracy, error, start, end ,text,startname,endname} = this.state;

    return (
      <div>
        {error && <p>{error}</p>}

        {location && location.latitude !== undefined ? (
          <div>
            <div>
              <p>纬度: {location.latitude}</p>
              <p>经度: {location.longitude}</p>
              <p>定位精度: {accuracy} 米</p>
            </div>

            {/* 终点输入框 */}
            <div style={{ margin: '10px 0' }}>
              <input
                type="text"
                placeholder="请输入终点"
                value={end}
                onChange={this.onEndChange}
              />
            </div>

            {/* 显示当前选择的起点 */}
            {start && <div><p>已选择起点：{start}</p><p>起点名称：{startname}</p></div>}
            {end && <div><p>已选择终点：{end}</p><p>终点名称：{endname}</p></div>}
            {/* 跳转按钮 */}
            <button onClick={this.jump}>
              开始导航
            </button>

            {/* AI输入框 */}
            <div style={{ margin: '10px 0' }}>
              <input
                type="text"
                placeholder="输入导航内容"
                value={text}
                onChange={this.onTextChange}
              />
            </div>
                <button onClick={this.send}>
                              自动AI分析
            </button>

            {/* NearbyPlaces 负责选起点 */}
            <NearbyPlaces
              latitude={location.latitude}
              longitude={location.longitude}
              maxDistance={accuracy * 3 + 30+1e10}
              pass={this.onSelectStart}
            />
          </div>
        ) : (
          <p>正在获取位置信息...</p>
        )}
      </div>
    );
  }
}

export default PosPage;
