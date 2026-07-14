// Card: 最小化的卡牌数据结构（MVP 使用简单对象即可）
// 注意：当前 Engine 直接使用 courses.json 中的 POJO，不必须实例化 Card。
export default class Card {
  constructor({ id, name, type }) {
    this.id = id;
    this.name = name;
    // type 表示知识符号：'Theory' | 'Practice' | 'Social'
    this.type = type;
  }
}
