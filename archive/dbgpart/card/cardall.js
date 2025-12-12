// CardRegistry.js
export class CardRegistry {
  constructor() {
    this._cards = new Map(); // 存储所有卡牌
    this._categories = new Set(); // 卡牌分类
  }

  /**
   * 注册单张卡牌
   * @param {string} id - 卡牌唯一ID
   * @param {object} definition - 卡牌定义对象
   */
  register(id, definition) {
    // 验证必要字段
    if (!id || !definition.name || !definition.types) {
      throw new Error(`卡牌定义不完整: ${id}`);
    }

    // 设置默认值
    const card = {
      id,
      cost: definition.cost || 0,
      description: definition.description || '',
      play: definition.play || (() => {}),
      keep: definition.keep !== undefined ? definition.keep : true,
      action: definition.action || 0,
      upgradesreq: definition.upgradesreq || 0,
      removereq: definition.removereq || false,
      disreq: definition.disreq || false,
      canplay:definition.canplay|| (()=>{return true;}),
      void: definition.void || false,
      oneuse : definition.oneuse || false,
      autoupgrade: definition.autoupgrade || false,
      ...definition
    };

    // 添加到注册表
    this._cards.set(id, card);
    
    // 更新分类
    definition.types.forEach(type => this._categories.add(type));
    
    return this;
  }

  /**
   * 批量注册卡牌
   * @param {object} cardDefinitions - 卡牌定义对象
   */
  registerAll(cardDefinitions) {
    Object.entries(cardDefinitions).forEach(([id, definition]) => {
      this.register(id, definition);
    });
    return this;
  }

  /**
   * 获取卡牌定义
   * @param {string} id - 卡牌ID
   * @returns {object} 卡牌定义
   */
  getCard(id) {
    const card = this._cards.get(id);
    if (!card) throw new Error(`未知卡牌: ${id}`);
    return card;
  }
  findIdByName(name){
    for(const [id, card] of this._cards.entries()) {
      if (card.name === name) {
        return id;
      }
    }
  }
  /**
   * 获取所有卡牌
   * @returns {Map} 所有卡牌
   */
  getAll() {
    return this._cards;
  }

  /**
   * 按类型获取卡牌
   * @param {string} type - 卡牌类型
   * @returns {array} 该类型卡牌数组
   */
  getByType(type) {
    return Array.from(this._cards.values()).filter(card => 
      card.types.includes(type)
    );
  }

  /**
   * 获取所有分类
   * @returns {Set} 所有卡牌分类
   */
  getCategories() {
    return this._categories;
  }
}