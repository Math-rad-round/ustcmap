import GameState from './GameState';
import Deck from '../model/Deck';

// GameEngine: 解释命令并修改 GameState 的唯一组件（Command Driven）
// 重要：Engine 只在接收到命令时运行一次并返回新的 GameState，
// 浏览器仍为单线程，Engine 不是后台线程。
export default class GameEngine {
  /**
   * @param {object} data - 包含 courses 的数据对象（例如从 JSON 导入）
   */
  constructor(data) {
    this.data = data || { courses: [] };
    this.state = new GameState();
    const cards = this._buildCardsFromData();
    // 将 Deck 实例放入 state（Deck 管理剩余牌堆）
    this.state.deck = new Deck(cards);
  }

  // 将 data.courses 转换为内部卡牌对象数组并添加 `_id` 字段
  _buildCardsFromData() {
    const arr = this.data.courses || [];
    return arr.map((c, i) => ({ ...c, _id: c.id || `c${i}` }));
  }

  /**
   * 执行命令（Command Driven API）
   * 支持的命令示例：
   * - { type: 'START_EXAM', draw: 5 }
   * 返回：当前的 GameState（引用）
   */
  execute(command = {}) {
    if (!command || !command.type) return this.state;
    switch (command.type) {
      case 'START_EXAM': {
        const draw = command.draw || 5;
        // 洗牌、抽牌到 hand、重新计算统计与分数
        this.state.deck.shuffle();
        this.state.hand = this.state.deck.draw(draw);
        this._recalculate();
        return this.state;
      }
      default:
        // 未知命令不改变 state
        return this.state;
    }
  }

  // 根据当前手牌计算 counts 和 score（MVP 逻辑）
  _recalculate() {
    const hand = this.state.hand || [];
    const counts = { Theory: 0, Practice: 0, Social: 0 };
    hand.forEach((c) => {
      if (c.type && counts.hasOwnProperty(c.type)) counts[c.type]++;
    });
    this.state.counts = counts;
    // MVP scoring: Score = Theory × Practice
    this.state.score = counts.Theory * counts.Practice;
  }

  // 返回当前 GameState（用于 UI 读取）
  getState() {
    return this.state;
  }
}
