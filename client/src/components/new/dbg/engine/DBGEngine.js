import DBGState from './DBGState';

const TURN_RESOURCES = ['download', 'block', 'mobility', 'counter'];
const ALL_RESOURCES = [...TURN_RESOURCES, 'upload'];
const FALLBACK_DIFFICULTY = 'harsh';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function unique(list) {
  return Array.from(new Set((list || []).filter(Boolean)));
}

function addGain(target = {}, gain = {}, multiplier = 1) {
  const result = { ...target };
  Object.keys(gain || {}).forEach((key) => {
    const amount = Number(gain[key]) || 0;
    result[key] = (Number(result[key]) || 0) + amount * multiplier;
  });
  return result;
}

function mergeConfig(base = {}, overrides = {}) {
  const result = { ...clone(base), ...clone(overrides) };
  if (base.markets || overrides.markets) {
    result.markets = {
      ...clone(base.markets || {}),
      ...clone(overrides.markets || {}),
    };
    if (base.markets?.up || overrides.markets?.up) {
      result.markets.up = {
        ...clone(base.markets?.up || {}),
        ...clone(overrides.markets?.up || {}),
      };
    }
    if (base.markets?.basic || overrides.markets?.basic) {
      result.markets.basic = {
        ...clone(base.markets?.basic || {}),
        ...clone(overrides.markets?.basic || {}),
      };
    }
  }
  if (result.markets?.up && result.upMarketSize) result.markets.up.size = result.upMarketSize;
  return result;
}

export default class DBGEngine {
  constructor(data = {}) {
    this.data = data;
    this.requestedDifficulty = data.difficulty;
    this.instanceCounter = 0;
    this.reset();
  }

  reset() {
    this.state = new DBGState();
    this.choiceCounter = 0;
    this.baseConfig = this.data.config || {};
    this.difficultyId = this._resolveDifficultyId(this.requestedDifficulty || this.baseConfig.defaultDifficulty);
    this.difficultyConfig = this._getDifficultyConfig(this.difficultyId);
    this.config = this._buildEffectiveConfig(this.difficultyConfig);
    this.startCards = this.data.startCards || [];
    this.basicCards = this.data.basicCards || [];
    this.upCards = this.data.upCards || [];
    this.statusCards = this.data.statusCards || [];
    this.attackCards = this._filterAttackCards(this.data.attackCards || []);
    this.characterCards = this.data.characterCards || [];
    this.definitions = {};

    [...this.startCards, ...this.basicCards, ...this.upCards, ...this.statusCards].forEach((card) => {
      this.definitions[card.id] = clone(card);
    });

    this.state.config = clone(this.config);
    this.state.difficulty = this._difficultySummary();
    this.state.characters = clone(this.characterCards);
    this.state.uploadTarget = Number(this.config.scoreTarget) || 64;
    this.state.baseArmor = Number(this.config.baseArmor) || 12;
    this.state.armor = this.state.baseArmor;
    this.state.decayPerArmorLoss = Number(this.config.decayPerArmorLoss) || 4;
    this.state.lifeLimit = Number(this.config.lifeLimit) || 4;
    this.state.skipAttackTurns = this._difficultyTurns('skipAttackTurns');
    this.state.skipDecayTurns = this._difficultyTurns('skipDecayTurns');
    this.state.phase = 'setup';
    this._log('选择一个角色开始上传作战。');
    this._refreshDerived();
    return this.getState();
  }

  _resolveDifficultyId(id) {
    const difficulties = this.baseConfig?.difficulties || {};
    if (id && difficulties[id]) return id;
    if (this.baseConfig?.defaultDifficulty && difficulties[this.baseConfig.defaultDifficulty]) {
      return this.baseConfig.defaultDifficulty;
    }
    if (difficulties[FALLBACK_DIFFICULTY]) return FALLBACK_DIFFICULTY;
    return Object.keys(difficulties)[0] || FALLBACK_DIFFICULTY;
  }

  _getDifficultyConfig(id) {
    return clone(this.baseConfig?.difficulties?.[id] || { id, name: id, overrides: {} });
  }

  _buildEffectiveConfig(difficulty = this.difficultyConfig) {
    return mergeConfig(this.baseConfig, difficulty.overrides || {});
  }

  _difficultySummary() {
    return {
      id: this.difficultyId,
      name: this.difficultyConfig.name || this.difficultyId,
      description: this.difficultyConfig.description || '',
    };
  }

  _difficultyTurns(key) {
    return [...(this.difficultyConfig[key] || [])].map((turn) => Number(turn) || 0).filter((turn) => turn > 0);
  }

  _filterAttackCards(cards = []) {
    const allowed = new Set(this.difficultyConfig.attackDifficulties || [this.difficultyId]);
    return cards.filter((card) => {
      if (!card.difficulties || card.difficulties.length === 0) return true;
      return card.difficulties.some((difficulty) => allowed.has(difficulty));
    });
  }

  execute(command = {}) {
    if (!command || !command.type) return this.getState();
    if (command.type === 'RESET_GAME') return this.reset();

    if (command.type === 'TUTORIAL_SETUP') {
      this._tutorialSetup(command.setup || {});
      return this.getState();
    }

    if (command.type === 'RESOLVE_CHOICE') {
      this._resolveChoice(command.choiceId, command.selected || [], command.accepted !== false);
      return this.getState();
    }

    if (command.type === 'SELECT_CHARACTER') {
      this._selectCharacter(command.characterId);
      return this.getState();
    }

    if (this.state.gameOver || this.state.phase !== 'action') return this.getState();
    if (this.state.pendingChoice) {
      this._log('请先完成当前选择。');
      return this.getState();
    }

    switch (command.type) {
      case 'PLAY_CARD':
        this._playCard(Number(command.handIndex), command.modeId);
        break;
      case 'PLAY_ALL':
        this._playAll();
        break;
      case 'DISCARD_FOR_BLOCK':
        this._discardForBlock(Number(command.handIndex));
        break;
      case 'BUY_CARD':
        this._buyCard(command.marketType || 'up', Number(command.index));
        break;
      case 'USE_CHARACTER_ABILITY':
        this._useCharacterAbility(Number(command.abilityIndex), command.optionId);
        break;
      case 'CONVERT_RESOURCE':
        this._useConversion(Number(command.index));
        break;
      case 'END_TURN':
        this._endTurn();
        break;
      default:
        break;
    }

    return this.getState();
  }

  getState() {
    this._refreshDerived();
    return this.state;
  }

  getCardFace(card = {}, modeId = null) {
    return this._selectFace(card, modeId);
  }

  getPlayableModes(card = {}) {
    return this._buildFace(card).modes || [];
  }

  exportSnapshot() {
    return {
      version: 1,
      state: clone(this.state),
      instanceCounter: this.instanceCounter,
      choiceCounter: this.choiceCounter,
    };
  }

  importSnapshot(snapshot = {}) {
    const source = snapshot.state || snapshot;
    const nextState = new DBGState();
    Object.keys(source || {}).forEach((key) => {
      nextState[key] = clone(source[key]);
    });
    this.difficultyId = this._resolveDifficultyId(nextState.difficulty?.id || nextState.difficultyId || this.difficultyId);
    this.requestedDifficulty = this.difficultyId;
    this.difficultyConfig = this._getDifficultyConfig(this.difficultyId);
    this.config = nextState.config && Object.keys(nextState.config).length
      ? clone(nextState.config)
      : this._buildEffectiveConfig(this.difficultyConfig);
    this.attackCards = this._filterAttackCards(this.data.attackCards || []);
    nextState.config = clone(this.config);
    nextState.difficulty = nextState.difficulty || this._difficultySummary();
    this.state = nextState;
    this.choiceCounter = Number(snapshot.choiceCounter) || this._scanMaxChoiceCounter(nextState);
    this.instanceCounter = Math.max(
      Number(snapshot.instanceCounter) || 0,
      this._scanMaxInstanceCounter(nextState),
    );
    this._refreshDerived();
    return this.getState();
  }

  canPlayCard(handIndex, modeId = null) {
    const card = this.state.hand[handIndex];
    if (this.state.pendingChoice) return false;
    return this._canPlayCard(card, modeId);
  }

  canDiscardForBlock(handIndex) {
    const card = this.state.hand[handIndex];
    if (this.state.pendingChoice) return false;
    return Boolean(card && card.canDiscardForBlock !== false);
  }

  canBuy(marketType, index) {
    const market = marketType === 'basic' ? this.state.basicMarket : this.state.upMarket;
    const card = market[index];
    if (this.state.pendingChoice) return false;
    return Boolean(card && this.state.download >= (Number(card.cost) || 0));
  }

