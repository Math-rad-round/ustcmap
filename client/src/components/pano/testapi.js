import React, { Component } from 'react';
import { get, post } from '../../utilities'; // 根据你的实际路径调整

class Testapi extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // 测试文本
      parseText: '从清华去天安门',
      
      // 结果状态
      parseResult: null,
      loading: false,
      error: null,
      
      // 历史记录
      history: []
    };
  }

  // 处理输入变化
  handleInputChange = (e) => {
    this.setState({ parseText: e.target.value });
  };

  // 测试地点解析API - 使用post方法
  testAIParser = () => {
    const { parseText } = this.state;
    
    if (!parseText.trim()) {
      this.setState({ error: '请输入测试文本' });
      return;
    }
    
    this.setState({ 
      loading: true, 
      error: null,
      parseResult: null 
    });
    
    // 使用post方法调用API
    post("/ai/parse", { text: parseText })
      .then((data) => {
        console.log('AI解析成功:', data);
        
        // 添加到历史记录
        const newHistory = [
          {
            text: parseText,
            result: data,
            timestamp: new Date().toLocaleTimeString()
          },
          ...this.state.history.slice(0, 4)
        ];
        
        this.setState({ 
          parseResult: data,
          loading: false,
          history: newHistory
        });
      })
      .catch((err) => {
        console.error('AI解析失败:', err);
        this.setState({ 
          error: err.message || '解析失败',
          loading: false 
        });
      });
  };

  // 测试一个额外的GET接口示例
  testGetAPI = () => {
    // 假设有一个测试状态接口
    get("/ai/test")
      .then((data) => {
        console.log('GET测试成功:', data);
        alert(`服务状态: ${data.message}\n节点数量: ${data.nodeCount}`);
      })
      .catch((err) => {
        console.error('GET测试失败:', err);
        alert('GET接口测试失败: ' + err.message);
      });
  };

  // 使用预设测试用例
  useTestExample = (exampleText) => {
    this.setState({ parseText: exampleText }, () => {
      this.testAIParser();
    });
  };

  // 清除结果
  clearResults = () => {
    this.setState({ 
      parseResult: null,
      error: null,
      history: []
    });
  };

  render() {
    const { 
      parseText, 
      parseResult, 
      loading, 
      error,
      history 
    } = this.state;

    // 预设测试用例
    const testExamples = [
      { text: '从清华去天安门', label: '简单查询' },
      { text: '我要从清华大学东南门去国家图书馆', label: '完整名称' },
      { text: '去鸟巢', label: '单地点' },
      { text: '中关村到西单', label: '简称查询' },
      { text: '起点是北京西站，终点是首都机场', label: '明确起点终点' },
      { text: '去国图', label: '超简查询' }
    ];

    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>AI地点解析测试</h2>
        
        {/* 输入区域 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              测试文本：
            </label>
            <textarea
              value={parseText}
              onChange={this.handleInputChange}
              placeholder="请输入要解析的文本，如：从清华去天安门"
              style={{
                width: '100%',
                height: '80px',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={this.testAIParser}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              {loading ? '解析中...' : '测试AI解析(POST)'}
            </button>
            
            <button
              onClick={this.testGetAPI}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              测试GET接口
            </button>
            
            <button
              onClick={this.clearResults}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              清除结果
            </button>
          </div>
        </div>
        
        {/* 错误显示 */}
        {error && (
          <div style={{
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <strong>错误：</strong> {error}
          </div>
        )}
        
        {/* 结果显示 */}
        {parseResult && (
          <div style={{ marginBottom: '30px' }}>
            <h3>解析结果</h3>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>原始文本：</strong> {parseText}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>成功状态：</strong> 
                <span style={{ 
                  color: parseResult.success ? '#28a745' : '#dc3545',
                  fontWeight: 'bold',
                  marginLeft: '10px'
                }}>
                  {parseResult.success ? '✅ 成功' : '❌ 失败'}
                </span>
              </div>
              
              {parseResult.success ? (
                <>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>起点：</strong> 
                    {parseResult.s ? (
                      <span style={{ marginLeft: '10px' }}>
                        {parseResult.s} - {parseResult.startName || '未知名称'}
                      </span>
                    ) : (
                      <span style={{ marginLeft: '10px', color: '#6c757d' }}>null</span>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '5px' }}>
                    <strong>终点：</strong> 
                    <span style={{ marginLeft: '10px' }}>
                      {parseResult.e} - {parseResult.endName || '未知名称'}
                    </span>
                  </div>
                  
                  {parseResult.error && (
                    <div style={{ marginTop: '10px', color: '#856404' }}>
                      <strong>警告：</strong> {parseResult.error}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <strong>错误信息：</strong> {parseResult.error}
                </div>
              )}
              
              {/* 原始数据 */}
              <details style={{ marginTop: '15px' }}>
                <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                  查看原始数据
                </summary>
                <pre style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '14px'
                }}>
                  {JSON.stringify(parseResult, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
        
        {/* 测试用例 */}
        <div style={{ marginBottom: '30px' }}>
          <h3>快速测试用例</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {testExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => this.useTestExample(example.text)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                title={example.text}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 历史记录 */}
        {history.length > 0 && (
          <div>
            <h3>最近测试记录</h3>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>时间</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>文本</th>
                    <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>结果</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr 
                      key={index} 
                      style={{ 
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                      }}
                    >
                      <td style={{ padding: '10px' }}>{item.timestamp}</td>
                      <td style={{ padding: '10px', maxWidth: '200px', wordBreak: 'break-word' }}>
                        {item.text}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {item.result.success ? (
                          <span style={{ color: '#28a745' }}>
                            ✅ {item.result.s || 'null'} → {item.result.e}
                          </span>
                        ) : (
                          <span style={{ color: '#dc3545' }}>❌ 失败</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* 状态信息 */}
        <div style={{ 
          marginTop: '30px', 
          padding: '15px',
          backgroundColor: '#e9ecef',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <div><strong>API端点：</strong> POST /api/parse</div>
          <div><strong>参数：</strong> {"{ text: '中文查询文本' }"}</div>
          <div><strong>返回格式：</strong> {"{ success, s, e, startName, endName, error }"}</div>
          <div style={{ marginTop: '10px' }}>
            提示：确保后端服务正在运行，且已配置智谱AI API密钥。
          </div>
        </div>
      </div>
    );
  }
}

export default Testapi;