const express = require('express');
const router = express.Router();
const { callAI } = require('./callAI');
const { ALIAS_MAP, NODE_MAP, getRealName } = require('./nodes');

// 快速规则匹配
function fastRuleMatch(text) {
  if (!text) return { s: null, e: null };
  
  const result = { s: null, e: null };
  
  // 常见模式
  const patterns = [
    { regex: /从(.+?)[到去往](.+)/, start: 1, end: 2 },
    { regex: /(.+?)[到去往](.+)/, start: 1, end: 2 },
    { regex: /去(.+)/, start: null, end: 1 },
    { regex: /到(.+)/, start: null, end: 1 }
  ];
  
  for (const pattern of patterns) {
    console.log(pattern)
    const match = text.match(pattern.regex);
    console.log(match)
    if (match) {
      if (pattern.start !== null) {
        result.s = findNodeId(match[pattern.start].trim());
      }
      result.e = findNodeId(match[pattern.end].trim());
      if (result.e) break;
    }
  }
  
  return result;
}

// 查找节点ID
function findNodeId(text) {
  if (!text) return null;
  
  // 1. 精确匹配
  if (ALIAS_MAP[text]) return ALIAS_MAP[text];
  
  // 2. 包含匹配
  for (const [alias, id] of Object.entries(ALIAS_MAP)) {
    if (text.includes(alias)) return id;
  }
  
  return null;
}

// 验证结果
function validateResult(result) {
  const validated = { s: null, e: null };
  
  if (result.s && NODE_MAP[result.s]) {
    validated.s = result.s;
  }
  
  if (result.e && NODE_MAP[result.e]) {
    validated.e = result.e;
  }
  
  return validated;
}

// 主解析接口
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.json({ s: null, e: null, error: '无输入' });
    }
    
    // 1. 先尝试规则匹配
    let result = fastRuleMatch(text);
    console.log('规则匹配结果:', result);
    // 2. 规则失败则调用AI
    if (!result.s || !result.e) {
      result = await callAI(text);
      console.log('AI 解析结果:', result);
    }
    
    // 3. 验证结果
    const validated = validateResult(result);
    console.log('解析结果:', validated);
    res.json({
      success: true,
      ...validated,
      start: validated.s ? getRealName(validated.s) : null,
      end: validated.e ? getRealName(validated.e) : null
    });
    
  } catch (error) {
    console.error('解析失败:', error);
    res.json({ 
      success: false, 
      s: null, 
      e: null, 
      error: error.message 
    });
  }
});

// 测试接口
router.get('/test', (req, res) => {
  console.log('- API Key 是否存在:', !!process.env.ZHIPU_API_KEY);
console.log('- API Key 长度:', process.env.ZHIPU_API_KEY?.length || 0);
console.log('- PORT:', process.env.PORT);

  res.json({ 
    message: '解析服务运行正常',
    nodeCount: Object.keys(NODE_MAP).length
  });
});
router.get('/getname', (req, res) => {
  const nodeId = req.query.node;  
  if(getRealName(nodeId)){
    res.json({name:getRealName(nodeId)});
  }else{
    res.status(404).json({error:"节点ID不存在"});
  }
});
module.exports = router;