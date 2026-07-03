// GameState: 保存当前游戏的可序列化状态（仅数据，不包含 UI 或逻辑）
// 设计原则：React 只读这个对象并渲染；所有对状态的修改由 GameEngine 完成。
export default class GameState {
  constructor() {
    // `deck` 保存 Deck 实例（包含剩余卡牌）
    this.deck = null;
    // `hand` 当前抽到的牌数组（每项为 courses.json 中的简单对象）
    this.hand = [];
    // `counts` 统计当前手牌中各类知识符号数量（用于考试结算）
    this.counts = { Theory: 0, Practice: 0, Social: 0 };
    // `score` 本次考试计算得到的分数（MVP 规则：Theory × Practice）
    this.score = 0;
  }
}