  _tutorialSetup(setup = {}) {
    const requestedDifficulty = setup.difficulty || this.difficultyId;
    if (requestedDifficulty && requestedDifficulty !== this.difficultyId) {
      this.requestedDifficulty = requestedDifficulty;
      this.reset();
    } else if (setup.reset) {
      this.reset();
    }

    if (setup.characterId) {
      if (this.state.phase === 'setup' || setup.reset !== false) {
        this._selectCharacter(setup.characterId);
      } else {
        const character = this.characterCards.find((item) => item.id === setup.characterId);
        if (character) this.state.selectedCharacter = clone(character);
      }
    } else if (setup.phase) {
      this.state.phase = setup.phase;
    }

    this._applyTutorialScalars(setup);
    this._applyTutorialResources(setup.resources || {});
    this._applyTutorialZones(setup.zones || {});

    if (Object.prototype.hasOwnProperty.call(setup, 'basicMarket')) {
      this.state.basicMarket = this._instantiateTutorialCards(setup.basicMarket, { allowNull: false });
    }
    if (Object.prototype.hasOwnProperty.call(setup, 'upMarket')) {
      this.state.upMarket = this._instantiateTutorialCards(setup.upMarket, { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(setup, 'upDeck')) {
      this.state.upDeck = this._instantiateTutorialCards(setup.upDeck, { allowNull: false });
    }
    if (Object.prototype.hasOwnProperty.call(setup, 'upDiscard')) {
      this.state.upDiscard = this._instantiateTutorialCards(setup.upDiscard, { allowNull: false });
    }
    if (Object.prototype.hasOwnProperty.call(setup, 'currentAttack')) {
      this.state.currentAttack = setup.currentAttack ? this._instantiateAttack(setup.currentAttack) : null;
    }
    if (Object.prototype.hasOwnProperty.call(setup, 'attackDeck')) {
      this.state.attackDeck = this._instantiateTutorialAttacks(setup.attackDeck);
    }
    if (Object.prototype.hasOwnProperty.call(setup, 'attackDiscard')) {
      this.state.attackDiscard = this._instantiateTutorialAttacks(setup.attackDiscard);
    }

    if (Array.isArray(setup.skipAttackTurns)) this.state.skipAttackTurns = setup.skipAttackTurns.map((turn) => Number(turn) || 0).filter(Boolean);
    if (Array.isArray(setup.skipDecayTurns)) this.state.skipDecayTurns = setup.skipDecayTurns.map((turn) => Number(turn) || 0).filter(Boolean);
    if (setup.characterAbilityUsed) this.state.characterAbilityUsed = clone(setup.characterAbilityUsed);
    if (Array.isArray(setup.availableConversions)) this.state.availableConversions = clone(setup.availableConversions);
    if (Array.isArray(setup.log)) {
      this.state.log = [];
      setup.log.forEach((text) => this._log(text));
    } else if (setup.message) {
      this._log(setup.message);
    }

    this.state.pendingChoice = null;
    this.state.pendingChoiceQueue = [];
    this._refreshDerived();
    this._checkGameEnd();
  }

  _applyTutorialScalars(setup = {}) {
    [
      'turn',
      'armor',
      'baseArmor',
      'decay',
      'decayPerArmorLoss',
      'lifeLoss',
      'lifeLimit',
      'upload',
      'uploadThisTurn',
      'uploadTarget',
      'download',
      'block',
      'mobility',
      'counter',
      'cardsBoughtThisTurn',
      'cardsPlayedThisTurn',
      'supplyCharges',
      'retainHandSlots',
      'returnPlayedToTop',
      'ratingPenalty',
      'ratingBonus',
    ].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(setup, field)) {
        this.state[field] = Number(setup[field]) || 0;
      }
    });

