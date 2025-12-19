const axios = require('axios');
const { generateNodeList } = require('./nodes');

// 解析AI返回的JSON
function parseAIResponse(content) {
  try {
    const result = JSON.parse(content);
    return {
      s: result.s || result.start || null,
      e: result.e || result.end || null
    };
  } catch (error) {
    // 尝试从文本中提取
    const sMatch = content.match(/"s"\s*:\s*"([^"]*)"/);
    const eMatch = content.match(/"e"\s*:\s*"([^"]*)"/);
    
    return {
      s: sMatch ? sMatch[1] : null,
      e: eMatch ? eMatch[1] : null
    };
  }
}
const pre="你是中国科学技术大学校园导航助手。你要根据用户的输入，识别其中的导航终点（和可能的起点）"+
    "请优先通过下方给出的描述确定节点ID，如果无法确定，可以搜索网络信息，识别到相近的节点ID也可以。"+
    "无论如何，都请返回一个终点节点ID，终点不能是null。如果用户没有明确给出起点，则起点返回null。";
// 核心AI调用
async function callAI(userInput) {
  const prompt = pre+`提取起点终点后，返回JSON，请注意节点ID要有node前缀：{"s":"节点ID/null","e":"节点ID"}
可用节点：${generateNodeList()}
规则：只使用上述节点ID
输入：${userInput}`;
  if(process.env.ZHIPU_API_KEY===undefined){
    throw new Error("AI API Key 未配置");
  }
  const response = await axios.post(
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 50,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    }
  );
  
  const content = response.data.choices[0].message.content;
  return parseAIResponse(content);
}

module.exports = { callAI };