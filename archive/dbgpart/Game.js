// GameSystem.js
export class GameSystem {
  constructor() {
    this.cardRegistry = new CardRegistry();
    this.players = [];
    // 其他初始化...
  }

  /**
   * 初始化游戏卡牌
   */
  initCards(cardDefinitions) {
    this.cardRegistry.registerAll(cardDefinitions);
  }

  /**
   * 玩家使用卡牌
   */
  playCard(playerId, cardId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error("玩家不存在");
    
    const card = this.cardRegistry.get(cardId);
    
    // 执行卡牌效果
    card.play(this, player);
    
    // 处理卡牌使用后的逻辑
    if (!card.keep) {
      player.discardCard(cardId);
    }
    
    // 其他游戏逻辑...
  }
}

// 使用示例
import { GameSystem } from './GameSystem';
import { cardDefinitions } from './cards';

const game = new GameSystem();
game.initCards(cardDefinitions);

// 添加玩家等初始化操作...
game.playCard("player1", "+1s");