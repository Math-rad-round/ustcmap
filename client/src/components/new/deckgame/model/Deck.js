// Deck: 轻量牌堆实现，负责洗牌、抽牌和重置
export default class Deck {
  constructor(cards = []) {
    // _original 保存初始卡组以便重置
    this._original = cards.slice();
    // cards 为当前可抽取的队列（使用 shift/pop）
    this.cards = cards.slice();
  }

  // 原地 Fisher–Yates 洗牌
  shuffle() {
    const a = this.cards;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  // 抽 n 张牌（从队列头部 shift）
  draw(n = 1) {
    const result = [];
    for (let i = 0; i < n; i++) {
      if (this.cards.length === 0) break;
      result.push(this.cards.shift());
    }
    return result;
  }

  // 重置牌堆到初始顺序（不自动洗牌）
  reset() {
    this.cards = this._original.slice();
  }

  // 剩余卡数
  remaining() {
    return this.cards.length;
  }
}
