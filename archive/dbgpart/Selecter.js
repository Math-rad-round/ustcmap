class CardSelectionSystem {
  constructor() {
    this.selectedCards = new Set(); // 存储被选中的卡牌ID/索引
    this.selectionMode = false;     // 是否处于选择模式
    this.maxSelection = 1;         // 默认最多选择1张
    this.onComplete = null;        // 选择完成回调
  }
  startSelection({ maxSelect = 1, filter = null, onComplete }) {
    this.selectionMode = true;
    this.maxSelection = maxSelect;
    this.filter = filter;
    this.onComplete = onComplete;
    this.selectedCards.clear();
  }
  toggleSelect(cardId) {
    if (!this.selectionMode) return;
    if (this.filter && !this.filter(cardId)) return;

    if (this.selectedCards.has(cardId)) {
      this.selectedCards.delete(cardId);
    } else {
      if (this.selectedCards.size >= this.maxSelection) return;
      this.selectedCards.add(cardId);
    }
    this.updateUI();
    
    // 自动完成选择
    if (this.selectedCards.size === this.maxSelection) {
      this.completeSelection();
    }
  }

  // 完成选择
  completeSelection() {
    if (!this.selectionMode) return;
    
    const result = Array.from(this.selectedCards);
    this.selectionMode = false;
    this.selectedCards.clear();
    this.updateUI();
    
    if (this.onComplete) {
      this.onComplete(result);
    }
  }
  cancelSelection() {
    this.selectionMode = false;
    this.selectedCards.clear();
    this.updateUI();
  }
}