
// 每个节点一行：[id, 名称, 别名]
const NODES = [
  ["node1", "第一教学楼东南路口", "一教东南"],
  
  ["node3", "第一教学楼北门/樱花大道", "一教北门,樱花大道"],
  ["node4", "第二教学楼外侧", "二教外,2教外,星座餐厅"],
  ["node5", "第五教学楼", "五教,5xxx,管院楼"],
  ["node6", "第五教学楼南侧", "五教南路口"],

  ["node7", "郭沫若广场", "东区广场,国旗台,郭沫若雕像,USTC1958"],
  ["node8", "东区学生活动中心", "美食广场,东活,东区教工食堂"],
  ["node9", "东区食堂", "蜗壳餐厅,东区二楼食堂,东苑餐厅"],
  ["node10", "大礼堂", "东区大厅,礼堂"],

  ["node11", "东区图书馆", "东图"],
  ["node12", "东区北门", "东区地铁口"],
  ["node13", "老北门", "东区老北门"],
  ["node14", "数院楼", ""],
  ["node15", "物质楼", "东区物化楼"],

  ["node16", "水上报告厅/少院楼", "水报,少年班学院,二教西侧"],
  ["node17", "东区体育场", "东操场,东体育场"],
  ["node18", "东区体育场路口", "国际部"],

  ["node20", "东区西门外侧", "东区西门外,肯德基,费比欧,FABIO"],


  
  ["node21", "中区食堂", "夜餐部,医学部,桃李苑"],
  ["node22", "隧道内部", "地下通道"],
  ["node23", "中区近邻宝", "中区5号楼,中区6号楼,近邻宝"],
  ["node24", "中区北门", "合肥大学、中区北入口"],
  ["node25", "中区隧道口", "青年之家"],

  ["node26", "中区体育馆西北角", "中区体育场"],
  ["node27", "中区体育场东南角", "中区体育场后,中区体育场天台"],
  ["node28", "中区宿舍楼", "宿舍楼,游泳馆,中区1/2/3/4号楼"],

  ["node29", "第三教学楼C栋", "3Cxxx,西区3C教学楼"],
  ["node30", "第三教学楼C栋北侧", "三教北,也西湖西南"],
  ["node31", "西区东侧的小桥", "西区桥梁"],

  ["node32", "西区电子教学楼", "电子楼,电三楼"],
  ["node33", "西区东门西侧", "西区东门,西区东路口,西区教工食堂"],
  ["node34", "西区西侧食堂", "金桔圆餐厅,西区清真餐厅,西三餐厅,西学生食堂"],

  ["node35", "西区学生活动中心", "西活,西区体育场,西体育场,社团活动室"],
  ["node36", "西区学生活动中心三楼", "西活335，西活三楼"],
  ["node37", "西区天鹅湖", "西区1958,西区湖边,天鹅湖畔"],
  ["node38", "西区北门", "西区北入口"],

  ["node41", "西区东食堂", "芳华餐厅,西苑餐厅"],
  ["node42", "西区大路口", "西区图书馆,西区巴士站"],

  ["node44", "西区严济慈广场", "第三教学楼A栋,第三教学楼B栋"],
  
  ["node45", "第一教学楼", "东区一教,一教南门,2xxx"],
  ["node46", "第二教学楼", "东区二教,2xxx"],
  ["node48", "东区西门", ""],
  ["node49", "东区隧道口", "东区巴士站,东区地下通道口"],
  ["node50", "郭永怀像", "中区宿舍北侧"],
];

// 构建查找表
const NODE_MAP = {};
const ALIAS_MAP = {};



NODES.forEach(([id, name, aliasesStr]) => {
  NODE_MAP[id] = { name };
  
  // 主名称
  ALIAS_MAP[name] = id;
  
  // 别名
  if (aliasesStr) {
    aliasesStr.split(',').forEach(alias => {
      if (alias.trim()) ALIAS_MAP[alias.trim()] = id;
    });
  }
});

// 生成节点列表字符串（用于提示词）
function generateNodeList() {
  return NODES.map(([id, name]) => `${id}(${name})`).join(' ');
}
function getRealName(id) {

  for (let i = 0; i < NODES.length; i++) {
    const node = NODES[i];
    if (node && node.length >= 2) {
      const nodeId = node[0];
      const nodeName = node[1];
      if (nodeId === id) {
        return nodeName;
      }
    }
  }
  console.warn(`getRealName: No node found with id "${id}"`);
  return null;
}

// 使用示例：
// const name = getRealName(1); // 返回 id=1 的节点名称
// const name = getRealName("2"); // 也会尝试转换为数字再查找
module.exports = { NODES, NODE_MAP, ALIAS_MAP, generateNodeList,getRealName };