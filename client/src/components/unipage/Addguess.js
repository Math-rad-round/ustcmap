import React, { Component } from 'react';
import { post } from '../../utilities.js';
class NodeForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodeId: '',
      nodeName: '',
      posx: '',
      posy: ''
    };
  }

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value
    });
  };
  handleSubmit = () => {
    console.log("submit");
    console.log(this.state.nodeId);
    console.log(this.state.nodeName);
    console.log(this.state.posx);
    console.log(this.state.posy);
     post("/guess/add",{nodeId:this.state.nodeId,nodename:this.state.nodeName,posx:this.state.posx,posy:this.state.posy})
     .then((res) =>{console.log(res);alert("提交成功");})
  };
  render() {
    const { nodeId, nodeName, posx, posy } = this.state;

    return (
      <div style={{ 
        maxWidth: '500px', 
        margin: '20px auto', 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '8px' 
      }}>
      <div>
        <h2>节点信息表单,仅供测试</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>节点ID:</label>
            <input
              type="text"
              name="nodeId"
              value={nodeId}
              onChange={this.handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>节点名称:</label>
            <input
              type="text"
              name="nodeName"
              value={nodeName}
              onChange={this.handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>X坐标:</label>
            <input
              type="number"
              name="posx"
              value={posx}
              onChange={this.handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Y坐标:</label>
            <input
              type="number"
              name="posy"
              value={posy}
              onChange={this.handleInputChange}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button 
            onClick={this.handleSubmit}
            style={{
              padding: '10px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            提交数据
          </button>
        </div>
      </div>
    );
  }
}

export default NodeForm;