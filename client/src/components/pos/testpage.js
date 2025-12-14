import React, { Component } from 'react';
import { post } from "../../utilities.js";

class Savepos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      pos: '', // 新增：地点 ID 字段
      coordinates: ''
    };
  }

  // 更新输入框的值
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  // 解析坐标字符串
  parseCoordinates = (coordStr) => {
    if (!coordStr) return null;
    
    // 支持格式：117.270837,31.84079
    const parts = coordStr.trim().split(/[,\s]+/);
    if (parts.length !== 2) {
      throw new Error('坐标格式应为"经度,纬度"，例如: 117.270837,31.84079');
    }
    
    const longitude = parseFloat(parts[0]);
    const latitude = parseFloat(parts[1]);
    
    if (isNaN(longitude) || isNaN(latitude)) {
      throw new Error('坐标必须为有效的数字');
    }
    
    // 验证坐标范围（东经北纬）
    if (longitude < 0 || longitude > 180) {
      throw new Error(`经度应在0-180之间（东经）`);
    }
    
    if (latitude < 0 || latitude > 90) {
      throw new Error(`纬度应在0-90之间（北纬）`);
    }
    
    return {
      longitude: longitude,
      latitude: latitude,
      coordinates: [longitude, latitude]
    };
  };

  // 保存数据
  save = (data) => {
    post("/api/savepos", { ...data }).then((res) => {
      alert("保存成功");
      // 清空输入框
      this.setState({
        name: '',
        pos: '',
        coordinates: ''
      });
    }).catch((err) => {
      alert("保存失败：" + err.message);
    });
  };

  // 提交表单
  handleSubmit = (e) => {
    e.preventDefault();
    const { name, pos, coordinates } = this.state;

    // 输入验证
    if (!name) {
      alert("请填写地点名称！");
      return;
    }
    
    if (!coordinates) {
      alert("请填写坐标！格式：经度,纬度");
      return;
    }

    try {
      const parsedCoords = this.parseCoordinates(coordinates);
      
      const dataToSend = {
        name: name,
        pos: pos,
        longitude: parsedCoords.longitude,
        latitude: parsedCoords.latitude,
        coordinatesStr: coordinates
      };
      
      
      // 调用 save 方法
      this.save(dataToSend);
    } catch (error) {
      alert(`坐标格式错误：${error.message}`);
    }
  };

  render() {
    const { name, pos, coordinates } = this.state;

    return (
      <div className="save-pos-container">
        <h2>保存地点</h2>
        <form onSubmit={this.handleSubmit}>
          <div>
            <label>地点名称：</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={this.handleChange}
              placeholder="请输入地点名称"
              required
            />
          </div>
          <div>
            <label>地点 ID (可选)：</label>
            <input
              type="text"
              name="pos"
              value={pos}
              onChange={this.handleChange}
              placeholder="请输入后端地点 ID"
            />
          </div>
          <div>
            <label>坐标（东经,北纬）：</label>
            <input
              type="text"
              name="coordinates"
              value={coordinates}
              onChange={this.handleChange}
              placeholder="例如：117.270837,31.84079"
              required
            />
          </div>
          <button type="submit">保存</button>
        </form>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <p>坐标格式提示：</p>
          <ul>
            <li>使用东经,北纬格式</li>
            <li>用逗号分隔经度和纬度</li>
            <li>示例：117.270837,31.84079</li>
            <li>经度范围：0-180</li>
            <li>纬度范围：0-90</li>
          </ul>
          <p style={{ marginTop: '10px' }}>
            地点 ID 说明：如果是更新现有地点，请输入对应的 ID；如果是新增地点，请留空
          </p>
        </div>
      </div>
    );
  }
}

export default Savepos;