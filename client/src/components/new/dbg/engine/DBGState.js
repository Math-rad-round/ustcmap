// DBGState stores serializable game data. The engine owns all mutations.
export default class DBGState {
  constructor() {
    this.turn = 0;
    this.phase = 'setup';

    this.config = {};
    this.difficulty = null;
    this.characters = [];
    this.selectedCharacter = null;
    this.characterAbilityUsed = {};

    this.drawPile = [];
    this.discardPile = [];
    this.hand = [];
    this.playArea = [];
    this.retainedArea = [];
    this.exilePile = [];

    this.basicMarket = [];
    this.upDeck = [];
    this.upMarket = [];
    this.upDiscard = [];

    this.attackDeck = [];
    this.attackDiscard = [];
    this.currentAttack = null;
    this.attackValue = null;
    this.attackCell = null;
    this.nextAttackPreview = null;
    this.lastAttackFeedback = null;

    this.upload = 0;
    this.uploadThisTurn = 0;
    this.uploadTarget = 64;
    this.uploadLocked = false;
    this.uploadMultiplier = 1;

    this.download = 0;
    this.block = 0;
    this.mobility = 0;
    this.counter = 0;

    this.armor = 12;
    this.baseArmor = 12;
    this.decay = 0;
    this.decayPerArmorLoss = 4;
    this.lifeLoss = 0;
    this.lifeLimit = 4;
    this.ratingPenalty = 0;
    this.ratingBonus = 0;

    this.totalDefense = 12;
    this.cardsBoughtThisTurn = 0;
    this.cardsPlayedThisTurn = 0;
    this.upMarketBoughtThisTurn = false;
    this.fullPowerLocked = false;
    this.fullPowerUsedThisTurn = false;
    this.supplyCharges = 0;
    this.retainHandSlots = 0;
    this.returnPlayedToTop = 0;
    this.skipAttackThisTurn = false;
    this.holdSkippedAttackThisTurn = false;

    this.firstBuyUpgraded = false;
    this.firstBuyToTop = false;
    this.preventRatingPenaltyAtLifeLoss = null;
    this.availableConversions = [];
    this.pendingChoice = null;
    this.pendingChoiceQueue = [];

    this.nextTurnGain = {};
    this.nextTurnLoss = {};
    this.nextTurnUploadMultiplier = 1;
    this.initialHandQueue = [];
    this.skipAttackTurns = [];
    this.skipDecayTurns = [];

    this.gameOver = false;
    this.result = null;
    this.message = '';
    this.log = [];
    this.stats = {
      cardsBought: 0,
      cardsPlayed: 0,
      cardsDiscardedForBlock: 0,
      cardsUpgraded: 0,
      cardsTrashed: 0,
      attacksResolved: 0,
      damagePrevented: 0,
    };
  }
}
