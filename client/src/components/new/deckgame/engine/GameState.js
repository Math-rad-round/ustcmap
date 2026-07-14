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
    // `score` 本次考试计算得到的分数（包含基础乘法分数和额外规则分数）
    this.score = 0;
    // `baseScore` 本次考试的基础乘法分数：Theory × Practice
    this.baseScore = 0;
    // `semester` 当前考试学期编号（从 1 开始）
    this.semester = 1;
    // `achievementPoints` 累计成就点
    this.achievementPoints = 0;
    // `reviewValue` 累计温习值（事件阶段提前结束时累加）
    this.reviewValue = 0;
    // `lastAchievement` 上次考试是否获得成就的描述文本
    this.lastAchievement = '';
    // 下一次考试开始结算时加入的额外分数
    this.nextScoreBonus = 0;
    // 本次考试已经消耗的下一次考试加分，仅用于展示
    this.appliedNextScoreBonus = 0;
    this.cramUsed = false;
    this.retakeUsed = false;
    this.examRerollUsed = false;
    this.currentExamAchievementDelta = 0;
    this.currentExamEffectAchievementDelta = 0;
    this.currentExamScoreDelta = 0;
    this.currentExamGoalAchievementDelta = 0;
    this.currentExamGoalSnapshot = null;
    this.currentExamGoalResultLength = 0;
    this.ignoreExamSideEffects = false;
    this.finalChanceBonusAwarded = false;
    // 考试抽卡前统计的场上项目推进总数，用于 progress 变量
    this.examStartProgress = 0;
    // 当前学期抽到的考试卡及结算展示字段
    this.currentTest = null;
    this.candidateTests = [];
    this.selectedTestIndex = -1;
    this.examRandomSymbol = null;
    this.examTempSymbols = { theory: 0, practice: 0, social: 0 };
    this.doublePermanentEffectsActive = false;
    this.awaitingEventStart = false;
    this.eventStartDraw = 5;
    this.testResults = [];
    this.examRequirement = 0;
    this.examAchievementAward = 0;
    this.examDrawCount = 0;
    this.examScoreScaling = 1;
    // 温习阶段可选择减少本次考试抽牌，换取等量项目推进
    this.examDrawPenalty = 0;
    this.reviewDrawTradeUsed = 0;
    // 开局抽取的即时/终局目标及目标结算记录
    this.immediateGoals = [];
    this.finalGoals = [];
    this.goalResults = [];
    this.completedProjectCount = 0;
    this.completedLargeProjectCount = 0;
    this.earnedPermanentCount = 0;
    this.acquiredCourseCount = 0;
    this.totalExamScore = 0;
    this.finalExamAchievementAward = 0;
    this.examHistory = [];
    this.gameFinished = false;
    this.graduationSummary = null;
    this.ownedCourses = [];

    // `cardResults` 每张卡本次考试的得分和成就点明细
    this.cardResults = [];
    // 考试阶段状态：考试结算后等待玩家确认进入下一学期
    this.examStageActive = false;
    // 需要玩家选择项目来获得进度的待处理效果
    this.pendingProjectProgress = null;
    this.pendingProjectProgressQueue = [];
    // 需要玩家从高级课程中选择并加入牌堆顶的待处理效果
    this.pendingCourseReward = null;
    this.pendingCourseDeletion = null;
    this.pendingCourseDeletionQueue = [];
    // 已获得并放置在场上的项目卡
    this.activeProjects = [];
    // 已获得并放置在场上的永久成果卡
    this.activePermanents = [];
    // 本次考试中永久成果的结算明细
    this.permanentResults = [];
    // 事件阶段状态
    this.eventDeck = null;
    this.eventHand = [];
    this.eventOptionStates = [];
    this.pendingEventPayment = null;
    this.pendingEventDiscard = null;
    this.eventStageActive = false;
    this.eventDrawnThisTurn = 0;
    this.eventPlayedCount = 0;
    this.eventResults = [];
    this.eventMessage = '';
    // 温习阶段状态
    this.reviewStageActive = false;
    this.reviewPreviewCards = [];
    this.reviewSelectedCards = [];
    this.reviewPreviewCount = 0;
    this.reviewBaseDeck = [];
    this.reviewMessage = '';
  }
}