    [
      'uploadLocked',
      'upMarketBoughtThisTurn',
      'fullPowerLocked',
      'fullPowerUsedThisTurn',
      'skipAttackThisTurn',
      'holdSkippedAttackThisTurn',
      'gameOver',
    ].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(setup, field)) {
        this.state[field] = Boolean(setup[field]);
      }
    });

    if (setup.phase) this.state.phase = setup.phase;
    if (Object.prototype.hasOwnProperty.call(setup, 'result')) this.state.result = setup.result;
    if (Object.prototype.hasOwnProperty.call(setup, 'message')) this.state.message = setup.message || '';
  }

  _applyTutorialResources(resources = {}) {
    ALL_RESOURCES.forEach((resource) => {
      if (Object.prototype.hasOwnProperty.call(resources, resource)) {
        this.state[resource] = Number(resources[resource]) || 0;
      }
    });
  }

  _applyTutorialZones(zones = {}) {
    [
      'drawPile',
      'discardPile',
      'hand',
      'playArea',
      'retainedArea',
      'exilePile',
      'initialHandQueue',
    ].forEach((zone) => {
      if (Object.prototype.hasOwnProperty.call(zones, zone)) {
        this.state[zone] = this._instantiateTutorialCards(zones[zone], { allowNull: false });
      }
    });
  }

  _instantiateTutorialCards(list = [], options = {}) {
    return (list || []).flatMap((spec) => {
      if (!spec && options.allowNull) return [null];
      if (!spec) return [];
      const id = typeof spec === 'string' ? spec : spec.id;
      const count = typeof spec === 'string' ? 1 : Number(spec.count || spec.amount) || 1;
      const upgraded = typeof spec === 'string' ? false : Boolean(spec.upgraded);
      return Array.from({ length: count }, () => this._instantiateCard(id, { upgraded })).filter(Boolean);
    });
  }

  _instantiateTutorialAttacks(list = []) {
    return (list || []).flatMap((spec) => {
      if (!spec) return [];
      const count = typeof spec === 'string' ? 1 : Number(spec.count || spec.amount) || 1;
      return Array.from({ length: count }, () => this._instantiateAttack(spec)).filter(Boolean);
    });
  }

  _findAttackDefinition(attack) {
    const id = typeof attack === 'string' ? attack : attack?.id;
    return (this.data.attackCards || []).find((item) => item.id === id) || (this.attackCards || []).find((item) => item.id === id) || null;
  }

  _instantiateAttack(attack) {
    const definition = typeof attack === 'string'
      ? this._findAttackDefinition(attack)
      : { ...clone(this._findAttackDefinition(attack) || {}), ...clone(attack) };
    if (!definition) return null;
    return {
      ...clone(definition),
      _instanceId: `${definition.id || 'attack'}_${this.instanceCounter++}`,
    };
  }

  _selectCharacter(characterId) {
    if (this.state.phase !== 'setup') return;
    const character = this.characterCards.find((item) => item.id === characterId) || this.characterCards[0];
    if (!character) return;

    this.state.selectedCharacter = clone(character);
    this.state.basicMarket = this._expandCards(this.basicCards);
    this.state.drawPile = this._expandCards(this.startCards);
    this.state.upDeck = this._shuffle(this._expandCards(this.upCards));
    this.state.attackDeck = this._shuffle(this._expandAttacks(this.attackCards));
    this.state.phase = 'action';

    this._applyCharacterSetup(this.state.selectedCharacter);
    this._applyCharacterPassives(this.state.selectedCharacter);
    this.state.drawPile = this._shuffle(this.state.drawPile);
    this._refillUpMarket();
    this._log(`角色已选择：${this.state.selectedCharacter.name}。`);
    this._startTurn('上传作战开始。');
  }

  _applyCharacterSetup(character = {}) {
    (character.setup || []).forEach((effect) => {
      switch (effect.type) {
        case 'addCard':
          this._setupAddCard(effect);
          break;
        case 'removeCard':
          this._removeCardFromZone(effect.zone, effect.cardId, effect.amount || 1);
          break;
        case 'removeCardFromBasicMarket':
          this.state.basicMarket = this.state.basicMarket.filter((card) => card.id !== effect.cardId);
          break;
        case 'addDecay':
          this._addDecay(effect.amount || 1, '角色起始衰退', true);
          break;
        case 'setLifeLoss':
          this.state.lifeLoss = Number(effect.amount) || 0;
          break;
        case 'setArmor':
          this.state.armor = Number(effect.amount) || this.state.armor;
          this.state.baseArmor = this.state.armor;
          break;
        case 'skipThreatAttackOnTurn':
          this.state.skipAttackTurns.push(Number(effect.turn) || 1);
          break;
        case 'skipDecayOnTurn':
          this.state.skipDecayTurns.push(Number(effect.turn) || 1);
          break;
        default:
          break;
      }
    });
  }

  _applyCharacterPassives(character = {}) {
    (character.passives || []).forEach((passive) => {
      if (passive.type === 'setDecayPerArmorLoss') {
        this.state.decayPerArmorLoss = Number(passive.amount) || this.state.decayPerArmorLoss;
      }
    });
  }

  _setupAddCard(effect = {}) {
    const amount = Number(effect.amount) || 1;
    for (let i = 0; i < amount; i += 1) {
      const card = this._instantiateCard(effect.cardId);
      if (!card) continue;
      if (effect.zone === 'discardPile' || effect.zone === 'discard') {
        this.state.discardPile.push(card);
      } else if (effect.zone === 'initialHand') {
        this.state.initialHandQueue.push(card);
      } else {
        this.state.drawPile.push(card);
      }
    }
  }

  _startTurn(message = '') {
    this.state.turn += 1;
    this.state.phase = 'action';
    this.state.download = 0;
    this.state.block = 0;
    this.state.mobility = 0;
    this.state.counter = 0;
    this.state.uploadThisTurn = 0;
    this.state.uploadLocked = false;
    this.state.uploadMultiplier = Number(this.state.nextTurnUploadMultiplier) || 1;
    this.state.nextTurnUploadMultiplier = 1;
    this.state.cardsBoughtThisTurn = 0;
    this.state.cardsPlayedThisTurn = 0;
    this.state.upMarketBoughtThisTurn = false;
    this.state.fullPowerLocked = false;
    this.state.fullPowerUsedThisTurn = false;
    this.state.supplyCharges = 0;
    this.state.availableConversions = [];
    this.state.returnPlayedToTop = 0;
    this.state.skipAttackThisTurn = false;
    this.state.holdSkippedAttackThisTurn = false;
    this.state.characterAbilityUsed = {};
    this.state.retainHandSlots = this._getPassiveAmount('retainHandCardEachTurn');

    this._gainResources(this.state.nextTurnGain, '下回合效果');
    this.state.nextTurnGain = {};
    this._applyNextTurnLoss();

    if (!this.state.skipDecayTurns.includes(this.state.turn)) {
      this._addDecay(1, '回合衰退');
    } else {
      this._log('本回合没有衰退。');
    }

    if (this.state.currentAttack) {
      this._log(`威胁持续：${this.state.currentAttack.name}。`);
    } else if (!this.state.skipAttackTurns.includes(this.state.turn)) {
      this._revealAttack();
    } else {
      this.state.currentAttack = null;
      this.state.attackValue = null;
      this._log('本回合没有攻击。');
    }

    const handDraw = (Number(this.config.handDraw) || 5) + this._getPassiveAmount('extraHandDrawEachTurn');
    this._drawCards(handDraw);
    if (this.state.turn === 1 && this.state.initialHandQueue.length > 0) {
      this.state.hand.push(...this.state.initialHandQueue);
      this.state.initialHandQueue = [];
      this._log('角色起始手牌已加入。');
    }

    this._log(message || `第 ${this.state.turn} 回合开始，抽取 ${handDraw} 张牌。`);
    this._checkGameEnd();
  }

  _playCard(handIndex, modeId = null) {
    const card = this.state.hand[handIndex];
    if (!this._canPlayCard(card, modeId)) return;

    const face = this._selectFace(card, modeId);
    this._payRequiredEffects(face.effects || []);
    this.state.hand.splice(handIndex, 1);
    this.state.playArea.push(card);
    this.state.cardsPlayedThisTurn += 1;
    this.state.stats.cardsPlayed += 1;

    this._resolvePreGainEffects(face.effects || [], { card, from: 'play' });
    this._gainResources(face.gain || {}, card.name);
    this._resolveEffects(face.effects || [], { card, from: 'play' });
    this._applyKeywords(face.keywords || [], card);

    const modeText = face.selectedMode ? `（${face.selectedMode.name}）` : '';
    this._log(`${card.name}${card.upgraded ? ' [升级]' : ''}${modeText} 已打出。`);
    this._checkGameEnd();
  }

  _playAll() {
    let guard = 0;
    while (guard < 50 && !this.state.gameOver && !this.state.pendingChoice) {
      const index = this.state.hand.findIndex((card) => this._canAutoPlayCard(card, false));
      if (index < 0) break;
      this._playCard(index);
      guard += 1;
    }
    while (!this.state.gameOver && !this.state.pendingChoice) {
      const woundIndex = this.state.hand.findIndex((card, index) => card.id === 'status_wound' && this.canDiscardForBlock(index));
      if (woundIndex < 0) break;
      this._discardForBlock(woundIndex);
    }

    const playableCards = this.state.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => this._canPlayAnyCard(card));
    const fullPowerPlayable = playableCards.filter(({ card }) => this._allPlayableFacesHaveKeyword(card, 'fullPower'));
    const nonFullPowerPlayable = playableCards.filter(({ card }) => !this._allPlayableFacesHaveKeyword(card, 'fullPower'));
    if (fullPowerPlayable.length === 1 && nonFullPowerPlayable.length === 0 && this.getPlayableModes(fullPowerPlayable[0].card).length === 0) {
      this._playCard(fullPowerPlayable[0].index);
    }
  }

  _discardForBlock(handIndex) {
    const card = this.state.hand[handIndex];
    if (!this.canDiscardForBlock(handIndex)) return;
    this.state.hand.splice(handIndex, 1);
    this.state.discardPile.push(card);
    this.state.block += Number(this.config.defaultDiscardForBlock) || 1;
    this.state.stats.cardsDiscardedForBlock += 1;
    this._log(`弃置 ${card.name}，获得 1 防护。`);
  }

  _buyCard(marketType, index) {
    const market = marketType === 'basic' ? this.state.basicMarket : this.state.upMarket;
    const card = market[index];
    if (!card) return;
    const cost = Number(card.cost) || 0;
    if (this.state.download < cost) {
      this._log(`下载不足，无法购买 ${card.name}。`);
      return;
    }

    this.state.download -= cost;
    if (marketType === 'up') {
      this._emptyUpMarketSlot(index);
    } else {
      market.splice(index, 1);
    }

    const upgraded = this.state.cardsBoughtThisTurn === 0 && this.state.firstBuyUpgraded;
    const toTop = this.state.cardsBoughtThisTurn === 0 && this.state.firstBuyToTop;
    const gained = this._instantiateCard(card.id, { upgraded });
    if (toTop) {
      this.state.drawPile.unshift(gained);
      this._log(`购买 ${card.name}，放到牌堆顶${upgraded ? '并升级' : ''}。`);
    } else {
      this.state.discardPile.push(gained);
      this._log(`购买 ${card.name}，加入弃牌堆${upgraded ? '并升级' : ''}。`);
    }

    this.state.cardsBoughtThisTurn += 1;
    this.state.stats.cardsBought += 1;
    if (this.state.cardsBoughtThisTurn === 1) {
      this.state.firstBuyUpgraded = false;
      this.state.firstBuyToTop = false;
    }
  }

  _useCharacterAbility(abilityIndex, optionId = null) {
    const ability = (this.state.selectedCharacter?.abilities || [])[abilityIndex];
    if (!ability) return;
    if (ability.oncePerTurn && this.state.characterAbilityUsed[ability.id]) return;
    if (ability.blockedByFullPower && this.state.fullPowerLocked) {
      this._log('全力状态下不能使用该角色能力。');
      return;
    }

    const option = this._selectAbilityOption(ability, optionId);
    if (!option) return;
    if (!this._canPayCosts(option.cost || [])) {
      this._log(`${ability.name} 的费用不足。`);
      return;
    }

    const discardAmount = (option.cost || [])
      .filter((cost) => cost.type === 'discardFromHand')
      .reduce((sum, cost) => sum + (Number(cost.amount) || 1), 0);
    if (discardAmount > 0) {
      this._payCosts((option.cost || []).filter((cost) => cost.type !== 'discardFromHand'));
      this._queueDiscardChoice({
        title: '选择要弃置的费用牌',
        prompt: `${ability.name} 需要弃置 ${discardAmount} 张手牌。`,
        min: Math.min(discardAmount, this.state.hand.length),
        max: Math.min(discardAmount, this.state.hand.length),
        optional: false,
        source: ability.name,
        payload: {
          effect: 'discardCostThenAbility',
          abilityIndex,
          optionId,
        },
      });
      return;
    }

    this._resolveAbilityOption(abilityIndex, optionId);
  }

  _resolveAbilityOption(abilityIndex, optionId = null, options = {}) {
    const ability = (this.state.selectedCharacter?.abilities || [])[abilityIndex];
    if (!ability) return;
    if (ability.oncePerTurn && this.state.characterAbilityUsed[ability.id]) return;
    const option = this._selectAbilityOption(ability, optionId);
    if (!option) return;

    if (!options.costsPaid) {
      if (!this._canPayCosts(option.cost || [])) {
        this._log(`${ability.name} 的费用不足。`);
        return;
      }
      this._payCosts(option.cost || []);
    }

    this._gainResources(option.gain || {}, ability.name);
    this._resolveEffects(option.effects || [], { from: 'ability' });
    this._applyKeywords([...(ability.keywords || []), ...(option.keywords || [])], null);
    if (ability.oncePerTurn) this.state.characterAbilityUsed[ability.id] = true;
    this._log(`使用角色能力：${ability.name}${option.name && option.name !== ability.name ? `（${option.name}）` : ''}。`);
    this._checkGameEnd();
  }

  _useConversion(index) {
    const conversion = this.state.availableConversions[index];
    if (!conversion) return;

    if (conversion.type === 'reduceArmorForGain') {
      if (!this._reduceArmor(conversion.armor, {
        cannotReduceBelowZeroAfterPermanentArmor: conversion.cannotReduceBelowZeroAfterPermanentArmor,
      })) return;
      this._gainResources(conversion.gain, conversion.label);
    } else {
      const cost = Number(conversion.rate) || 1;
      if ((Number(this.state[conversion.from]) || 0) < cost) return;
      this.state[conversion.from] -= cost;
      this.state[conversion.to] = (Number(this.state[conversion.to]) || 0) + 1;
    }

    if (conversion.remaining !== 'any') {
      conversion.remaining -= 1;
      if (conversion.remaining <= 0) this.state.availableConversions.splice(index, 1);
    }
  }

  _endTurn() {
    this._forceMandatoryAbilities();
    this._checkGameEnd();
    if (!this.state.gameOver) this._resolveAttack();
    this._cleanupTurn();
    this._checkGameEnd();
    if (!this.state.gameOver) {
      this._rotateUpMarket();
      this._startTurn();
    }
  }

  _forceMandatoryAbilities() {
    const abilities = this.state.selectedCharacter?.abilities || [];
    abilities.forEach((ability, index) => {
      if (!ability.mandatory || this.state.characterAbilityUsed[ability.id]) return;
      const payOption = (ability.options || []).find((option) => option.id === 'pay_download');
      const fallback = (ability.options || []).find((option) => option.id !== 'pay_download') || payOption;
      const option = payOption && this._canPayCosts(payOption.cost || []) ? payOption : fallback;
      this._useCharacterAbility(index, option?.id);
    });
  }

  _resolveAttack() {
    const attack = this.state.currentAttack;
    if (!attack) return;
    this.state.lastAttackFeedback = null;
    if (this.state.skipAttackThisTurn) {
      if (this.state.holdSkippedAttackThisTurn) {
        this._log(`${attack.name} 本回合静默，威胁保留到下回合。`);
      } else {
        this._log(`${attack.name} 被跳过。`);
        this.state.attackDiscard.push(attack);
        this.state.currentAttack = null;
      }
      return;
    }

    const cell = this._getAttackCell(attack);
    this.state.attackCell = cell;
    this.state.attackValue = cell ? cell.attack : null;

    if (cell && cell.attack !== null && cell.attack !== undefined) {
      const totalDefense = this._getTotalDefense();
      const excess = Math.max(0, Number(cell.attack) - totalDefense);
      const prevented = Math.min(Number(cell.attack), Math.max(0, totalDefense));
      this.state.stats.damagePrevented += prevented;
      this._log(`${attack.name} 攻击 ${cell.attack}，防护 ${totalDefense}，溢出 ${excess}。`);
      const overflow = this._applyAttackOverflow(excess);
      this.state.lastAttackFeedback = {
        id: `${attack._instanceId || attack.id || 'attack'}-${this.state.turn}-${this.state.stats.attacksResolved + 1}`,
        attackId: attack.id,
        attackName: attack.name,
        attackValue: Number(cell.attack) || 0,
        defense: totalDefense,
        excess,
        prevented,
        lifeLoss: overflow.lifeLoss,
        stun: overflow.stun,
      };
    } else {
      this._log(`${attack.name} 的攻击无效。`);
      this.state.lastAttackFeedback = {
        id: `${attack._instanceId || attack.id || 'attack'}-${this.state.turn}-${this.state.stats.attacksResolved + 1}`,
        attackId: attack.id,
        attackName: attack.name,
        attackValue: null,
        defense: this._getTotalDefense(),
        excess: 0,
        prevented: 0,
        lifeLoss: 0,
        stun: 0,
      };
    }

    const after = attack.afterAttack || {};
    this._resolveEffects(after.effects || [], { from: 'attack' });
    if (!cell?.cancelRedEffects) {
      this._resolveEffects(after.redEffects || [], { from: 'attack' });
    }

    this.state.attackDiscard.push(attack);
    this.state.currentAttack = null;
    this.state.stats.attacksResolved += 1;
  }

  _cleanupTurn() {
    const keepHand = [];
    let retainSlots = Number(this.state.retainHandSlots) || 0;

    this.state.hand.forEach((card) => {
      const cleanup = this._buildFace(card).cleanup || [];
      if (cleanup.some((effect) => effect.type === 'exileIfInHandAtEndTurn')) {
        this._exileCard(card, '回合结束移除');
      } else if (this._cardHasKeyword(card, 'retain')) {
        keepHand.push(card);
      } else if (retainSlots > 0 && card.type !== 'status') {
        keepHand.push(card);
        retainSlots -= 1;
      } else {
        this.state.discardPile.push(card);
      }
    });

    let topSlots = Number(this.state.returnPlayedToTop) || 0;
    this.state.playArea.forEach((card) => {
      if (card._trashed) {
        this._exileCard(card, '移除自身');
      } else if (card._returnToTop) {
        delete card._returnToTop;
        this.state.drawPile.unshift(card);
      } else if (topSlots > 0) {
        this.state.drawPile.unshift(card);
        topSlots -= 1;
      } else {
        this.state.discardPile.push(card);
      }
    });

    this.state.hand = keepHand;
    this.state.playArea = [];
    this.state.availableConversions = [];
  }

  _applyAttackOverflow(excess) {
    const lifeLoss = Math.floor(excess / 3);
    const remainder = excess % 3;
    if (remainder > 0) this._gainStatus('status_stun', remainder, 'discard');
    let appliedLifeLoss = 0;
    for (let i = 0; i < lifeLoss; i += 1) {
      this._applyLifeLoss();
      appliedLifeLoss += 1;
      if (this.state.gameOver) break;
    }
    return {
      lifeLoss: appliedLifeLoss,
      stun: remainder,
    };
  }

  _applyLifeLoss() {
    this.state.lifeLoss += 1;
    const current = this.state.lifeLoss;
    this._log(`生命损失 +1（当前 ${current}/${this.state.lifeLimit}）。`);

    if (current === 1) this._gainStatus('status_stun', 1, 'discard');
    if (current === 2) this._gainStatus('status_wound', 1, 'discard');
    if (current === 3) {
      if (this.state.preventRatingPenaltyAtLifeLoss === 3) {
        this._log('戒指庇护阻止了第 3 点生命损失的评分降低。');
        this.state.preventRatingPenaltyAtLifeLoss = null;
      } else {
        this.state.ratingPenalty += 1;
        this._log('第 3 点生命损失触发评分降低。');
        const losePassive = this._hasPassive('loseOnUnpreventedRatingPenaltyAtLifeLoss');
        if (losePassive) {
          this._setLose('戒指破碎，上传作战失败。');
        }
      }
    }

    if (this.state.lifeLoss >= this.state.lifeLimit) {
      this._setLose('生命损失达到上限，上传作战失败。');
    }
  }

  _buildFace(card = {}) {
    const base = this._normalizeFace(card.base || {});
    if (!card.upgraded || !card.upgrade) return base;

    const upgrade = this._normalizeFace(card.upgrade || {});
    const mode = card.upgrade.mode || 'add';
    if (mode === 'replace') return this._cleanFaceKeywords(this._applySelfEffectModifiers(upgrade));

    return this._cleanFaceKeywords(this._applySelfEffectModifiers({
      keywords: unique([...(base.keywords || []), ...(upgrade.keywords || [])]),
      gain: addGain(base.gain, upgrade.gain),
      modes: [...(base.modes || []), ...(upgrade.modes || [])],
      effects: [...(base.effects || []), ...(upgrade.effects || [])],
      cleanup: [...(base.cleanup || []), ...(upgrade.cleanup || [])],
    }));
  }

  _applySelfEffectModifiers(face = {}) {
    const modifiers = (face.effects || []).filter((effect) => effect.type === 'modifySelfEffect');
    if (modifiers.length === 0) return face;
    const applyModifiers = (effect) => {
      const modifier = modifiers.find((item) => item.targetType === effect.type);
      return modifier ? { ...effect, ...(modifier.changes || {}) } : effect;
    };
    return {
      ...face,
      effects: (face.effects || []).filter((effect) => effect.type !== 'modifySelfEffect').map(applyModifiers),
      modes: (face.modes || []).map((mode) => ({
        ...mode,
        effects: (mode.effects || []).map(applyModifiers),
      })),
    };
  }

  _selectFace(card = {}, modeId = null) {
    const face = this._buildFace(card);
    if (!face.modes || face.modes.length === 0) return face;

    const selectedMode = face.modes.find((mode) => mode.id === modeId) || face.modes[0];
    const modeGain = this._applyModeGainIncreases(selectedMode.gain || {}, face.effects || []);
    return this._cleanFaceKeywords({
      ...face,
      selectedMode,
      keywords: unique([...(face.keywords || []), ...(selectedMode.keywords || [])]),
      gain: addGain(face.gain, modeGain),
      effects: [
        ...(face.effects || []).filter((effect) => effect.type !== 'increaseChosenModeGain'),
        ...(selectedMode.effects || []),
      ],
    });
  }

  _normalizeFace(face = {}) {
    return {
      keywords: [...(face.keywords || [])],
      gain: { ...(face.gain || {}) },
      modes: clone(face.modes || []),
      effects: clone(face.effects || []),
      cleanup: clone(face.cleanup || []),
    };
  }

  _cleanFaceKeywords(face) {
    const keywords = unique(face.keywords || []);
    if (keywords.includes('removeFullPower')) {
      return {
        ...face,
        keywords: keywords.filter((keyword) => keyword !== 'fullPower' && keyword !== 'removeFullPower'),
      };
    }
    return { ...face, keywords };
  }

  _applyModeGainIncreases(gain = {}, effects = []) {
    let result = { ...gain };
    effects.forEach((effect) => {
      if (effect.type !== 'increaseChosenModeGain') return;
      (effect.resources || []).forEach((resource) => {
        if (Object.prototype.hasOwnProperty.call(result, resource)) {
          result[resource] = (Number(result[resource]) || 0) + (Number(effect.amount) || 0);
        }
      });
    });
    return result;
  }

  _canPlayCard(card, modeId = null) {
    if (!card || this.state.phase !== 'action' || this.state.gameOver) return false;
    if (card.type === 'status') return false;
    const face = this._selectFace(card, modeId);
    if ((this._buildFace(card).modes || []).length > 0 && modeId === null) return false;
    if (face.keywords.includes('fullPower') && this.state.fullPowerUsedThisTurn && this.state.supplyCharges <= 0 && !face.keywords.includes('supply')) return false;
    if (!this._requirementsMet(face.effects || [])) return false;
    return this._canPayRequiredEffects(face.effects || []);
  }

  _requirementsMet(effects = []) {
    return effects.every((effect) => {
      if (effect.type === 'requireLifeLossAtMost') {
        return this.state.lifeLoss <= (Number(effect.amount) || 0);
      }
      return true;
    });
  }

  _canPayRequiredEffects(effects = []) {
    return effects.every((effect) => {
      if (effect.type === 'payResource' && effect.required) {
        return this._hasResource(effect.resource, effect.amount);
      }
      return true;
    });
  }

  _payRequiredEffects(effects = []) {
    effects.forEach((effect) => {
      if (effect.type === 'payResource' && effect.required) {
        this._payResource(effect.resource, effect.amount);
      }
    });
  }

  _resolvePreGainEffects(effects = [], context = {}) {
    const armorReduction = effects
      .filter((effect) => effect.type === 'reduceSelfArmorLoss')
      .reduce((sum, effect) => sum + (Number(effect.amount) || 0), 0);

    effects.forEach((effect) => {
      if (effect.type === 'doubleCurrentBlock' && effect.beforeGain) {
        this.state.block *= 2;
        this._log('当前临时防护已翻倍。');
      }
      if (effect.type === 'reduceArmor') {
        this._reduceArmor(Math.max(0, (Number(effect.amount) || 0) - armorReduction));
      }
    });
  }

  _resolveEffects(effects = [], context = {}) {
    effects.forEach((effect) => {
      switch (effect.type) {
        case 'payResource':
        case 'requireLifeLossAtMost':
        case 'increaseChosenModeGain':
        case 'reduceSelfArmorLoss':
        case 'reduceArmor':
        case 'doubleCurrentBlock':
          break;
        case 'gainStatus':
          this._gainStatus(effect.cardId, effect.amount || 1, effect.to || 'discard');
          break;
        case 'draw':
          if (context.from === 'attack') {
            this.state.nextTurnGain = addGain(this.state.nextTurnGain, { draw: effect.amount || 1 });
          } else {
            this._drawCards(effect.amount || 1);
          }
          break;
        case 'addDecay':
          this._addDecay(effect.amount || 1, context.from === 'attack' ? '攻击后衰退' : '效果衰退');
          break;
        case 'upgradeSelf':
          this._upgradeCard(context.card, true);
          break;
        case 'downgradeSelf':
          if (context.card) context.card.upgraded = false;
          break;
        case 'trashSelf':
          if (context.card) context.card._trashed = true;
          break;
        case 'lockUploadGain':
          this._lockUpload(effect.resetExistingUploadThisTurn);
          break;
        case 'convertResource':
        case 'enableResourceConversion':
          this._addResourceConversion(effect, context.card);
          break;
        case 'reduceArmorForGain':
          this._addArmorConversion(effect, context.card);
          break;
        case 'discardMarketCard':
          this._queueDiscardUpMarketChoice(effect);
          break;
        case 'firstBuyThisTurnUpgraded':
          this.state.firstBuyUpgraded = true;
          break;
        case 'firstBuyThisTurnMayGoToDeckTop':
          this.state.firstBuyToTop = true;
          break;
        case 'returnPlayedCardToDeckTopAtEndTurn':
          this.state.returnPlayedToTop += Number(effect.amount) || 1;
          break;
        case 'discardAnyCardsThenDraw':
          this._discardAnyCardsThenDraw(effect.drawPerDiscard || 1, context.card);
          break;
        case 'discardCardsThenDraw':
          this._discardCardsThenDraw(effect.discard || 1, effect.draw || 1);
          break;
        case 'discardUpToThenDraw':
          this._discardUpToThenDraw(effect.maxDiscard || 1, effect.drawPerDiscard || 1);
          break;
        case 'discardCardsForGain':
          this._discardCardsForGain(effect);
          break;
        case 'freeBuy':
          this._autoFreeBuy(effect.maxCost || 0);
          break;
        case 'trashHandToGainMarketCard':
          this._trashHandToGainMarket(effect.costBonus || 0);
          break;
        case 'payStatusForGain':
          this._payStatusForGain(effect);
          break;
        case 'retainHandCard':
          this.state.retainHandSlots += Number(effect.amount) || 1;
          break;
        case 'skipThreatAttackThisTurn':
          this.state.skipAttackThisTurn = true;
          this.state.holdSkippedAttackThisTurn = false;
          break;
        case 'skipAttackOnRevealTurn':
          this.state.skipAttackThisTurn = true;
          this.state.holdSkippedAttackThisTurn = true;
          break;
        case 'discardAllRetainedCards':
          this.state.discardPile.push(...this.state.retainedArea);
          this.state.retainedArea = [];
          for (let i = this.state.hand.length - 1; i >= 0; i -= 1) {
            if (!this._cardHasKeyword(this.state.hand[i], 'retain')) continue;
            const [card] = this.state.hand.splice(i, 1);
            this.state.discardPile.push(card);
          }
          this._log('所有驻留牌被弃置。');
          break;
        case 'nextTurnGain':
          this.state.nextTurnGain = addGain(this.state.nextTurnGain, effect.gain || {});
          break;
        case 'nextTurnLose':
          this.state.nextTurnLoss = addGain(this.state.nextTurnLoss, effect.loss || {});
          break;
        case 'nextTurnUploadMultiplier':
          this.state.nextTurnUploadMultiplier = Number(effect.multiplier) || 1;
          break;
        case 'improveFinalRating':
          this.state.ratingBonus += Number(effect.amount) || 1;
          break;
        case 'preventRatingPenaltyAtLifeLoss':
          this.state.preventRatingPenaltyAtLifeLoss = Number(effect.lifeLoss) || 3;
          break;
        case 'searchDrawPileToHand':
          this._queueSearchDrawPileToHand(effect.amount || 1, effect.shuffleAfter);
          break;
        case 'spendResourceToPutSelfOnDeckTop':
          this._queueSpendSelfToDeckTop(effect, context.card);
          break;
        case 'triggerFullPower':
        case 'modifySelfEffect':
          break;
        default:
          this._log(`效果 ${effect.type} 暂未实现。`);
          break;
      }
    });
  }

  _applyKeywords(keywords = [], card = null) {
    if (keywords.includes('supply')) {
      this.state.supplyCharges += 1;
    }
    if (keywords.includes('fullPower')) {
      if (this.state.supplyCharges > 0) {
        this.state.supplyCharges -= 1;
        this._log('补给抵消了一次全力。');
      } else {
        this.state.fullPowerUsedThisTurn = true;
      }
    }
  }

  _gainResources(gain = {}, source = '') {
    Object.keys(gain || {}).forEach((resource) => {
      const rawAmount = Number(gain[resource]) || 0;
      if (rawAmount === 0) return;
      if (resource === 'draw') {
        this._drawCards(rawAmount);
        return;
      }
      if (resource === 'upgrade') {
        this._queueUpgrade(rawAmount, source);
        return;
      }
      if (resource === 'trash') {
        this._queueTrash(rawAmount, source);
        return;
      }
      if (resource === 'upload') {
        this._gainUpload(rawAmount, source);
        return;
      }
      if (TURN_RESOURCES.includes(resource)) {
        this.state[resource] = (Number(this.state[resource]) || 0) + rawAmount;
      }
    });
    this._checkGameEnd();
  }

  _gainUpload(amount, source = '') {
    if (this.state.uploadLocked) {
      this._log(`${source || '效果'} 的上传被封锁。`);
      return;
    }
    const adjusted = Math.floor((Number(amount) || 0) * (Number(this.state.uploadMultiplier) || 1));
    this.state.upload += adjusted;
    this.state.uploadThisTurn += adjusted;
  }

  _lockUpload(resetExisting = false) {
    if (resetExisting) {
      this.state.upload = Math.max(0, this.state.upload - this.state.uploadThisTurn);
      this.state.uploadThisTurn = 0;
    }
    this.state.uploadLocked = true;
    this._log('本回合上传被封锁。');
  }

  _drawCards(count = 1) {
    for (let i = 0; i < count; i += 1) {
      if (this.state.drawPile.length === 0) {
        if (this.state.discardPile.length === 0) break;
        this.state.drawPile = this._shuffle(this.state.discardPile);
        this.state.discardPile = [];
        this._log('弃牌堆洗回抽牌堆。');
      }
      const card = this.state.drawPile.shift();
      if (card) this.state.hand.push(card);
    }
  }

  _revealAttack() {
    let guard = 0;
    while (guard < 50) {
      if (this.state.attackDeck.length === 0) {
        this.state.attackDeck = this._shuffle(this.state.attackDiscard);
        this.state.attackDiscard = [];
      }
      const attack = this.state.attackDeck.shift();
      if (!attack) {
        this.state.currentAttack = null;
        return;
      }
      if (attack.revealCondition?.armorAtMost && this.state.armor > attack.revealCondition.armorAtMost) {
        this.state.attackDiscard.push(attack);
        guard += 1;
        continue;
      }
      this.state.currentAttack = attack;
      this._resolveEffects(attack.onReveal?.effects || [], { from: 'attackReveal' });
      this._log(`威胁展开：${attack.name}。`);
      return;
    }
  }

  _getAttackCell(attack = {}) {
    if (!attack) return null;
    if (Object.prototype.hasOwnProperty.call(attack, 'fixedAttack')) {
      return { attack: Number(attack.fixedAttack) || 0 };
    }
    const row = this._tierFor(this.state.mobility, attack.mobilityBreakpoints || []);
    const col = this._tierFor(this.state.counter, attack.counterBreakpoints || []);
    return attack.attackTable?.[row]?.[col] || { attack: null };
  }

  _tierFor(value, breakpoints = []) {
    const current = Number(value) || 0;
    if (current >= (Number(breakpoints[1]) || Infinity)) return 2;
    if (current >= (Number(breakpoints[0]) || Infinity)) return 1;
    return 0;
  }

  _addDecay(amount = 1, source = '衰退', force = false) {
    const value = Number(amount) || 0;
    if (value <= 0) return;
    if (!force && this.state.skipDecayTurns.includes(this.state.turn)) return;
    this.state.decay += value;
    this._log(`${source} +${value}。`);
    while (this.state.decay >= this.state.decayPerArmorLoss) {
      this.state.decay -= this.state.decayPerArmorLoss;
      this.state.armor = Math.max(0, this.state.armor - 1);
      this._log(`永久防护降低 1（当前 ${this.state.armor}）。`);
    }
  }

  _reduceArmor(amount = 1, options = {}) {
    const value = Number(amount) || 0;
    if (value <= 0) return true;
    if (options.cannotReduceBelowZeroAfterPermanentArmor && this._getTotalDefense() - value < 0) {
      this._log('防护不能降低到 0 以下。');
      return false;
    }
    this.state.block -= value;
    return true;
  }

  _queueUpgrade(count = 1, source = '') {
    const amount = Number(count) || 1;
    const candidates = this._buildChoiceCandidates(['hand'], (card) => this._canUpgradeCard(card));
    if (candidates.length === 0) {
      this._log('没有可升级的手牌。');
      return false;
    }

    const targetCount = Math.min(amount, candidates.length);
    return this._enqueueChoice({
      type: 'upgrade',
      title: '选择要升级的手牌',
      prompt: `${source || '效果'}：选择 ${targetCount} 张手牌升级。`,
      min: targetCount,
      max: targetCount,
      optional: false,
      candidates,
      payload: {
        effect: 'upgradeCards',
      },
    });
  }

  _upgradeCard(card, allowFlow = false) {
    if (!this._canUpgradeCard(card, allowFlow)) return false;
    card.upgraded = true;
    this.state.stats.cardsUpgraded += 1;
    this._log(`${card.name} 已升级。`);
    return true;
  }

  _canUpgradeCard(card, allowFlow = false) {
    if (!card || card.upgraded || !card.upgrade || card.canUpgrade === false) return false;
    if (!allowFlow && this._cardHasKeyword(card, 'flow')) return false;
    return true;
  }

  _queueTrash(count = 1, source = '') {
    const amount = Number(count) || 1;
    const candidates = this._buildChoiceCandidates(['hand', 'discardPile'], (card) => this._canTrashCard(card));
    if (candidates.length === 0) {
      this._log('没有可删除的牌。');
      return false;
    }

    const targetCount = Math.min(amount, candidates.length);
    return this._enqueueChoice({
      type: 'trash',
      title: '选择要删除的牌',
      prompt: `${source || '效果'}：从手牌或弃牌堆选择 ${targetCount} 张牌删除。`,
      min: targetCount,
      max: targetCount,
      optional: false,
      candidates,
      payload: {
        effect: 'trashCards',
      },
    });
  }

  _buildChoiceCandidates(zoneNames = [], predicate = () => true) {
    return zoneNames.flatMap((zoneName) => {
      const zone = this._getZoneByName(zoneName);
      return zone
        .map((card, index) => ({ zone: zoneName, index, card }))
        .filter((item) => Boolean(item.card))
        .filter((item) => predicate(item.card, item.index, zoneName))
        .map((item) => this._choiceCandidate(item.zone, item.index, item.card));
    });
  }

  _choiceCandidate(zone, index, card) {
    return {
      zone,
      index,
      instanceId: card._instanceId,
      card: this._cardSummary(card),
    };
  }

  _cardSummary(card = {}) {
    return {
      id: card.id,
      instanceId: card._instanceId,
      name: card.name,
      type: card.type,
      tier: card.tier,
      cost: card.cost,
      upgraded: Boolean(card.upgraded),
      text: card.text,
    };
  }

  _enqueueChoice(choice = {}) {
    const candidates = choice.candidates || [];
    const max = Math.min(Math.max(Number(choice.max) || 0, 0), candidates.length);
    const min = Math.min(Math.max(Number(choice.min) || 0, 0), max);
    if (max <= 0 && !choice.allowEmpty) return false;

    const prepared = {
      ...choice,
      id: `choice_${this.choiceCounter += 1}`,
      min,
      max,
      optional: Boolean(choice.optional || min === 0),
      candidates,
      payload: clone(choice.payload || {}),
    };

    if (this.state.pendingChoice) {
      this.state.pendingChoiceQueue.push(prepared);
    } else {
      this.state.pendingChoice = prepared;
      this._log(prepared.prompt || prepared.title || '请选择牌。');
    }
    return true;
  }

  _promoteNextChoice() {
    if (this.state.pendingChoice || this.state.pendingChoiceQueue.length === 0) return;
    this.state.pendingChoice = this.state.pendingChoiceQueue.shift();
    this._log(this.state.pendingChoice.prompt || this.state.pendingChoice.title || '请选择牌。');
  }

  _resolveChoice(choiceId, selected = [], accepted = true) {
    const choice = this.state.pendingChoice;
    if (!choice || choice.id !== choiceId) return;

    const selection = this._normalizeChoiceSelection(choice, selected);
    if (!selection) return;

    this.state.pendingChoice = null;
    this._applyChoicePayload(choice, selection, accepted);
    this._promoteNextChoice();
    this._checkGameEnd();
  }

  _normalizeChoiceSelection(choice, selected) {
    const byKey = {};
    (choice.candidates || []).forEach((candidate) => {
      byKey[this._choiceKey(candidate)] = candidate;
    });

    const seen = new Set();
    const selection = [];
    (selected || []).forEach((item) => {
      const key = typeof item === 'string' ? item : `${item.zone}:${item.instanceId}`;
      if (!byKey[key] || seen.has(key)) return;
      seen.add(key);
      selection.push(byKey[key]);
    });

    if (selection.length < choice.min || selection.length > choice.max) {
      this._log(`请选择 ${choice.min === choice.max ? choice.min : `${choice.min}-${choice.max}`} 张牌。`);
      return null;
    }
    return selection;
  }

  _choiceKey(candidate) {
    return `${candidate.zone}:${candidate.instanceId}`;
  }

  _applyChoicePayload(choice, selection, accepted = true) {
    if (!accepted) return;
    const payload = choice.payload || {};
    switch (payload.effect) {
      case 'upgradeCards':
        selection.forEach((candidate) => {
          const card = this._findCardByInstance(candidate.zone, candidate.instanceId);
          if (card) this._upgradeCard(card, false);
        });
        break;
      case 'trashCards':
        selection.forEach((candidate) => {
          const card = this._removeCardByInstance(candidate.zone, candidate.instanceId);
          if (card && this._canTrashCard(card)) {
            this._exileCard(card, '删除');
          } else if (card) {
            this._getZoneByName(candidate.zone).splice(candidate.index, 0, card);
          }
        });
        break;
      case 'discardThenDraw': {
        const discarded = this._discardChoiceCards(selection);
        const draw = Object.prototype.hasOwnProperty.call(payload, 'draw')
          ? Number(payload.draw) || 0
          : discarded * (Number(payload.drawPerDiscard) || 1);
        if (draw > 0) this._drawCards(draw);
        break;
      }
      case 'discardForGain': {
        const discarded = this._discardChoiceCards(selection);
        if (discarded > 0) {
          const gain = payload.gainPerCard ? addGain({}, payload.gainPerCard, discarded) : payload.gain;
          this._gainResources(gain || {}, '弃牌效果');
        }
        break;
      }
      case 'discardCostThenAbility':
        this._discardChoiceCards(selection);
        this._resolveAbilityOption(payload.abilityIndex, payload.optionId, { costsPaid: true });
        break;
      case 'trashHandToGainMarketCard': {
        const candidate = selection[0];
        const trashed = candidate ? this._removeCardByInstance(candidate.zone, candidate.instanceId) : null;
        if (!trashed) break;
        this._exileCard(trashed, '拆解');
        const maxCost = (Number(trashed.cost) || 0) + (Number(payload.costBonus) || 0);
        this._autoFreeBuy(maxCost);
        break;
      }
      case 'discardMarketCards':
        this._discardSelectedUpMarketCards(selection);
        break;
      case 'spendSelfToDeckTop':
        this._spendSelfToDeckTop(payload);
        break;
      case 'payStatusForGain':
        this._payStatusForGain({ cardId: payload.cardId, amount: payload.amount, gain: payload.gain, to: payload.to });
        break;
      case 'searchDrawPileToHand':
        selection.forEach((candidate) => {
          const card = this._removeCardByInstance(candidate.zone, candidate.instanceId);
          if (card) {
            this.state.hand.push(card);
            this._log(`检索 ${card.name} 到手牌。`);
          }
        });
        if (payload.shuffleAfter) this.state.drawPile = this._shuffle(this.state.drawPile);
        break;
      default:
        break;
    }
  }

  _discardChoiceCards(selection = []) {
    let discarded = 0;
    selection.forEach((candidate) => {
      const card = this._removeCardByInstance(candidate.zone, candidate.instanceId);
      if (!card) return;
      this.state.discardPile.push(card);
      discarded += 1;
      this._log(`弃置：${card.name}。`);
    });
    return discarded;
  }

  _getZoneByName(zoneName) {
    const zones = {
      hand: this.state.hand,
      discardPile: this.state.discardPile,
      drawPile: this.state.drawPile,
      playArea: this.state.playArea,
      retainedArea: this.state.retainedArea,
      upMarket: this.state.upMarket,
      basicMarket: this.state.basicMarket,
    };
    return zones[zoneName] || [];
  }

  _findCardByInstance(zoneName, instanceId) {
    return this._getZoneByName(zoneName).find((card) => card && card._instanceId === instanceId) || null;
  }

  _removeCardByInstance(zoneName, instanceId) {
    const zone = this._getZoneByName(zoneName);
    const index = zone.findIndex((card) => card && card._instanceId === instanceId);
    if (index < 0) return null;
    return zone.splice(index, 1)[0];
  }

  _exileCard(card, reason = '移除') {
    if (!card) return;
    this.state.exilePile.push(card);
    this.state.stats.cardsTrashed += 1;
    const face = this._buildFace(card);
    (face.cleanup || []).forEach((effect) => {
      if (effect.type === 'gainWhenExiled') this._gainResources(effect.gain || {}, card.name);
    });
    this._log(`${reason}：${card.name}。`);
  }

  _gainStatus(cardId, amount = 1, to = 'discard') {
    for (let i = 0; i < (Number(amount) || 1); i += 1) {
      const card = this._instantiateCard(cardId);
      if (!card) continue;
      if (to === 'hand') this.state.hand.push(card);
      else this.state.discardPile.push(card);
    }
  }

  _applyNextTurnLoss() {
    Object.keys(this.state.nextTurnLoss || {}).forEach((resource) => {
      const amount = Number(this.state.nextTurnLoss[resource]) || 0;
      if (TURN_RESOURCES.includes(resource)) {
        this.state[resource] = Math.max(0, (Number(this.state[resource]) || 0) - amount);
      }
    });
    this.state.nextTurnLoss = {};
  }

  _selectAbilityOption(ability = {}, optionId = null) {
    if (ability.options && ability.options.length > 0) {
      return ability.options.find((option) => option.id === optionId) || ability.options[0];
    }
    return ability;
  }

  _canPayCosts(costs = []) {
    const discardAmount = costs
      .filter((cost) => cost.type === 'discardFromHand')
      .reduce((sum, cost) => sum + (Number(cost.amount) || 1), 0);
    if (discardAmount > this.state.hand.length) return false;
    return costs.every((cost) => {
      if (cost.type === 'payResource') return this._hasResource(cost.resource, cost.amount);
      return true;
    });
  }

  _payCosts(costs = []) {
    costs.forEach((cost) => {
      if (cost.type === 'payResource') this._payResource(cost.resource, cost.amount);
      if (cost.type === 'reduceArmor') this._reduceArmor(cost.amount);
    });
  }

  _hasResource(resource, amount = 1) {
    return (Number(this.state[resource]) || 0) >= (Number(amount) || 0);
  }

  _payResource(resource, amount = 1) {
    if (!this._hasResource(resource, amount)) return false;
    this.state[resource] -= Number(amount) || 0;
    return true;
  }

  _queueDiscardChoice(options = {}) {
    const candidates = this._buildChoiceCandidates(['hand']);
    if (candidates.length === 0) return false;
    return this._enqueueChoice({
      type: 'discard',
      candidates,
      ...options,
    });
  }

  _discardAnyCardsThenDraw(drawPerDiscard = 1, card = null) {
    this._queueDiscardChoice({
      title: '选择要弃置的手牌',
      prompt: `${card?.name || '效果'}：可以弃置任意张手牌，每弃 1 张抽 ${Number(drawPerDiscard) || 1} 张。`,
      min: 0,
      max: this.state.hand.length,
      optional: true,
      payload: {
        effect: 'discardThenDraw',
        drawPerDiscard,
      },
    });
  }

  _discardCardsThenDraw(discard = 1, draw = 1) {
    const count = Math.min(Number(discard) || 1, this.state.hand.length);
    if (count <= 0) {
      this._drawCards(Number(draw) || 1);
      return;
    }
    this._queueDiscardChoice({
      title: '选择要弃置的手牌',
      prompt: `选择 ${count} 张手牌弃置，然后抽 ${Number(draw) || 1} 张。`,
      min: count,
      max: count,
      optional: false,
      payload: {
        effect: 'discardThenDraw',
        draw,
      },
    });
  }

  _discardUpToThenDraw(maxDiscard = 1, drawPerDiscard = 1) {
    const max = Math.min(Number(maxDiscard) || 1, this.state.hand.length);
    if (max <= 0) return;
    this._queueDiscardChoice({
      title: '选择要弃置的手牌',
      prompt: `可以弃置至多 ${max} 张手牌，每弃 1 张抽 ${Number(drawPerDiscard) || 1} 张。`,
      min: 0,
      max,
      optional: true,
      payload: {
        effect: 'discardThenDraw',
        drawPerDiscard,
      },
    });
  }

  _discardCardsForGain(effect = {}) {
    const max = effect.amount === 'any'
      ? this.state.hand.length
      : Math.min(Number(effect.amount) || 1, this.state.hand.length);
    if (max <= 0) return;
    const optional = Boolean(effect.optional || effect.amount === 'any');
    this._queueDiscardChoice({
      title: '选择要弃置的手牌',
      prompt: effect.amount === 'any'
        ? '可以弃置任意张手牌来获得效果。'
        : `${optional ? '可以' : '需要'}弃置 ${max} 张手牌来获得效果。`,
      min: optional ? 0 : max,
      max,
      optional,
      payload: {
        effect: 'discardForGain',
        gain: effect.gain,
        gainPerCard: effect.gainPerCard,
      },
    });
  }

  _payStatusForGain(effect = {}) {
    const amount = Number(effect.amount) || 1;
    if (effect.optional) {
      this._enqueueChoice({
        type: 'confirm',
        title: '确认状态代价',
        prompt: `可以将 ${amount} 张${this._statusName(effect.cardId)}加入弃牌堆来获得效果。`,
        min: 0,
        max: 0,
        optional: true,
        allowEmpty: true,
        candidates: [],
        payload: {
          effect: 'payStatusForGain',
          cardId: effect.cardId,
          amount,
          gain: effect.gain || {},
          to: effect.to || 'discard',
        },
      });
      return;
    }
    this._gainStatus(effect.cardId, amount, effect.to || 'discard');
    this._gainResources(effect.gain || {}, '状态代价');
  }

  _statusName(cardId) {
    return this.definitions[cardId]?.name || '状态';
  }

  _removeStatusCards(cardId, amount = 1) {
    let removed = 0;
    [this.state.hand, this.state.discardPile].forEach((zone) => {
      for (let i = zone.length - 1; i >= 0 && removed < amount; i -= 1) {
        if (zone[i].id === cardId) {
          zone.splice(i, 1);
          removed += 1;
        }
      }
    });
    return removed;
  }

  _addResourceConversion(effect = {}, card = null) {
    this.state.availableConversions.push({
      type: 'resource',
      label: card ? card.name : '资源转换',
      from: effect.from,
      to: effect.to,
      rate: Number(effect.rate) || 1,
      remaining: effect.maxTimes || 'any',
    });
  }

  _addArmorConversion(effect = {}, card = null) {
    this.state.availableConversions.push({
      type: 'reduceArmorForGain',
      label: card ? card.name : '防护转换',
      armor: Number(effect.armor) || 1,
      gain: effect.gain || {},
      remaining: effect.maxTimes || 1,
      cannotReduceBelowZeroAfterPermanentArmor: Boolean(effect.cannotReduceBelowZeroAfterPermanentArmor),
    });
  }

  _discardUpMarketCard(amount = 1) {
    const visibleCount = this.state.upMarket.filter(Boolean).length;
    const count = amount === 'any' ? visibleCount : Number(amount) || 1;
    for (let i = 0; i < count && this.state.upMarket.some(Boolean); i += 1) {
      const firstCardIndex = this.state.upMarket.findIndex(Boolean);
      const [card] = this.state.upMarket.splice(firstCardIndex, 1);
      this.state.upDiscard.push(card);
    }
    this.state.upMarket = this.state.upMarket.filter(Boolean);
    this._refillUpMarket();
  }

  _queueDiscardUpMarketChoice(effect = {}) {
    const candidates = this._buildChoiceCandidates(['upMarket']);
    if (candidates.length === 0) return false;
    const count = effect.amount === 'any'
      ? candidates.length
      : Math.min(Number(effect.amount) || 1, candidates.length);
    const optional = Boolean(effect.optional || effect.amount === 'any');
    return this._enqueueChoice({
      type: 'discardMarket',
      title: '选择要刷新的市场牌',
      prompt: effect.amount === 'any'
        ? '可以选择任意数量的进阶市场牌弃置并刷新。'
        : `${optional ? '可以' : '需要'}选择 ${count} 张进阶市场牌弃置并刷新。`,
      min: optional ? 0 : count,
      max: count,
      optional,
      candidates,
      payload: {
        effect: 'discardMarketCards',
      },
    });
  }

  _discardSelectedUpMarketCards(selection = []) {
    let discarded = 0;
    selection.forEach((candidate) => {
      if (candidate.zone !== 'upMarket') return;
      const card = this._removeCardByInstance('upMarket', candidate.instanceId);
      if (!card) return;
      this.state.upDiscard.push(card);
      discarded += 1;
      this._log(`刷新市场：${card.name}。`);
    });
    if (discarded > 0) {
      this.state.upMarket = this.state.upMarket.filter(Boolean);
      this._refillUpMarket();
    }
  }

  _queueSpendSelfToDeckTop(effect = {}, card = null) {
    if (!card) return false;
    const resource = effect.resource || 'download';
    const amount = Number(effect.amount) || 1;
    if (!this._hasResource(resource, amount)) return false;
    if (effect.optional) {
      return this._enqueueChoice({
        type: 'confirm',
        title: '确认回顶',
        prompt: `可以支付 ${amount} ${resource === 'download' ? '下载' : resource}，将 ${card.name} 在回合结束时放回牌堆顶。`,
        min: 0,
        max: 0,
        optional: true,
        allowEmpty: true,
        candidates: [],
        payload: {
          effect: 'spendSelfToDeckTop',
          instanceId: card._instanceId,
          resource,
          amount,
        },
      });
    }
    this._spendSelfToDeckTop({ instanceId: card._instanceId, resource, amount });
    return true;
  }

  _spendSelfToDeckTop(payload = {}) {
    const card = this._findCardByInstance('playArea', payload.instanceId);
    if (!card) return;
    const resource = payload.resource || 'download';
    const amount = Number(payload.amount) || 1;
    if (!this._payResource(resource, amount)) {
      this._log(`${card.name} 的回顶费用不足。`);
      return;
    }
    card._returnToTop = true;
    this._log(`${card.name} 将在回合结束时回到牌堆顶。`);
  }

  _autoFreeBuy(maxCost = 0) {
    const upIndex = this.state.upMarket.findIndex((card) => card && (Number(card.cost) || 0) <= maxCost);
    if (upIndex >= 0) {
      const card = this.state.upMarket[upIndex];
      this._emptyUpMarketSlot(upIndex);
      this.state.discardPile.push(this._instantiateCard(card.id));
      this._log(`免费获得 ${card.name}。`);
      return;
    }
    const basicIndex = this.state.basicMarket.findIndex((card) => (Number(card.cost) || 0) <= maxCost);
    if (basicIndex >= 0) {
      const [basic] = this.state.basicMarket.splice(basicIndex, 1);
      this.state.discardPile.push(this._instantiateCard(basic.id));
      this._log(`免费获得 ${basic.name}。`);
    }
  }

  _trashHandToGainMarket(costBonus = 0) {
    const candidates = this._buildChoiceCandidates(['hand'], (card) => this._canTrashCard(card));
    if (candidates.length === 0) return;
    this._enqueueChoice({
      type: 'trash',
      title: '选择要拆解的手牌',
      prompt: `选择 1 张手牌删除，然后免费获得费用不超过该牌费用 +${Number(costBonus) || 0} 的市场牌。`,
      min: 1,
      max: 1,
      optional: false,
      candidates,
      payload: {
        effect: 'trashHandToGainMarketCard',
        costBonus,
      },
    });
  }

  _queueSearchDrawPileToHand(amount = 1, shuffleAfter = false) {
    const candidates = this._buildChoiceCandidates(['drawPile']);
    if (candidates.length === 0) return;
    const count = Math.min(Number(amount) || 1, candidates.length);
    this._enqueueChoice({
      type: 'search',
      title: '选择要加入手牌的牌',
      prompt: `从抽牌堆选择 ${count} 张牌加入手牌。`,
      min: count,
      max: count,
      optional: false,
      candidates,
      payload: {
        effect: 'searchDrawPileToHand',
        shuffleAfter,
      },
    });
  }

  _refillUpMarket() {
    const size = Number(this.config.upMarketSize) || 3;
    while (this.state.upMarket.length < size) {
      if (this.state.upDeck.length === 0) {
        if (this.state.upDiscard.length === 0) break;
        this.state.upDeck = this._shuffle(this.state.upDiscard);
        this.state.upDiscard = [];
      }
      const card = this.state.upDeck.shift();
      if (card) this.state.upMarket.push(card);
    }
  }

  _emptyUpMarketSlot(index = 0) {
    if (!this.state.upMarket[index]) return;
    this.state.upMarket[index] = null;
    this.state.upMarketBoughtThisTurn = true;
  }

  _rotateUpMarket() {
    if (this.state.upMarket[0]) {
      this.state.upDiscard.push(this.state.upMarket[0]);
      this.state.upMarket[0] = null;
    }
    this.state.upMarket = this.state.upMarket.filter(Boolean);
    this.state.upMarketBoughtThisTurn = false;
    this._refillUpMarket();
  }

  _removeCardFromZone(zoneName, cardId, amount = 1) {
    const zone = this.state[zoneName] || [];
    let removed = 0;
    for (let i = zone.length - 1; i >= 0 && removed < amount; i -= 1) {
      if (zone[i].id === cardId) {
        zone.splice(i, 1);
        removed += 1;
      }
    }
  }

  _expandCards(cards = []) {
    return cards.flatMap((card) => {
      const count = Number(card.copies) || Number(card.count) || 1;
      return Array.from({ length: count }, () => this._instantiateCard(card.id));
    }).filter(Boolean);
  }

  _expandAttacks(attacks = []) {
    return attacks.flatMap((attack) => {
      const count = Number(attack.amount) || 1;
      return Array.from({ length: count }, () => ({
        ...clone(attack),
        _instanceId: `${attack.id || 'attack'}_${this.instanceCounter++}`,
      }));
    });
  }

  _instantiateCard(cardId, options = {}) {
    const definition = typeof cardId === 'string' ? this.definitions[cardId] : cardId;
    if (!definition) return null;
    return {
      ...clone(definition),
      _instanceId: `${definition.id || 'card'}_${this.instanceCounter++}`,
      upgraded: Boolean(options.upgraded),
    };
  }

  _shuffle(list = []) {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  _scanMaxInstanceCounter(state = this.state) {
    const zones = [
      'drawPile',
      'discardPile',
      'hand',
      'playArea',
      'retainedArea',
      'exilePile',
      'basicMarket',
      'upDeck',
      'upMarket',
      'upDiscard',
      'attackDeck',
      'attackDiscard',
    ];
    let max = 0;
    zones.forEach((zoneName) => {
      (state[zoneName] || []).forEach((item) => {
        const match = String(item?._instanceId || '').match(/_(\d+)$/);
        if (match) max = Math.max(max, Number(match[1]) + 1);
      });
    });
    const currentAttackMatch = String(state.currentAttack?._instanceId || '').match(/_(\d+)$/);
    if (currentAttackMatch) max = Math.max(max, Number(currentAttackMatch[1]) + 1);
    return max;
  }

  _scanMaxChoiceCounter(state = this.state) {
    const choices = [state.pendingChoice, ...(state.pendingChoiceQueue || [])];
    return choices.reduce((max, choice) => {
      const match = String(choice?.id || '').match(/choice_(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
  }

  _cardHasKeyword(card = {}, keyword) {
    return this._buildFace(card).keywords.includes(keyword);
  }

  _cardFaceHasKeyword(card = {}, keyword, modeId = null) {
    return this._selectFace(card, modeId).keywords.includes(keyword);
  }

  _canAutoPlayCard(card = {}, allowFullPower = false) {
    if (!this._canPlayCard(card, null)) return false;
    if (this.getPlayableModes(card).length > 0) return false;
    if (!allowFullPower && this._cardFaceHasKeyword(card, 'fullPower')) return false;
    return true;
  }

  _canPlayAnyCard(card = {}) {
    const modes = this.getPlayableModes(card);
    if (modes.length === 0) return this._canPlayCard(card, null);
    return modes.some((mode) => this._canPlayCard(card, mode.id));
  }

  _playableFaces(card = {}) {
    const modes = this.getPlayableModes(card);
    if (modes.length === 0) return this._canPlayCard(card, null) ? [this._selectFace(card, null)] : [];
    return modes.filter((mode) => this._canPlayCard(card, mode.id)).map((mode) => this._selectFace(card, mode.id));
  }

  _allPlayableFacesHaveKeyword(card = {}, keyword) {
    const faces = this._playableFaces(card);
    return faces.length > 0 && faces.every((face) => face.keywords.includes(keyword));
  }

  _canTrashCard(card = {}) {
    if (!card) return false;
    if (card.canTrash === false) return false;
    return card.id !== 'status_wound' && card.id !== 'status_bleed';
  }

  _hasPassive(type) {
    return (this.state.selectedCharacter?.passives || []).some((passive) => passive.type === type);
  }

  _getPassiveAmount(type) {
    return (this.state.selectedCharacter?.passives || [])
      .filter((passive) => passive.type === type)
      .reduce((sum, passive) => sum + (Number(passive.amount) || 1), 0);
  }

  _getTotalDefense() {
    return Math.max(0, (Number(this.state.armor) || 0) + (Number(this.state.block) || 0));
  }

  _refreshDerived() {
    this.state.totalDefense = this._getTotalDefense();
    if (this.state.currentAttack && !this.state.skipAttackThisTurn) {
      this.state.attackCell = this._getAttackCell(this.state.currentAttack);
      this.state.attackValue = this.state.attackCell ? this.state.attackCell.attack : null;
    } else {
      this.state.attackCell = null;
      this.state.attackValue = null;
    }

    if (this._hasPassive('peekNextAttackCard')) {
      this.state.nextAttackPreview = this.state.attackDeck[0] || null;
    } else {
      this.state.nextAttackPreview = null;
    }
  }

  _checkGameEnd() {
    if (this.state.gameOver) return;
    if (this.state.upload >= this.state.uploadTarget) {
      this.state.gameOver = true;
      this.state.result = 'win';
      this.state.phase = 'gameOver';
      this.state.message = '关键数据已经完成上传。';
      this._log(this.state.message);
    }
  }

  _setLose(message) {
    if (this.state.gameOver) return;
    this.state.gameOver = true;
    this.state.result = 'lose';
    this.state.phase = 'gameOver';
    this.state.message = message;
    this._log(message);
  }

  _log(text) {
    if (!text) return;
    this.state.message = text;
    this.state.log.unshift({
      turn: this.state.turn,
      text,
    });
    this.state.log = this.state.log.slice(0, 80);
  }
}
