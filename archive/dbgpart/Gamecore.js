// GameSystem.js
export class GameSystem {
  constructor() {
    this.selects = new CardSelectionSystem();
    this.cardRegistry = new CardRegistry();
    this.players = [];
  }
  initCards(cardDefinitions) {
    this.cardRegistry.registerAll(cardDefinitions);
  }
  async promptCardSelection(options) {
      const {
        source = 'hand',       // 从哪里选择(hand/deck/discard)
        maxSelect = 1,         // 最多选择几张
        filter = null,         // 卡牌过滤器
        message = '请选择卡牌' // 提示信息
      } = options;

      this.showMessage(message);
      
      return new Promise(resolve => {
        this.selections.startSelection({
          maxSelect,
          filter,
          onComplete: resolve
        });
      });
    }
}
