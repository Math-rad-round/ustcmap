import GameState from './GameState';
import Deck from '../model/Deck';

// GameEngine: 解释命令并修改 GameState 的唯一组件（Command Driven）
// 重要：Engine 只在接收到命令时运行一次并返回新的 GameState，
// 浏览器仍为单线程，Engine 不是后台线程。
export default class GameEngine {
  /**
   * @param {object} data - 包含 courses / events / projects / permanents 的数据对象（例如从 JSON 导入）
   */
  constructor(data) {
    this.data = data || { courses: [] };
    this.state = new GameState();
    const cards = this._buildCardsFromData();
    // 将 Deck 实例放入 state（Deck 管理剩余牌堆）
    this.state.deck = new Deck(cards);
    this.state.ownedCourses = cards.slice();
    const events = this._buildEventsFromData();
    this.state.eventDeck = new Deck(events);
    this.state.eventDeck.shuffle();
    const tests = this._buildTestsFromData();
    this.state.testDeck = new Deck(tests);
    this.state.testDeck.shuffle();
    this.projects = this._buildProjectsFromData();
    this.adcourses = this._buildAdCoursesFromData();
    this.permanents = this._buildPermanentsFromData();
    this._givePermanent('permanent_practice_accumulation');
    this._initializeGoals();
  }
  _shuffleList(list = []) {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  _getGoalContent(goalName, fallback) {
    const text = this.data && this.data.taskText ? String(this.data.taskText) : '';
    const line = text.split(/\r?\n/).map((item) => item.trim()).find((item) => item.startsWith('* ') && item.includes(`${goalName}：`));
    return line ? line.replace(/^\*\s*/, '') : fallback;
  }

  _getImmediateGoalPool() {
    return [
      { id: 'first_large_project', name: '最早完成大型项目', content: '第一个完成需求>=8推进的项目，+6成就点', reward: 6 },
      { id: 'first_permanent', name: '最早获得永久成果', content: '第一个获得永久成果，+4成就点', reward: 4 },
      { id: 'first_three_projects', name: '最早获得3个项目', content: '第一个场上拥有3个项目，+4成就点', reward: 4 },
      { id: 'first_six_new_courses', name: '最早获得6个新课程', content: '第一个拥有6张新课程，+4成就点', reward: 4 },
      { id: 'first_exam_35', name: '最早考试35分', content: '第一个单次考试达到35分，+4成就点', reward: 4 },
    ];
  }

  _getFinalGoalPool() {
    return [
      { id: 'final_theory_master', name: '理论大师', content: '最终理论符号达到12，课程理论符号+永久卡理论符号x2计算，+4成就点', reward: 4, threshold: 12 },
      { id: 'final_practice_master', name: '实践大师', content: '最终实践符号达到12，课程实践符号+永久卡实践符号x2计算，+4成就点', reward: 4, threshold: 12 },
      { id: 'final_social_master', name: '社会大师', content: '最终社会符号达到12，课程社会符号+永久卡社会符号x2计算，+4成就点', reward: 4, threshold: 12 },
      { id: 'final_knowledge', name: '知识积累', content: '拥有课程至少11张，+4成就点', reward: 4, threshold: 11 },
      { id: 'final_project_master', name: '项目达人', content: '拥有和完成项目至少5个，+4成就点', reward: 4, threshold: 5 },
      { id: 'final_permanent_collector', name: '积累者', content: '永久成果至少3个，+4成就点', reward: 4, threshold: 3 },
      { id: 'final_score_65', name: '绩点优秀', content: '最终考试获得至少6成就点，+4成就点', reward: 4, threshold: 6 },
    ];
  }

  _initializeGoals() {
    const deadlines = [3, 4, 5];
    this.state.immediateGoals = this._shuffleList(this._getImmediateGoalPool()).slice(0, 3).map((goal, index) => ({
      ...goal,
      content: this._getGoalContent(goal.name, goal.content),
      deadline: deadlines[index],
      status: 'active',
    }));
    this.state.finalGoals = this._shuffleList(this._getFinalGoalPool()).slice(0, 3).map((goal) => ({
      ...goal,
      content: this._getGoalContent(goal.name, goal.content),
      status: 'active',
    }));
  }

  _completeImmediateGoal(goal, detail = '') {
    if (!goal || goal.status !== 'active') return;
    goal.status = 'completed';
    goal.completedSemester = this.state.semester;
    this.state.achievementPoints += goal.reward;
    const message = `${goal.name} 达成，获得 ${goal.reward} 成就点${detail ? `（${detail}）` : ''}`;
    this.state.goalResults.push(message);
    this.state.lastAchievement = message;
  }


  _captureCurrentExamGoalState() {
    this.state.currentExamGoalSnapshot = (this.state.immediateGoals || []).map((goal) => ({ ...goal }));
    this.state.currentExamGoalResultLength = (this.state.goalResults || []).length;
    this.state.currentExamGoalAchievementDelta = 0;
  }

  _restoreCurrentExamGoalState() {
    const snapshot = this.state.currentExamGoalSnapshot;
    if (Array.isArray(snapshot)) {
      this.state.immediateGoals = snapshot.map((goal) => ({ ...goal }));
    }
    const resultLength = Number(this.state.currentExamGoalResultLength);
    if (Array.isArray(this.state.goalResults) && Number.isFinite(resultLength) && resultLength >= 0) {
      this.state.goalResults = this.state.goalResults.slice(0, resultLength);
    }
    this.state.currentExamGoalSnapshot = null;
    this.state.currentExamGoalResultLength = 0;
  }
  _checkImmediateGoals() {
    (this.state.immediateGoals || []).forEach((goal) => {
      if (goal.status !== 'active') return;
      switch (goal.id) {
        case 'first_large_project':
          if ((this.state.completedLargeProjectCount || 0) >= 1) this._completeImmediateGoal(goal);
          break;
        case 'first_permanent':
          if ((this.state.earnedPermanentCount || 0) >= 1) this._completeImmediateGoal(goal);
          break;
        case 'first_three_projects':
          if ((this.state.activeProjects || []).length >= 3) this._completeImmediateGoal(goal);
          break;
        case 'first_six_new_courses':
          if ((this.state.acquiredCourseCount || 0) >= 6) this._completeImmediateGoal(goal);
          break;
        case 'first_exam_35':
          if ((this.state.score || 0) >= 35) this._completeImmediateGoal(goal, `本次考试 ${this.state.score} 分`);
          break;
        default:
          break;
      }
    });
  }

  _expireImmediateGoalsForSemester(semester) {
    (this.state.immediateGoals || []).forEach((goal) => {
      if (goal.status === 'active' && semester >= goal.deadline) {
        goal.status = 'expired';
        this.state.goalResults.push(`${goal.name} 未在第 ${goal.deadline} 学期结束前完成，已移除。`);
      }
    });
  }

  _countPermanentSymbol(symbol) {
    return (this.state.activePermanents || []).reduce((sum, permanent) => {
      return sum + (permanent.effects || []).reduce((inner, effect) => {
        if (effect.effectType === 'addSymbol' && String(effect.input || '').toLowerCase() === symbol) {
          return inner + (Number(effect.amount ?? effect.multi ?? 1) || 0);
        }
        return inner;
      }, 0);
    }, 0);
  }

  _countOwnedCourseSymbol(symbolKey) {
    return (this.state.ownedCourses || []).reduce((sum, course) => sum + Number((course.symbols || {})[symbolKey] || 0), 0);
  }

  _getFinalGoalValue(goal) {
    switch (goal.id) {
      case 'final_theory_master':
        return this._countOwnedCourseSymbol('Theory') + this._countPermanentSymbol('theory') * 2;
      case 'final_practice_master':
        return this._countOwnedCourseSymbol('Practice') + this._countPermanentSymbol('practice') * 2;
      case 'final_social_master':
        return this._countOwnedCourseSymbol('Social') + this._countPermanentSymbol('social') * 2;
      case 'final_knowledge':
        return (this.state.ownedCourses || []).length;
      case 'final_project_master':
        return (this.state.activeProjects || []).length + (this.state.completedProjectCount || 0);
      case 'final_permanent_collector':
        return (this.state.activePermanents || []).length;
      case 'final_score_65':
        return this.state.finalExamAchievementAward || 0;
      default:
        return 0;
    }
  }

  _refreshFinalGoalProgress() {
    (this.state.finalGoals || []).forEach((goal) => {
      if (!goal || goal.status === 'completed' || goal.status === 'failed') return;
      goal.value = this._getFinalGoalValue(goal);
    });
  }

  _buildGraduationSummary() {
    const finalGoals = (this.state.finalGoals || []).map((goal) => ({
      id: goal.id,
      name: goal.name,
      status: goal.status,
      value: goal.value,
      threshold: goal.threshold,
      reward: goal.reward,
    }));
    return {
      semesterEnded: 8,
      finalAchievementPoints: this.state.achievementPoints || 0,
      totalExamScore: this.state.totalExamScore || 0,
      finalExamAchievementAward: this.state.finalExamAchievementAward || 0,
      ownedCoursesCount: (this.state.ownedCourses || []).length,
      activeProjectCount: (this.state.activeProjects || []).length,
      completedProjectCount: this.state.completedProjectCount || 0,
      permanentCount: (this.state.activePermanents || []).length,
      finalGoals,
      exams: this.state.examHistory || [],
      chanceTools: {
        cramUsed: !!this.state.cramUsed,
        retakeUsed: !!this.state.retakeUsed,
        examRerollUsed: !!this.state.examRerollUsed,
      },
    };
  }

  _settleFinalGoals() {
    if (!this.state.finalChanceBonusAwarded) {
      const usedChances = [this.state.cramUsed, this.state.retakeUsed, this.state.examRerollUsed].filter(Boolean).length;
      const bonus = usedChances === 0 ? 2 : (usedChances <= 2 ? 1 : 0);
      if (bonus > 0) this.state.achievementPoints += bonus;
      this.state.finalChanceBonusAwarded = true;
      this.state.goalResults.push('补救机会使用 ' + usedChances + ' 次，最终成就点 +' + bonus + '。');
    }
    (this.state.finalGoals || []).forEach((goal) => {
      if (goal.status !== 'active') return;
      const value = this._getFinalGoalValue(goal);
      if (value >= goal.threshold) {
        goal.status = 'completed';
        goal.value = value;
        this.state.achievementPoints += goal.reward;
        this.state.goalResults.push(`${goal.name} 达成：${value}/${goal.threshold}，获得 ${goal.reward} 成就点。`);
      } else {
        goal.status = 'failed';
        goal.value = value;
        this.state.goalResults.push(`${goal.name} 未达成：${value}/${goal.threshold}。`);
      }
    });
  }

  // 将 data.courses 转换为内部卡牌对象数组并添加 `_id` 字段
  _buildCardsFromData() {
    const arr = this._normalizeList(this.data.courses);
    return arr.map((c, i) => ({ ...c, _id: c.id || `c${i}` }));
  }

  // 将 data.events 转换为内部事件卡对象数组
  _buildEventsFromData() {
    const arr = this._normalizeList(this.data.events);
    return arr.map((e, i) => ({ ...e, _id: e.id || `e${i}` }));
  }

  // 将 data.tests 转换为考试卡牌堆
  _buildTestsFromData() {
    const arr = this._normalizeList(this.data.tests);
    return arr.map((t, i) => ({ ...t, _id: t.id || `test${i}` }));
  }
  // 将 data.projects 转换为内部项目卡对象数组
  _buildProjectsFromData() {
    const arr = this._normalizeList(this.data.projects);
    return arr.map((p, i) => ({ ...p, _id: p.id || `p${i}` }));
  }

  // 将 data.adcourses 转换为高级课程奖励池
  _buildAdCoursesFromData() {
    const arr = this._normalizeList(this.data.adcourses);
    return arr.map((c, i) => ({ ...c, _id: c.id || `adcourse${i}` }));
  }
  // 将 data.permanents 转换为内部永久成果卡对象数组
  _buildPermanentsFromData() {
    const arr = this._normalizeList(this.data.permanents);
    return arr.map((p, i) => ({ ...p, _id: p.id || `permanent${i}` }));
  }
  _normalizeList(source) {
    if (Array.isArray(source)) return source;
    if (source && Array.isArray(source.courses)) return source.courses;
    if (source && Array.isArray(source.events)) return source.events;
    if (source && Array.isArray(source.tests)) return source.tests;
    if (source && Array.isArray(source.projects)) return source.projects;
    if (source && Array.isArray(source.permanents)) return source.permanents;
    return [];
  }

  /**
   * 执行命令（Command Driven API）
   * 支持的命令示例：
   * - { type: 'START_SEMESTER', draw: 5 }
   * - { type: 'PLAY_EVENT', eventIndex: 0, optionIndex: 0 }
   * - { type: 'ADVANCE_PROJECT', projectIndex: 0 }
   * - { type: 'PLAY_PROJECT_OPTION', projectIndex: 0, optionIndex: 0 }
   * - { type: 'END_EVENT_PHASE' }
   * 返回：当前的 GameState（引用）
   */
  execute(command = {}) {
    if (!command || !command.type) return this.state;
    switch (command.type) {
      case 'START_SEMESTER':
      case 'START_EXAM': {
        this._prepareSemesterStart(command.draw || 5);
        return this.state;
      }
      case 'SELECT_TEST': {
        return this._selectTest(command.testIndex ?? command.index ?? 0);
      }
      case 'REROLL_TESTS':
      case 'USE_EXAM_REROLL': {
        return this._rerollExamChoices();
      }
      case 'CONFIRM_START_EVENT': {
        this._startEventPhase(command.draw || this.state.eventStartDraw || 5);
        return this.state;
      }
      case 'TUTORIAL_SETUP': {
        return this._applyTutorialSetup(command);
      }
      case 'PLAY_EVENT': {
        return this._playEvent(command);
      }
      case 'TOGGLE_EVENT_PAYMENT_CARD': {
        return this._toggleEventPaymentCard(command);
      }
      case 'CONFIRM_EVENT_PAYMENT': {
        return this._confirmEventPayment();
      }
      case 'CANCEL_EVENT_PAYMENT': {
        return this._cancelEventPayment();
      }
      case 'TOGGLE_COURSE_DELETION_SELECTION': {
        return this._toggleCourseDeletionSelection(command);
      }
      case 'CONFIRM_COURSE_DELETION': {
        return this._confirmCourseDeletion();
      }
      case 'TOGGLE_EVENT_DISCARD_CARD': {
        return this._toggleEventDiscardCard(command);
      }
      case 'CONFIRM_EVENT_DISCARD': {
        return this._confirmEventDiscard();
      }
      case 'ADVANCE_PROJECT': {
        return this._advanceProject(command);
      }
      case 'PLAY_PROJECT_OPTION': {
        return this._playProjectOption(command);
      }
      case 'CONFIRM_EVENT_PHASE':
      case 'END_EVENT_PHASE': {
        if (this.state.pendingCourseReward || this.state.pendingCourseDeletion || this.state.pendingEventPayment || this.state.pendingEventDiscard) return this.state;
        const unused = Math.max(0, 2 - this.state.eventPlayedCount);
        const gain = unused * 2;
        if (gain > 0) {
          this.state.reviewValue += gain;
          this.state.eventMessage = `提前结束事件阶段，未使用 ${unused} 个机会，获得 ${gain} 温习值。`;
        } else {
          this.state.eventMessage = '提前结束事件阶段。';
        }
        this._finishEventPhase(command.draw || 5);
        return this.state;
      }
      case 'APPLY_PROJECT_PROGRESS_TARGET': {
        return this._applyProjectProgressTarget(command);
      }
      case 'CONFIRM_EXAM': {
        return this._confirmExam();
      }
      case 'USE_CRAM': {
        return this._useCram();
      }
      case 'USE_RETAKE': {
        return this._useRetake();
      }
      case 'TOGGLE_COURSE_REWARD_SELECTION': {
        return this._toggleCourseRewardSelection(command);
      }
      case 'CONFIRM_COURSE_REWARD': {
        return this._confirmCourseReward();
      }
      case 'REVIEW_CARD': {
        return this._reviewCard(command);
      }
      case 'RESET_REVIEW': {
        return this._resetReview();
      }
      case 'TRADE_EXAM_DRAW_FOR_PROGRESS': {
        return this._tradeExamDrawForProgress(command);
      }
      case 'END_REVIEW': {
        return this._endReview(command.draw || 5);
      }
      default:
        // 未知命令不改变 state
        return this.state;
    }
  }

  _resetTutorialGame() {
    const cards = this._buildCardsFromData();
    this.state = new GameState();
    this.state.deck = new Deck(cards);
    this.state.ownedCourses = cards.slice();
    this.state.eventDeck = new Deck(this._buildEventsFromData());
    this.state.testDeck = new Deck(this._buildTestsFromData());
    this._initializeGoals();
  }

  _findCardById(pool = [], id) {
    if (!id) return null;
    return pool.find((card) => card && (card.id === id || card._id === id || card.name === id)) || null;
  }

  _findCourseCard(id) {
    return this._findCardById([...this._buildCardsFromData(), ...(this.adcourses || [])], id);
  }
  _getCourseIdentity(card = {}) {
    return String(card._id || card.id || card.name || '');
  }

  _removeFirstMatchingCourse(list = [], target) {
    const targetIdentity = this._getCourseIdentity(target);
    const index = list.findIndex((card) => this._getCourseIdentity(card) === targetIdentity);
    if (index >= 0) return list.splice(index, 1)[0];
    return null;
  }

  _addCoursesToDeckTop(cards = []) {
    if (!this.state.deck || !Array.isArray(cards) || cards.length === 0) return;
    this.state.deck.cards.unshift(...cards);
    if (Array.isArray(this.state.deck._original)) {
      this.state.deck._original.unshift(...cards);
    }
  }

  _removeCourseEverywhere(card) {
    if (!card) return;
    if (Array.isArray(this.state.ownedCourses)) this._removeFirstMatchingCourse(this.state.ownedCourses, card);
    if (this.state.deck && Array.isArray(this.state.deck.cards)) this._removeFirstMatchingCourse(this.state.deck.cards, card);
    if (this.state.deck && Array.isArray(this.state.deck._original)) this._removeFirstMatchingCourse(this.state.deck._original, card);
  }


  _queueCourseDeletion(deletion = {}) {
    const amount = Math.max(0, Number(deletion.amount) || 0);
    if (amount <= 0 || (this.state.ownedCourses || []).length === 0) return false;
    const pending = {
      amount: Math.min(amount, this.state.ownedCourses.length),
      selectedIndices: [],
      source: deletion.source || '删除课程',
    };
    if (!this.state.pendingCourseDeletion) {
      this.state.pendingCourseDeletion = pending;
    } else {
      this.state.pendingCourseDeletionQueue = Array.isArray(this.state.pendingCourseDeletionQueue) ? this.state.pendingCourseDeletionQueue : [];
      this.state.pendingCourseDeletionQueue.push(pending);
    }
    return true;
  }

  _advanceCourseDeletionQueue() {
    const queue = Array.isArray(this.state.pendingCourseDeletionQueue) ? this.state.pendingCourseDeletionQueue : [];
    this.state.pendingCourseDeletion = queue.length > 0 ? queue.shift() : null;
    this.state.pendingCourseDeletionQueue = queue;
  }

  _toggleCourseDeletionSelection(command = {}) {
    const pending = this.state.pendingCourseDeletion;
    if (!pending) return this.state;
    const courseIndex = Number(command.courseIndex ?? 0);
    if (!this.state.ownedCourses[courseIndex]) return this.state;
    const selected = pending.selectedIndices || [];
    const existingIndex = selected.indexOf(courseIndex);
    if (existingIndex >= 0) {
      selected.splice(existingIndex, 1);
    } else if (selected.length < pending.amount) {
      selected.push(courseIndex);
    }
    pending.selectedIndices = selected;
    return this.state;
  }

  _confirmCourseDeletion() {
    const pending = this.state.pendingCourseDeletion;
    if (!pending || (pending.selectedIndices || []).length !== pending.amount) return this.state;
    const selectedCards = pending.selectedIndices
      .map((idx) => this.state.ownedCourses[idx])
      .filter(Boolean);
    selectedCards.forEach((card) => this._removeCourseEverywhere(card));
    const names = selectedCards.map((card) => card.name).join('、') || '无';
    this.state.eventResults.push({
      id: 'deleteLessons',
      name: pending.source,
      optionName: '删除课程',
      effects: [`删除课程：${names}`],
    });
    this._advanceCourseDeletionQueue();
    this._refreshFinalGoalProgress();
    return this.state;
  }
  _findEventCard(id) {
    return this._findCardById(this._buildEventsFromData(), id);
  }

  _findTestCard(id) {
    return this._findCardById(this._buildTestsFromData(), id);
  }

  _cloneTutorialCard(card, prefix, index) {
    if (!card) return null;
    return {
      ...card,
      _id: `${prefix}_${index}_${card.id || card._id || card.name}`,
    };
  }

  _setTutorialDeck(courseIds = []) {
    const cards = courseIds
      .map((id, index) => this._cloneTutorialCard(this._findCourseCard(id), 'tour_course', index))
      .filter(Boolean);
    if (cards.length === 0) return;
    this.state.deck = new Deck(cards);
    this.state.ownedCourses = cards.slice();
  }

  _setTutorialEventHand(eventIds = []) {
    this.state.eventHand = eventIds
      .map((id, index) => this._cloneTutorialCard(this._findEventCard(id), 'tour_event', index))
      .filter(Boolean);
    this._refreshEventOptionStates();
  }

  _setTutorialTest(testId, applyStart = false) {
    const test = this._cloneTutorialCard(this._findTestCard(testId), 'tour_test', 0);
    if (!test) return;
    this.state.currentTest = test;
    this.state.examRequirement = 0;
    this.state.examAchievementAward = 0;
    this.state.examDrawCount = this._getExamDrawCount(test);
    this.state.examScoreScaling = this._getExamYearScaling();
    this.state.testResults = [];
    if (applyStart && Array.isArray(test.start)) {
      const effects = this._applyEffects(test.start, this._getExamVariables({}));
      this.state.testResults.push({
        id: test._id || test.id,
        name: test.name,
        effects: effects.map((line) => `开始：${line}`),
      });
    }
  }

  _setTutorialProjects(projects = [], clear = false) {
    if (clear) this.state.activeProjects = [];
    projects.forEach((item) => {
      const projectId = typeof item === 'string' ? item : item.id;
      let project = this._findActiveProject(projectId);
      if (!project) project = this._giveProject(projectId);
      if (project && typeof item === 'object' && item.progress != null) {
        project.progress = Math.max(0, Number(item.progress) || 0);
      }
    });
  }

  _setTutorialPermanents(permanents = [], clear = false) {
    if (clear) this.state.activePermanents = [];
    permanents.forEach((id) => {
      if (!this.state.activePermanents.some((item) => item.id === id || item._id === id || item.name === id)) {
        this._givePermanent(id);
      }
    });
  }

  _clearTutorialPhase() {
    this.state.awaitingEventStart = false;
    this.state.eventStageActive = false;
    this.state.reviewStageActive = false;
    this.state.examStageActive = false;
    this.state.pendingProjectProgress = null;
    this.state.pendingProjectProgressQueue = [];
    this.state.pendingCourseReward = null;
    this.state.pendingCourseDeletion = null;
    this.state.pendingCourseDeletionQueue = [];
    this.state.pendingEventPayment = null;
    this.state.pendingEventDiscard = null;
    this.state.hand = [];
    this.state.cardResults = [];
    this.state.permanentResults = [];
  }

  _setTutorialPhase(phase, draw = 5) {
    this._clearTutorialPhase();
    this.state.eventStartDraw = draw;
    if (phase === 'briefing') {
      this.state.awaitingEventStart = true;
      return;
    }
    if (phase === 'event') {
      this.state.eventStageActive = true;
      this.state.eventPlayedCount = 0;
      this.state.eventMessage = '教程场景：选择事件卡，观察选项、费用与奖励。';
      this._refreshEventOptionStates();
      return;
    }
    if (phase === 'review') {
      this._startReviewPhase(draw);
      return;
    }
    if (phase === 'exam') {
      this._drawExamHand(draw);
    }
  }

  _setTutorialCourseReward(courseIds = [], options = {}) {
    const choices = courseIds
      .map((id, index) => this._cloneTutorialCard(this._findCourseCard(id), 'tour_reward', index))
      .filter(Boolean);
    if (choices.length === 0) return;
    this.state.pendingCourseReward = {
      source: options.source || '教程选课奖励',
      choices,
      selectnum: Math.max(1, Math.min(choices.length, Number(options.selectnum) || 1)),
      selectedIndices: [],
      shownum: choices.length,
      lessontype: options.lessontype || null,
    };
  }
  _applyTutorialSetup(command = {}) {
    if (command.reset) this._resetTutorialGame();
    if (command.semester != null) this.state.semester = Math.max(1, Number(command.semester) || 1);
    if (command.clearPermanents) this.state.activePermanents = [];
    if (Array.isArray(command.courseIds)) this._setTutorialDeck(command.courseIds);
    if (Array.isArray(command.eventIds)) this._setTutorialEventHand(command.eventIds);
    if (Array.isArray(command.projects)) this._setTutorialProjects(command.projects, !!command.clearProjects);
    if (Array.isArray(command.permanents)) this._setTutorialPermanents(command.permanents, !!command.clearPermanents);
    if (command.reviewValue != null) this.state.reviewValue = Math.max(0, Number(command.reviewValue) || 0);
    if (command.nextScoreBonus != null) this.state.nextScoreBonus = Math.max(0, Number(command.nextScoreBonus) || 0);
    if (command.achievementPoints != null) this.state.achievementPoints = Number(command.achievementPoints) || 0;
    if (Array.isArray(command.courseRewardIds)) this._setTutorialCourseReward(command.courseRewardIds, command.courseReward || {});
    if (Array.isArray(command.testIds)) {
      this.state.candidateTests = command.testIds.map((id, index) => this._cloneTutorialCard(this._findTestCard(id), 'tour_test_choice', index)).filter(Boolean);
      this.state.currentTest = null;
      this.state.selectedTestIndex = -1;
      this.state.awaitingEventStart = true;
    }
    if (command.testId) this._setTutorialTest(command.testId, !!command.applyTestStart);
    if (command.phase) this._setTutorialPhase(command.phase, command.draw || this.state.eventStartDraw || 5);
    return this.state;
  }
  _resetSemesterFlowState() {
    this.state.hand = [];
    this.state.score = 0;
    this.state.baseScore = 0;
    this.state.counts = { Theory: 0, Practice: 0, Social: 0 };
    this.state.cardResults = [];
    this.state.permanentResults = [];
    this.state.pendingProjectProgress = null;
    this.state.pendingCourseReward = null;
    this.state.examStageActive = false;
    this.state.examDrawPenalty = 0;
    this.state.reviewDrawTradeUsed = 0;
    this.state.eventStageActive = false;
    this.state.eventPlayedCount = 0;
    this.state.eventResults = [];
    this._refreshEventOptionStates();
    this.state.eventMessage = '';
    this.state.reviewStageActive = false;
    this.state.reviewPreviewCards = [];
    this.state.reviewSelectedCards = [];
    this.state.reviewPreviewCount = 0;
    this.state.reviewBaseDeck = [];
    this.state.reviewMessage = '';
    this.state.currentExamAchievementDelta = 0;
    this.state.currentExamEffectAchievementDelta = 0;
    this.state.currentExamScoreDelta = 0;
    this.state.currentExamGoalAchievementDelta = 0;
    this.state.currentExamGoalSnapshot = null;
    this.state.currentExamGoalResultLength = 0;
  }

  _prepareSemesterStart(draw = 5) {
    if (this.state.eventStageActive || this.state.reviewStageActive || this.state.examStageActive || this.state.awaitingEventStart) return;
    this._resetSemesterFlowState();
    this.state.eventStartDraw = draw;
    this._prepareSemesterTest();
    this.state.awaitingEventStart = true;
  }

  _startEventPhase(draw = 5) {
    if (!this.state.awaitingEventStart) {
      this._prepareSemesterStart(draw);
    }
    if (!this.state.currentTest) return this.state;
    this.state.awaitingEventStart = false;
    this.state.eventStartDraw = draw;
    this.state.deck.reset();
    this.state.deck.shuffle();
    this.state.eventHand.push(...this._drawFromEventDeck(3));
    this.state.eventStageActive = true;
    this.state.eventPlayedCount = 0;
    this.state.eventResults = [];
    this._refreshEventOptionStates();
    this.state.eventMessage = '保留上回合未打出的事件牌，并新抽 3 张事件卡；本学期可打出 0~2 张，也可以点击项目卡推进 1 点进度。';
  }
  _playEvent(command = {}) {
    if (this.state.pendingCourseReward || this.state.pendingCourseDeletion || this.state.pendingEventPayment) return this.state;
    if (!this.state.eventStageActive || this.state.eventPlayedCount >= 2) return this.state;
    const eventIndex = Number(command.eventIndex ?? 0);
    const optionIndex = Number(command.optionIndex ?? 0);
    const card = this.state.eventHand[eventIndex];
    if (!card) return this.state;

    const option = Array.isArray(card.options) ? card.options[optionIndex] || card.options[0] : null;
    if (!option || !this._canPayCosts(option.cost, eventIndex)) return this.state;

    const costs = Array.isArray(option.cost) ? option.cost : [];
    if (costs.length > 0) {
      this.state.pendingEventPayment = {
        eventIndex,
        optionIndex,
        selectedIndices: [],
        costText: this._describeCosts(costs),
      };
      this.state.eventMessage = `请选择用于支付 ${card.name} / ${option.name} 的事件牌。`;
      return this.state;
    }

    return this._resolveEventPlay(eventIndex, optionIndex, []);
  }

  _resolveEventPlay(eventIndex, optionIndex, selectedPaymentIndices = []) {
    const card = this.state.eventHand[eventIndex];
    if (!card) return this.state;
    const option = Array.isArray(card.options) ? card.options[optionIndex] || card.options[0] : null;
    if (!option || !this._canPayCosts(option.cost, eventIndex)) return this.state;
    if (!this._validateSelectedPaymentCosts(option.cost, eventIndex, selectedPaymentIndices)) return this.state;

    const costDetails = this._payCosts(option.cost, eventIndex, selectedPaymentIndices);
    const effectDetails = this._applyEffects(option.effects, this._getEventVariables());

    this.state.eventResults.push({
      id: card._id || card.id,
      name: card.name,
      optionName: option.name,
      effects: [...costDetails, ...effectDetails],
    });
    const playedIndex = this.state.eventHand.indexOf(card);
    if (playedIndex >= 0) {
      this.state.eventHand.splice(playedIndex, 1);
    }
    this.state.eventPlayedCount += 1;
    this.state.eventMessage = `已打出 ${card.name}。`;
    this._refreshEventOptionStates();

    return this.state;
  }

  _toggleEventPaymentCard(command = {}) {
    const pending = this.state.pendingEventPayment;
    if (!pending) return this.state;
    const cardIndex = Number(command.cardIndex ?? -1);
    if (!this._canSelectEventPaymentCard(pending, cardIndex)) return this.state;
    const selected = Array.isArray(pending.selectedIndices) ? pending.selectedIndices : [];
    const existing = selected.indexOf(cardIndex);
    if (existing >= 0) {
      selected.splice(existing, 1);
    } else if (selected.length < this._getEventPaymentRequiredCount(pending)) {
      selected.push(cardIndex);
    }
    pending.selectedIndices = selected;
    return this.state;
  }

  _confirmEventPayment() {
    const pending = this.state.pendingEventPayment;
    if (!pending) return this.state;
    const selected = Array.isArray(pending.selectedIndices) ? pending.selectedIndices.slice() : [];
    const card = this.state.eventHand[pending.eventIndex];
    const option = card && Array.isArray(card.options) ? card.options[pending.optionIndex] || card.options[0] : null;
    if (!option || !this._validateSelectedPaymentCosts(option.cost, pending.eventIndex, selected)) return this.state;
    this.state.pendingEventPayment = null;
    return this._resolveEventPlay(pending.eventIndex, pending.optionIndex, selected);
  }

  _cancelEventPayment() {
    if (!this.state.pendingEventPayment) return this.state;
    this.state.pendingEventPayment = null;
    this.state.eventMessage = '已取消支付。';
    return this.state;
  }

  _advanceProject(command = {}) {
    if (this.state.pendingCourseReward || this.state.pendingCourseDeletion) return this.state;
    if (!this.state.eventStageActive || this.state.eventPlayedCount >= 2) return this.state;
    const projectIndex = Number(command.projectIndex ?? 0);
    const project = this.state.activeProjects[projectIndex];
    if (!project) return this.state;

    project.progress = (Number(project.progress) || 0) + 1;
    this.state.eventPlayedCount += 1;
    this.state.eventResults.push({
      id: project._instanceId || project._id || project.id,
      name: project.name,
      optionName: '推进项目',
      effects: [`项目进度 +1（当前 ${project.progress}）`],
    });
    this.state.eventMessage = `推进项目 ${project.name}，进度 +1。`;

    return this.state;
  }

  _playProjectOption(command = {}) {
    if (this.state.pendingCourseReward || this.state.pendingCourseDeletion) return this.state;
    const projectIndex = Number(command.projectIndex ?? 0);
    const optionIndex = Number(command.optionIndex ?? 0);
    const project = this.state.activeProjects[projectIndex];
    if (!project) return this.state;

    const option = Array.isArray(project.options) ? project.options[optionIndex] : null;
    if (!option || !this._canUseProjectOption(project, option, optionIndex)) return this.state;

    const vars = this._getProjectVariables(project);
    const effectDetails = this._applyEffects(option.effects, vars);
    const resolutionType = this._getProjectOptionType(option);
    const resolutionDetails = this._resolveProjectOption(projectIndex, project, option, optionIndex, resolutionType);
    this.state.eventResults.push({
      id: project._instanceId || project._id || project.id,
      name: project.name,
      optionName: option.name,
      effects: [...effectDetails, ...resolutionDetails],
    });
    this.state.eventMessage = `完成项目 ${project.name}：${option.name}。`;
    return this.state;
  }

  _giveProject(projectName) {
    const project = this._findProject(projectName);
    if (!project) return null;

    const placedProject = {
      ...project,
      _instanceId: `project${this.state.activeProjects.length + 1}_${project.id || project._id}`,
      progress: 0,
    };
    this.state.activeProjects.push(placedProject);
    this._checkImmediateGoals();
    this._refreshFinalGoalProgress();
    return placedProject;
  }

  _findProject(projectName) {
    if (!projectName) return null;
    const aliases = {
      pro_robotmaster: 'project_robotmaster',
      pro_ICPC: 'project_icpc',
      pro_icpc: 'project_icpc',
      pro_group: 'project_group',
      pro_teach: 'project_teach',
      pro_research: 'project_research',
      pro_company: 'project_company',
      pro_startup: 'project_startup',
    };
    const normalizedName = aliases[projectName] || projectName;
    return this.projects.find((project) => {
      const id = project.id || project._id;
      return id === projectName || id === normalizedName || project.name === projectName || project.name === normalizedName;
    }) || null;
  }
  _findActiveProject(projectName) {
    if (!projectName) return null;
    const template = this._findProject(projectName);
    const ids = [projectName];
    if (template) ids.push(template.id, template._id, template.name);
    for (let i = this.state.activeProjects.length - 1; i >= 0; i -= 1) {
      const project = this.state.activeProjects[i];
      if (ids.includes(project.id) || ids.includes(project._id) || ids.includes(project.name)) return project;
    }
    return null;
  }


  _givePermanent(permanentName) {
    const permanent = this._findPermanent(permanentName);
    if (!permanent) return null;

    const placedPermanent = {
      ...permanent,
      _instanceId: `permanent${this.state.activePermanents.length + 1}_${permanent.id || permanent._id}`,
    };
    this.state.activePermanents.push(placedPermanent);
    if ((this.state.immediateGoals || []).length > 0) {
      this.state.earnedPermanentCount += 1;
      this._checkImmediateGoals();
    }
    this._refreshFinalGoalProgress();
    return placedPermanent;
  }

  _findPermanent(permanentName) {
    if (!permanentName) return null;
    return this.permanents.find((permanent) => {
      const id = permanent.id || permanent._id;
      return id === permanentName || permanent.name === permanentName;
    }) || null;
  }
  _drawTestCard() {
    if (!this.state.testDeck) return null;
    if (this.state.testDeck.remaining() <= 0) {
      this.state.testDeck.reset();
      this.state.testDeck.shuffle();
    }
    return this.state.testDeck.draw(1)[0] || null;
  }

  _drawTestChoices(count = 2) {
    const choices = [];
    while (choices.length < count) {
      const test = this._drawTestCard();
      if (!test) break;
      choices.push(test);
    }
    return choices;
  }

  _prepareSemesterTest() {
    this.state.candidateTests = this._drawTestChoices(2);
    this.state.currentTest = null;
    this.state.selectedTestIndex = -1;
    this.state.examRequirement = 0;
    this.state.examAchievementAward = 0;
    this.state.examDrawCount = 0;
    this.state.examScoreScaling = this._getExamYearScaling();
    this.state.testResults = [];
    this.state.examRandomSymbol = null;
    this.state.examTempSymbols = { theory: 0, practice: 0, social: 0 };
    this.state.doublePermanentEffectsActive = false;
  }

  _selectTest(index = 0) {
    if (!this.state.awaitingEventStart || this.state.currentTest) return this.state;
    const choiceIndex = Math.max(0, Number(index) || 0);
    const test = (this.state.candidateTests || [])[choiceIndex];
    if (!test) return this.state;
    this.state.currentTest = test;
    this.state.selectedTestIndex = choiceIndex;
    this.state.examRequirement = 0;
    this.state.examAchievementAward = 0;
    this.state.examDrawCount = this._getExamDrawCount(test);
    this.state.examScoreScaling = this._getExamScoreScaling(test);
    this.state.testResults = [];
    this.state.examRandomSymbol = null;
    this.state.examTempSymbols = { theory: 0, practice: 0, social: 0 };
    this.state.doublePermanentEffectsActive = false;
    this._applySelectedTestStart();
    return this.state;
  }

  _rerollExamChoices() {
    if (this.state.examRerollUsed || !this.state.awaitingEventStart || this.state.currentTest) return this.state;
    this.state.examRerollUsed = true;
    this.state.candidateTests = this._drawTestChoices(2);
    this.state.selectedTestIndex = -1;
    this.state.testResults = [];
    return this.state;
  }

  _applySelectedTestStart() {
    const test = this.state.currentTest;
    if (test && Array.isArray(test.start)) {
      const effects = this._applyEffects(test.start, this._getExamVariables({}));
      this.state.testResults.push({
        id: test._id || test.id,
        name: test.name,
        effects: effects.map((line) => '开始：' + line),
      });
    }
  }

  _getExamYear() {
    return Math.max(1, Math.ceil((Number(this.state.semester) || 1) / 2));
  }

  _getExamYearScaling() {
    const year = this._getExamYear();
    if (year <= 1) return 1;
    if (year === 2) return 1.5;
    if (year === 3) return 2;
    return 2.5;
  }

  _getExamBaseRequirement() {
    return 10;
  }

  _getExamScoreScaling(test = this.state.currentTest) {
    const legacyRequirement = Number(test && (test.requirement ?? test.baseRequirement ?? test.baserequirement));
    const cardScaling = Number(test && test.scorescaling) || (legacyRequirement > 0 ? legacyRequirement / 10 : 1);
    return cardScaling * this._getExamYearScaling();
  }

  _getAchievementTable(test = this.state.currentTest) {
    if (test && Array.isArray(test.achievementTable)) return test.achievementTable;
    const mode = String((test && test.achievementMode) || 'normal').toLowerCase();
    if (mode === 'easy') return [
      { multiplier: 3, achievement: 5 },
      { multiplier: 2, achievement: 4 },
      { multiplier: 1.5, achievement: 3 },
      { multiplier: 1, achievement: 1 },
    ];
    if (mode === 'hard') return [
      { multiplier: 3, achievement: 12 },
      { multiplier: 2, achievement: 8 },
      { multiplier: 1.5, achievement: 5 },
      { multiplier: 1, achievement: 2 },
    ];
    return [
      { multiplier: 3, achievement: 8 },
      { multiplier: 2, achievement: 6 },
      { multiplier: 1.5, achievement: 4 },
      { multiplier: 1, achievement: 1 },
    ];
  }

  _getExamDrawCount(test = this.state.currentTest) {
    const base = Number(test && test.drawnum) || 5;
    const upperBonus = (Number(this.state.semester) || 1) % 2 === 1 ? 1 : 0;
    const penalty = Number(this.state.examDrawPenalty) || 0;
    return Math.max(1, base + upperBonus - penalty);
  }

  _getExamVariables(counts = {}) {
    return {
      theory: Number(counts.theory ?? this.state.counts.Theory ?? 0),
      practice: Number(counts.practice ?? this.state.counts.Practice ?? 0),
      social: Number(counts.social ?? this.state.counts.Social ?? 0),
      progress: this.state.examStartProgress || 0,
      project: (this.state.activeProjects || []).length,
      permanent: (this.state.activePermanents || []).length,
      completedProject: this.state.completedProjectCount || 0,
      completepro: this.state.completedProjectCount || 0,
      eventHand: (this.state.eventHand || []).length,
      randomSymbol: this.state.examRandomSymbol ? Number(counts[this.state.examRandomSymbol] ?? this.state.counts[this._capitalizeSymbol(this.state.examRandomSymbol)] ?? 0) : 0,
      randomSymbolName: this.state.examRandomSymbol || '',
      semester: this.state.semester,
      achievement: this.state.achievementPoints,
      review: this.state.reviewValue,
      baseScore: this.state.baseScore || 0,
    };
  }

  _getExamAchievement(score) {
    const passLine = Math.floor(this._getExamBaseRequirement() * this._getExamScoreScaling());
    const thresholds = this._getAchievementTable().map((item) => ({
      score: Math.floor(Number(item.score ?? (passLine * (Number(item.multiplier) || 1))) || passLine),
      achievement: Number(item.achievement) || 0,
    })).sort((a, b) => b.score - a.score);
    const passed = thresholds.find((item) => score >= item.score);
    if (passed) return { requirement: passLine, achievement: passed.achievement, passed: true, achievedScore: passed.score };
    return { requirement: passLine, achievement: -5, passed: false, achievedScore: 0 };
  }
  _isEventEligibleForSemester(event, semester = this.state.semester) {
    const rule = event && event.semester;
    if (rule == null || rule === '') return true;
    const current = Number(semester) || 1;
    if (Array.isArray(rule)) return rule.map(Number).includes(current);
    if (typeof rule === 'number') return current === rule;
    return String(rule).split('/').some((part) => {
      const text = part.trim();
      if (!text) return false;
      if (text.includes('-')) {
        const [start, end] = text.split('-').map((value) => Number(value.trim()));
        return current >= start && current <= end;
      }
      return current === Number(text);
    });
  }

  _pickWeightedEventIndex(indices) {
    const totalWeight = indices.reduce((sum, idx) => {
      const weight = Number(this.state.eventDeck.cards[idx]?.weight ?? 1);
      return sum + Math.max(0, weight || 0);
    }, 0);
    if (totalWeight <= 0) return indices[Math.floor(Math.random() * indices.length)];

    let roll = Math.random() * totalWeight;
    for (const idx of indices) {
      const weight = Math.max(0, Number(this.state.eventDeck.cards[idx]?.weight ?? 1) || 0);
      roll -= weight;
      if (roll <= 0) return idx;
    }
    return indices[indices.length - 1];
  }

  _drawWeightedEventCard() {
    if (!this.state.eventDeck) return null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const eligible = this.state.eventDeck.cards.reduce((indices, event, idx) => {
        if (this._isEventEligibleForSemester(event)) indices.push(idx);
        return indices;
      }, []);
      if (eligible.length > 0) {
        const pickedIndex = this._pickWeightedEventIndex(eligible);
        return this.state.eventDeck.cards.splice(pickedIndex, 1)[0] || null;
      }
      this.state.eventDeck.reset();
    }
    return null;
  }

  _drawFromEventDeck(drawCount = 0) {
    const count = Math.max(0, Number(drawCount) || 0);
    const drawn = [];
    while (drawn.length < count) {
      const card = this._drawWeightedEventCard();
      if (!card) break;
      drawn.push(card);
    }
    return drawn;
  }
  _drawEventCards(drawCount = 0) {
    return this._drawFromEventDeck(drawCount);
  }

  _queueProjectProgress(progress = {}) {
    const amount = Number(progress.amount) || 0;
    if (amount <= 0 || (this.state.activeProjects || []).length === 0) return false;
    const pending = {
      amount,
      source: progress.source || '效果',
      projectType: progress.projectType || null,
    };
    if (!this.state.pendingProjectProgress) {
      this.state.pendingProjectProgress = pending;
    } else {
      this.state.pendingProjectProgressQueue = Array.isArray(this.state.pendingProjectProgressQueue) ? this.state.pendingProjectProgressQueue : [];
      this.state.pendingProjectProgressQueue.push(pending);
    }
    return true;
  }

  _advanceProjectProgressQueue() {
    const queue = Array.isArray(this.state.pendingProjectProgressQueue) ? this.state.pendingProjectProgressQueue : [];
    this.state.pendingProjectProgress = queue.length > 0 ? queue.shift() : null;
    this.state.pendingProjectProgressQueue = queue;
  }
  _applyEffects(effects = [], vars = {}) {
    const effectDetails = [];
    if (!Array.isArray(effects)) return effectDetails;

    effects.forEach((effect) => {
      switch (effect.effectType) {
        case 'addAchievement': {
          const value = this._resolveValue(effect.input, vars);
          const addValue = (Number(value) || 0) * (effect.multi || 1);
          this.state.achievementPoints += addValue;
          effectDetails.push(`成就点 +${addValue}`);
          break;
        }
        case 'addReview': {
          const value = this._resolveValue(effect.input, vars);
          const addValue = (Number(value) || 0) * (effect.multi || 1);
          this.state.reviewValue += addValue;
          effectDetails.push(`温习值 +${addValue}`);
          break;
        }
        case 'addNextScore': {
          const value = this._resolveValue(effect.input, vars);
          const addValue = (Number(value) || 0) * (effect.multi || 1);
          this.state.nextScoreBonus += addValue;
          effectDetails.push(`下次考试分数 +${addValue}`);
          break;
        }
        case 'addSymbol': {
          const symbol = String(effect.input || '').toLowerCase();
          const addValue = Math.max(0, Number(effect.amount ?? effect.multi ?? 1) || 0);
          this.state.examTempSymbols = this.state.examTempSymbols || { theory: 0, practice: 0, social: 0 };
          if (Object.prototype.hasOwnProperty.call(this.state.examTempSymbols, symbol)) {
            this.state.examTempSymbols[symbol] += addValue;
            effectDetails.push('本次考试' + symbol + '符号 +' + addValue);
          } else {
            effectDetails.push('未知符号：' + effect.input);
          }
          break;
        }
        case 'randomExamSymbol': {
          const symbols = ['theory', 'practice', 'social'];
          const picked = symbols[Math.floor(Math.random() * symbols.length)];
          this.state.examRandomSymbol = picked;
          if (effect.output) vars[effect.output] = picked;
          effectDetails.push('随机考试符号：' + picked);
          break;
        }
        case 'doublePermanentEffects': {
          this.state.doublePermanentEffectsActive = true;
          effectDetails.push('本次考试成果效果翻倍');
          break;
        }
        case 'drawEvent': {
          const value = this._resolveValue(effect.num, vars);
          const drawCount = Math.max(0, Number(value) || 0);
          const drawn = this._drawEventCards(drawCount);
          this.state.eventHand.push(...drawn);
          effectDetails.push(`抽事件卡 +${drawn.length}`);
          break;
        }
        case 'giveProject': {
          const project = this._giveProject(effect.name);
          effectDetails.push(project ? `获得项目：${project.name}` : `未找到项目：${effect.name}`);
          break;
        }
        case 'givePermanent': {
          const permanent = this._givePermanent(effect.name);
          effectDetails.push(permanent ? `获得成果：${permanent.name}` : `未找到成果：${effect.name}`);
          break;
        }
        case 'giveProgress':
        case 'addProjectProgress': {
          const amount = Math.max(0, Number(this._resolveValue(effect.input ?? effect.num ?? 1, vars)) || 0) * (effect.multi || 1);
          if (this.state.activeProjects.length > 0 && amount > 0) {
            this._queueProjectProgress({ amount, source: effect.source || '事件效果', projectType: effect.type || null });
            effectDetails.push(effect.type ? `等待选择 ${effect.type} 项目：进度 +${amount}` : `等待选择项目：进度 +${amount}`);
          } else {
            effectDetails.push('没有可推进的项目');
          }
          break;
        }
        case 'giveProgressOn': {
          const amount = Math.max(0, Number(this._resolveValue(effect.input ?? effect.num ?? 1, vars)) || 0) * (effect.multi || 1);
          const project = this._findActiveProject(effect.name || effect.target);
          if (project && amount > 0) {
            project.progress = (Number(project.progress) || 0) + amount;
            effectDetails.push(`${project.name} 进度 +${amount}（当前 ${project.progress}）`);
          } else {
            effectDetails.push(`未找到可推进项目：${effect.name || effect.target || ''}`);
          }
          break;
        }
        case 'deleteLessons': {
          const amount = Math.max(0, Number(this._resolveValue(effect.input ?? effect.num ?? 1, vars)) || 0);
          if (this._queueCourseDeletion({ amount, source: effect.source || '效果' })) {
            effectDetails.push('等待选择删除 ' + Math.min(amount, this.state.ownedCourses.length) + ' 门课程');
          } else {
            effectDetails.push('没有可删除的课程');
          }
          break;
        }
        case 'sReward': {
          const reward = this._startCourseReward(effect, vars);
          effectDetails.push(reward ? `高级课程奖励：从 ${reward.choices.length} 张中选择 ${reward.selectnum} 张加入牌堆顶` : '高级课程奖励：没有可选课程');
          break;
        }
        default:
          effectDetails.push(effect.effectType || '未知效果');
          break;
      }
    });

    return effectDetails;
  }

  _refreshEventOptionStates() {
    this.state.eventOptionStates = (this.state.eventHand || []).map((event, eventIndex) => {
      const options = Array.isArray(event.options) ? event.options : [];
      return options.map((option) => ({
        canPay: this._canPayCosts(option.cost, eventIndex),
        costText: this._describeCosts(option.cost),
      }));
    });
  }

  _describeCosts(costs = []) {
    if (!Array.isArray(costs) || costs.length === 0) return '';
    return costs.map((cost) => {
      const amount = Number(cost.amount ?? cost.num ?? 1) || 0;
      if (cost.type === 'symbolCost') return `花费 ${amount} 张 ${cost.symbol} 事件牌`;
      if (cost.type === 'discardEvent') return cost.symbol ? `弃置 ${amount} 张 ${cost.symbol} 事件牌` : `弃置 ${amount} 张事件牌`;
      if (['eventCost', 'cardCost', 'anyCost', 'anyEventCost'].includes(cost.type)) return `花费 ${amount} 张事件牌`;
      return cost.type || '未知花费';
    }).join('；');
  }

  _canPayCosts(costs = [], eventIndex = -1) {
    if (!Array.isArray(costs) || costs.length === 0) return true;
    const reservedEvents = new Set();
    for (const cost of costs) {
      const amount = Math.max(0, Number(cost.amount ?? cost.num ?? 1) || 0);
      const matches = this._findCostPaymentIndices(cost, eventIndex, reservedEvents);
      if (matches.length < amount) return false;
      matches.slice(0, amount).forEach((idx) => reservedEvents.add(idx));
    }
    return true;
  }

  _isEventPaymentCost(cost = {}) {
    return cost.type === 'symbolCost' || cost.type === 'discardEvent' || ['eventCost', 'cardCost', 'anyCost', 'anyEventCost'].includes(cost.type);
  }

  _matchesEventPaymentCost(event, cost = {}) {
    if (!event || !this._isEventPaymentCost(cost)) return false;
    if (cost.type === 'symbolCost' || cost.type === 'discardEvent') return !cost.symbol || event.symbol === cost.symbol;
    return true;
  }

  _getEventPaymentRequiredCount(pendingOrCosts = {}) {
    const costs = Array.isArray(pendingOrCosts) ? pendingOrCosts : this._getPendingEventOption(pendingOrCosts)?.cost;
    if (!Array.isArray(costs)) return 0;
    return costs.reduce((sum, cost) => this._isEventPaymentCost(cost) ? sum + (Math.max(0, Number(cost.amount ?? cost.num ?? 1) || 0)) : sum, 0);
  }

  _getPendingEventOption(pending = this.state.pendingEventPayment) {
    if (!pending) return null;
    const card = this.state.eventHand[pending.eventIndex];
    return card && Array.isArray(card.options) ? card.options[pending.optionIndex] || card.options[0] : null;
  }
  _canSelectEventPaymentCard(pending, cardIndex) {
    if (!pending || cardIndex === pending.eventIndex) return false;
    const card = this.state.eventHand[cardIndex];
    const option = this._getPendingEventOption(pending);
    const costs = option && Array.isArray(option.cost) ? option.cost : [];
    return costs.some((cost) => this._matchesEventPaymentCost(card, cost));
  }

  _validateSelectedPaymentCosts(costs = [], eventIndex = -1, selectedIndices = []) {
    const selected = [...new Set((selectedIndices || []).map((idx) => Number(idx)))];
    if (selected.some((idx) => idx === eventIndex || !this.state.eventHand[idx])) return false;
    const used = new Set();
    let selectedEventCostCount = 0;
    for (const cost of (Array.isArray(costs) ? costs : [])) {
      const amount = Math.max(0, Number(cost.amount ?? cost.num ?? 1) || 0);
      if (!this._isEventPaymentCost(cost)) continue;
      selectedEventCostCount += amount;
      for (let i = 0; i < amount; i += 1) {
        const found = selected.find((idx) => !used.has(idx) && this._matchesEventPaymentCost(this.state.eventHand[idx], cost));
        if (found == null) return false;
        used.add(found);
      }
    }
    return selected.length === selectedEventCostCount;
  }

  _payCosts(costs = [], eventIndex = -1, selectedPaymentIndices = []) {
    if (!Array.isArray(costs) || costs.length === 0) return [];
    const selected = [...new Set((selectedPaymentIndices || []).map((idx) => Number(idx)))];
    const used = new Set();
    const paidIndices = [];
    const details = [];

    costs.forEach((cost) => {
      const amount = Math.max(0, Number(cost.amount ?? cost.num ?? 1) || 0);
      if (!this._isEventPaymentCost(cost)) return;
      const matches = [];
      for (let i = 0; i < amount; i += 1) {
        const found = selected.find((idx) => !used.has(idx) && this._matchesEventPaymentCost(this.state.eventHand[idx], cost));
        if (found == null) break;
        used.add(found);
        matches.push(found);
        paidIndices.push(found);
      }
      if (matches.length > 0) {
        details.push(`支付花费：弃置 ${matches.map((idx) => this.state.eventHand[idx]?.name).filter(Boolean).join('、')}`);
      }
    });

    [...new Set(paidIndices)].sort((a, b) => b - a).forEach((idx) => {
      this.state.eventHand.splice(idx, 1);
    });
    return details;
  }

  _findCostPaymentIndices(cost = {}, eventIndex = -1, reserved = new Set()) {
    return (this.state.eventHand || []).reduce((indices, event, idx) => {
      if (idx === eventIndex || reserved.has(idx)) return indices;
      if (cost.type === 'symbolCost' || cost.type === 'discardEvent') {
        if (!cost.symbol || event.symbol === cost.symbol) indices.push(idx);
        return indices;
      }
      if (['eventCost', 'cardCost', 'anyCost', 'anyEventCost'].includes(cost.type)) {
        indices.push(idx);
      }
      return indices;
    }, []);
  }
  _getProjectOptionType(option = {}) {
    return ['consume', 'remove', 'milestone'].includes(option.type) ? option.type : 'remove';
  }

  _getProjectOptionKey(option = {}, optionIndex = 0) {
    return option.id || option.name || `option_${optionIndex}`;
  }

  _hasUsedProjectMilestone(project, option, optionIndex = 0) {
    const used = project._usedMilestones || [];
    return used.includes(this._getProjectOptionKey(option, optionIndex));
  }

  _resolveProjectOption(projectIndex, project, option, optionIndex, resolutionType) {
    switch (resolutionType) {
      case 'consume': {
        const consumed = Number(project.progress) || 0;
        project.progress = 0;
        return [`消耗全部推进（${consumed}）`];
      }
      case 'milestone': {
        const key = this._getProjectOptionKey(option, optionIndex);
        project._usedMilestones = Array.isArray(project._usedMilestones) ? project._usedMilestones : [];
        if (!project._usedMilestones.includes(key)) {
          project._usedMilestones.push(key);
        }
        return ['里程碑已完成（限一次）'];
      }
      case 'remove':
      default:
        this.state.completedProjectCount += 1;
        if ((Number(option.require) || 0) >= 8) {
          this.state.completedLargeProjectCount += 1;
        }
        this.state.activeProjects.splice(projectIndex, 1);
        this._checkImmediateGoals();
        return ['移除项目卡'];
    }
  }
  _getProjectVariables(project) {
    return {
      ...this._getEventVariables(),
      local_progress: Number(project.progress) || 0,
    };
  }

  _canUseProjectOption(project, option, optionIndex = 0) {
    if (!option) return false;
    if (this._getProjectOptionType(option) === 'milestone' && this._hasUsedProjectMilestone(project, option, optionIndex)) return false;
    const progress = Number(project.progress) || 0;
    if (option.require == null) return true;
    if (option.require === 'local_progress') return progress > 0;
    return progress >= this._resolveValue(option.require, this._getProjectVariables(project));
  }

  _applyProjectProgressTarget(command = {}) {
    const pending = this.state.pendingProjectProgress;
    if (!pending) return this.state;

    const projectIndex = Number(command.projectIndex ?? 0);
    const project = this.state.activeProjects[projectIndex];
    if (!project) return this.state;

    const baseAmount = Number(pending.amount) || 0;
    const matchedType = !!pending.projectType && project.type === pending.projectType;
    const amount = matchedType ? baseAmount * 2 : baseAmount;
    project.progress = (Number(project.progress) || 0) + amount;
    this.state.eventResults.push({
      id: project._instanceId || project._id || project.id,
      name: project.name,
      optionName: pending.source || '课程效果',
      effects: [`项目进度 +${amount}（当前 ${project.progress}）`],
    });
    this._advanceProjectProgressQueue();
    this._refreshFinalGoalProgress();
    return this.state;
  }
  _startCourseReward(effect = {}, vars = {}) {
    const shownum = Math.max(0, Number(this._resolveValue(effect.shownum ?? 3, vars)) || 0);
    const selectnum = Math.max(0, Number(this._resolveValue(effect.selectnum ?? 1, vars)) || 0);
    let candidates = this.adcourses.slice();

    if (effect.lessontype) {
      const lessonType = String(effect.lessontype).toLowerCase();
      candidates = candidates.filter((course) => {
        const symbols = course.symbols || {};
        return String(course.type || '').toLowerCase() === lessonType
          || (lessonType === 'theory' && Number(symbols.Theory || 0) > 0)
          || (lessonType === 'practice' && Number(symbols.Practice || 0) > 0)
          || (lessonType === 'social' && Number(symbols.Social || 0) > 0);
      });
    }

    if (effect.symbols && typeof effect.symbols === 'object') {
      candidates = candidates.filter((course) => Object.entries(effect.symbols).every(([symbol, amount]) => {
        return Number((course.symbols || {})[symbol] || 0) >= Number(amount || 0);
      }));
    }

    const shuffled = candidates.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const choices = shuffled.slice(0, shownum).map((course, i) => ({
      ...course,
      _choiceId: `courseReward_${this.state.semester}_${i}_${course.id || course._id}`,
    }));
    if (choices.length === 0 || selectnum <= 0) return null;

    this.state.pendingCourseReward = {
      source: effect.source || '课程奖励',
      selectnum: Math.min(selectnum, choices.length),
      choices,
      selectedIndices: [],
    };
    return this.state.pendingCourseReward;
  }

  _toggleCourseRewardSelection(command = {}) {
    const pending = this.state.pendingCourseReward;
    if (!pending) return this.state;

    const choiceIndex = Number(command.choiceIndex ?? 0);
    if (!pending.choices[choiceIndex]) return this.state;

    const existingIndex = pending.selectedIndices.indexOf(choiceIndex);
    if (existingIndex >= 0) {
      pending.selectedIndices.splice(existingIndex, 1);
    } else if (pending.selectedIndices.length < pending.selectnum) {
      pending.selectedIndices.push(choiceIndex);
    }
    return this.state;
  }

  _confirmCourseReward() {
    const pending = this.state.pendingCourseReward;
    if (!pending || pending.selectedIndices.length !== pending.selectnum) return this.state;

    const selectedCards = pending.selectedIndices.map((choiceIndex, i) => {
      const course = pending.choices[choiceIndex];
      return {
        ...course,
        _id: `reward_${this.state.semester}_${i}_${course.id || course._id}`,
      };
    });
    this._addCoursesToDeckTop(selectedCards);
    this.state.ownedCourses.push(...selectedCards);
    this.state.acquiredCourseCount += selectedCards.length;
    this._checkImmediateGoals();
    this.state.eventResults.push({
      id: 'sReward',
      name: pending.source,
      optionName: '课程奖励',
      effects: [`置于牌堆顶：${selectedCards.map((card) => card.name).join('、')}`],
    });
    this.state.pendingCourseReward = null;
    this._refreshFinalGoalProgress();
    return this.state;
  }
  _finishEventPhase(draw = 5) {
    if (this.state.pendingCourseReward || this.state.pendingEventDiscard) return;
    const beforeCount = (this.state.eventHand || []).length;
    this.state.eventStageActive = false;
    if (beforeCount > 3) {
      const discardCount = beforeCount - 3;
      this.state.pendingEventDiscard = {
        discardCount,
        selectedIndices: [],
        nextDraw: draw,
      };
      this.state.eventMessage = `事件阶段结束：请选择 ${discardCount} 张事件卡弃置，保留 3 张进入下学期。`;
      return;
    }
    this._startReviewPhase(draw);
  }

  _toggleEventDiscardCard(command = {}) {
    const pending = this.state.pendingEventDiscard;
    if (!pending) return this.state;
    const cardIndex = Number(command.cardIndex ?? 0);
    if (!this.state.eventHand[cardIndex]) return this.state;
    const selected = pending.selectedIndices || [];
    const existingIndex = selected.indexOf(cardIndex);
    if (existingIndex >= 0) {
      selected.splice(existingIndex, 1);
    } else if (selected.length < pending.discardCount) {
      selected.push(cardIndex);
    }
    pending.selectedIndices = selected;
    return this.state;
  }

  _confirmEventDiscard() {
    const pending = this.state.pendingEventDiscard;
    if (!pending || (pending.selectedIndices || []).length !== pending.discardCount) return this.state;
    const indices = pending.selectedIndices.slice().sort((a, b) => b - a);
    const discarded = [];
    indices.forEach((index) => {
      const card = this.state.eventHand.splice(index, 1)[0];
      if (card) discarded.unshift(card);
    });
    this.state.eventResults.push({
      id: 'event_hand_limit',
      name: '事件阶段结束',
      optionName: '手牌上限',
      effects: [`事件手牌超过 3 张，弃置：${discarded.map((card) => card.name).join('、')}`],
    });
    this.state.eventMessage = `事件阶段结束，保留 ${this.state.eventHand.length} 张事件卡。`;
    const nextDraw = pending.nextDraw || 5;
    this.state.pendingEventDiscard = null;
    this._startReviewPhase(nextDraw);
    return this.state;
  }
  _startReviewPhase(draw = 5) {
    const previewCount = Math.min(Math.max(0, this.state.reviewValue), Math.max(0, this.state.deck.cards.length));
    this.state.reviewBaseDeck = this.state.deck.cards.slice();
    this.state.reviewSelectedCards = [];
    this.state.reviewPreviewCards = previewCount > 0 ? this.state.reviewBaseDeck.slice(-previewCount) : [];
    this.state.reviewPreviewCount = previewCount;
    this.state.reviewStageActive = true;
    this.state.reviewMessage = `温习阶段：查看底部 ${previewCount} 张牌，可点击任意数量移到顶部。`;
  }

  _reviewCard(command = {}) {
    if (!this.state.reviewStageActive) return this.state;
    const cardIndex = Number(command.cardIndex ?? 0);
    const card = this.state.reviewPreviewCards[cardIndex];
    if (!card) return this.state;

    this.state.reviewSelectedCards.push(card);
    this.state.reviewPreviewCards.splice(cardIndex, 1);
    this.state.reviewMessage = `已将 ${card.name} 放到顶部。`;
    return this.state;
  }

  _resetReview() {
    if (!this.state.reviewStageActive) return this.state;
    this.state.deck.cards = this.state.reviewBaseDeck.slice();
    const previewCount = this.state.reviewPreviewCount;
    this.state.reviewSelectedCards = [];
    this.state.reviewPreviewCards = previewCount > 0 ? this.state.reviewBaseDeck.slice(-previewCount) : [];
    this.state.reviewMessage = '已重置温习流程。';
    return this.state;
  }


  _tradeExamDrawForProgress(command = {}) {
    if (!this.state.reviewStageActive || this.state.pendingProjectProgress || this.state.pendingCourseReward) return this.state;
    if ((this.state.activeProjects || []).length === 0) return this.state;

    const amount = Math.max(1, Math.min(2, Number(command.amount) || 1));
    const used = Number(this.state.reviewDrawTradeUsed) || 0;
    if (used + amount > 2) return this.state;

    this.state.reviewDrawTradeUsed = used + amount;
    this.state.examDrawPenalty = (Number(this.state.examDrawPenalty) || 0) + amount;
    this.state.examDrawCount = this._getExamDrawCount();
    this.state.pendingProjectProgress = {
      amount,
      source: '温习换推进',
    };
    this.state.reviewMessage = `本次考试少抽 ${this.state.examDrawPenalty} 张；请选择项目获得 ${amount} 点推进。`;
    return this.state;
  }
  _endReview(draw = 5) {
    if (this.state.pendingCourseReward || this.state.pendingCourseDeletion) return this.state;
    if (!this.state.reviewStageActive) {
      this._drawExamHand(draw);
      return this.state;
    }

    const selected = this.state.reviewSelectedCards.slice();
    const previewCount = this.state.reviewPreviewCount;
    const rest = this.state.reviewBaseDeck.slice(0, Math.max(0, this.state.reviewBaseDeck.length - previewCount));
    const remainingPreview = this.state.reviewPreviewCards.slice();
    this.state.deck.cards = [...selected, ...rest, ...remainingPreview];
    this.state.reviewStageActive = false;
    this.state.reviewPreviewCards = [];
    this.state.reviewSelectedCards = [];
    this.state.reviewPreviewCount = 0;
    this.state.reviewMessage = '温习结束。';
    this._drawExamHand(draw);
    return this.state;
  }

  _countProjectProgress() {
    return (this.state.activeProjects || []).reduce((sum, project) => sum + (Number(project.progress) || 0), 0);
  }
  _drawExamHand(draw = 5, options = {}) {
    this.state.examStartProgress = this._countProjectProgress();
    const drawCount = this._getExamDrawCount();
    this.state.examDrawCount = drawCount;
    this.state.examScoreScaling = this._getExamScoreScaling();
    if (options.preserveAppliedBonus) {
      this.state.appliedNextScoreBonus = Number(options.appliedNextScoreBonus) || 0;
    } else {
      this.state.appliedNextScoreBonus = Number(this.state.nextScoreBonus) || 0;
      this.state.nextScoreBonus = 0;
    }
    this.state.hand = this.state.deck.draw(drawCount);
    this.state.reviewStageActive = false;
    this.state.ignoreExamSideEffects = !!options.ignoreSideEffects;
    this._recalculate({ ignoreSideEffects: !!options.ignoreSideEffects });
    this.state.ignoreExamSideEffects = false;
    this.state.examStageActive = true;

    const result = this._getExamAchievement(this.state.score);
    this.state.examRequirement = result.requirement;
    this.state.examAchievementAward = result.achievement;
    if ((Number(this.state.semester) || 1) >= 8) this.state.finalExamAchievementAward = result.achievement;
    this.state.achievementPoints += result.achievement;
    this.state.currentExamAchievementDelta = (Number(this.state.currentExamAchievementDelta) || 0) + result.achievement;
    if (result.passed) {
      this.state.lastAchievement = `第 ${this.state.semester} 学期考试达标，获得 ${result.achievement} 个成就点。`;
    } else {
      this.state.lastAchievement = `第 ${this.state.semester} 学期考试未达最低要求 ${result.requirement}，扣除 5 个成就点。`;
    }
    const resultEffects = this.state.currentTest && Array.isArray(this.state.currentTest.result) ? this.state.currentTest.result : [];
    if (resultEffects.length > 0) {
      const resultVars = {
        ...this._getExamVariables({
          theory: this.state.counts.Theory || 0,
          practice: this.state.counts.Practice || 0,
          social: this.state.counts.Social || 0,
        }),
        passed: result.passed ? 1 : 0,
        score: this.state.score || 0,
        requirement: result.requirement,
      };
      const resultOutcome = this._applyScoringEffects(resultEffects, resultVars, (this.state.currentTest.name || '考试') + '结果', { ignoreSideEffects: !!options.ignoreSideEffects });
      this.state.score += Number(resultOutcome.score) || 0;
      this.state.achievementPoints += Number(resultOutcome.achievement) || 0;
      this.state.currentExamEffectAchievementDelta = (Number(this.state.currentExamEffectAchievementDelta) || 0) + (Number(resultOutcome.achievement) || 0);
      this.state.testResults.push({
        id: (this.state.currentTest.id || this.state.currentTest._id || 'test') + '_result',
        name: (this.state.currentTest.name || '考试') + '结果',
        score: Number(resultOutcome.score) || 0,
        achievement: Number(resultOutcome.achievement) || 0,
        effects: resultOutcome.details,
      });
    }
    this.state.totalExamScore += this.state.score;
    this.state.examHistory = Array.isArray(this.state.examHistory) ? this.state.examHistory : [];
    this.state.examHistory.push({
      semester: this.state.semester,
      testName: this.state.currentTest ? this.state.currentTest.name : '未知',
      score: this.state.score,
      achievementAward: this.state.examAchievementAward,
      requirement: this.state.examRequirement,
    });
    this.state.currentExamScoreDelta = (Number(this.state.currentExamScoreDelta) || 0) + this.state.score;
    this._captureCurrentExamGoalState();
    const beforeGoalAchievement = Number(this.state.achievementPoints) || 0;
    this._checkImmediateGoals();
    this.state.currentExamGoalAchievementDelta = (Number(this.state.currentExamGoalAchievementDelta) || 0) + ((Number(this.state.achievementPoints) || 0) - beforeGoalAchievement);
  }

  _undoCurrentExamSettlement() {
    this.state.achievementPoints -= Number(this.state.currentExamAchievementDelta) || 0;
    this.state.achievementPoints -= Number(this.state.currentExamEffectAchievementDelta) || 0;
    this.state.totalExamScore -= Number(this.state.currentExamScoreDelta) || 0;
    this.state.currentExamAchievementDelta = 0;
    this.state.currentExamEffectAchievementDelta = 0;
    this.state.currentExamScoreDelta = 0;
    this.state.achievementPoints -= Number(this.state.currentExamGoalAchievementDelta) || 0;
    this._restoreCurrentExamGoalState();
    this.state.currentExamGoalAchievementDelta = 0;
    this.state.examAchievementAward = 0;
    this.state.examRequirement = 0;
    this.state.pendingProjectProgress = null;
    this.state.pendingProjectProgressQueue = [];
    this.state.pendingCourseReward = null;
  }

  _useCram() {
    if (this.state.cramUsed || !this.state.eventStageActive || this.state.pendingEventPayment || this.state.pendingCourseReward) return this.state;
    this.state.cramUsed = true;
    this.state.reviewValue += 1;
    this.state.nextScoreBonus += 4;
    this.state.eventMessage = '使用临阵磨枪：获得 1 温习值与下次考试 +4 分。';
    return this.state;
  }

  _useRetake() {
    if (this.state.retakeUsed || !this.state.examStageActive || this.state.pendingCourseReward) return this.state;
    if ((Number(this.state.score) || 0) >= (Number(this.state.examRequirement) || 0)) return this.state;
    const appliedBonus = Number(this.state.appliedNextScoreBonus) || 0;
    const previousHand = Array.isArray(this.state.hand) ? this.state.hand.slice() : [];
    if (this.state.deck && previousHand.length > 0) {
      this.state.deck.cards.unshift(...previousHand);
      this.state.deck.shuffle();
    }
    this.state.retakeUsed = true;
    this._undoCurrentExamSettlement();
    this.state.cardResults = [];
    this.state.permanentResults = [];
    this.state.testResults = [];
    this.state.score = 0;
    this.state.baseScore = 0;
    this.state.counts = { Theory: 0, Practice: 0, Social: 0 };
    this.state.hand = [];
    this._drawExamHand(this.state.eventStartDraw || 5, { ignoreSideEffects: true, preserveAppliedBonus: true, appliedNextScoreBonus: appliedBonus });
    this.state.lastAchievement = `已使用重考机会。${this.state.lastAchievement}`;
    return this.state;
  }
  _confirmExam() {
    if (!this.state.examStageActive || this.state.pendingProjectProgress || this.state.pendingCourseReward) return this.state;
    this._expireImmediateGoalsForSemester(this.state.semester);
    const isFinalSemester = this.state.semester >= 8;
    if (isFinalSemester) {
      this._settleFinalGoals();
    }
    const oldReviewValue = Number(this.state.reviewValue) || 0;
    this.state.reviewValue = Math.floor(oldReviewValue / 2);
    if (oldReviewValue !== this.state.reviewValue) {
      this.state.goalResults.push('学期结束：温习值 ' + oldReviewValue + ' -> ' + this.state.reviewValue);
    }
    this.state.examStageActive = false;
    this.state.hand = [];
    this.state.currentTest = null;
    this.state.candidateTests = [];
    this.state.selectedTestIndex = -1;
    this.state.examRandomSymbol = null;
    this.state.examTempSymbols = { theory: 0, practice: 0, social: 0 };
    this.state.doublePermanentEffectsActive = false;
    this.state.awaitingEventStart = false;
    if (isFinalSemester) {
      this.state.gameFinished = true;
      this.state.graduationSummary = this._buildGraduationSummary();
      return this.state;
    }
    this.state.semester += 1;
    this._refreshFinalGoalProgress();
    return this.state;
  }

  _getEventVariables() {
    return {
      theory: this.state.counts.Theory || 0,
      practice: this.state.counts.Practice || 0,
      social: this.state.counts.Social || 0,
      semester: this.state.semester,
      achievement: this.state.achievementPoints,
      review: this.state.reviewValue,
    };
  }

  // 根据当前手牌计算 counts、score 和成就点
  _applyScoringEffects(effects = [], vars = {}, sourceName = '效果', options = {}) {
    let score = 0;
    let achievement = 0;
    const details = [];
    if (!Array.isArray(effects)) return { score, achievement, details, vars };

    effects.forEach((effect) => {
      switch (effect.effectType) {
        case 'getVariable': {
          vars[effect.output] = this._resolveValue(effect.target, vars);
          details.push(this._describeEffect(effect, vars[effect.output]));
          break;
        }
        case 'getHighest': {
          vars[effect.output] = this._getHighest(effect.target, vars);
          details.push(this._describeEffect(effect, vars[effect.output]));
          break;
        }
        case 'getLowest': {
          vars[effect.output] = this._getLowest(effect.target, vars);
          details.push(this._describeEffect(effect, vars[effect.output]));
          break;
        }
        case 'match': {
          const value = this._resolveValue(effect.input, vars);
          vars[effect.output] = Array.isArray(effect.list) && effect.list.includes(value) ? 1 : 0;
          details.push(this._describeEffect(effect, vars[effect.output]));
          break;
        }
        case 'compare': {
          const left = this._resolveValue(effect.input1, vars);
          const right = this._resolveValue(effect.input2, vars);
          vars[effect.output] = this._compareValues(left, right, effect.type) ? 1 : 0;
          details.push(this._describeEffect(effect, vars[effect.output]));
          break;
        }
        case 'randomExamSymbol': {
          const symbolKeys = ['theory', 'practice', 'social'];
          const picked = symbolKeys[Math.floor(Math.random() * symbolKeys.length)];
          this.state.examRandomSymbol = picked;
          vars.randomSymbolName = picked;
          vars.randomSymbol = Number(vars[picked] || 0);
          if (effect.output) vars[effect.output] = picked;
          details.push('随机计分符号：' + picked);
          break;
        }
        case 'doublePermanentEffects': {
          this.state.doublePermanentEffectsActive = true;
          details.push('成果效果翻倍');
          break;
        }
        case 'addAchievementIf': {
          const condition = this._resolveValue(effect.condition || effect.input || 'const0', vars);
          const addValue = condition ? (Number(effect.amount ?? effect.multi ?? 0) || 0) : 0;
          achievement += addValue;
          details.push(addValue > 0 ? ('额外成就点 +' + addValue) : '条件未满足，无成就点');
          break;
        }
        case 'addScore': {
          const value = this._resolveValue(effect.input, vars);
          const addValue = (Number(value) || 0) * (effect.multi || 0);
          score += addValue;
          details.push(this._describeEffect(effect, addValue));
          break;
        }
        case 'addAchievement': {
          const value = this._resolveValue(effect.input, vars);
          const addValue = (Number(value) || 0) * (effect.multi || 0);
          achievement += addValue;
          details.push(this._describeEffect(effect, addValue));
          break;
        }
        case 'addProjectProgress': {
          const value = this._resolveValue(effect.input, vars);
          const addValue = (Number(value) || 0) * (effect.multi || 1);
          if (options.ignoreSideEffects || this.state.ignoreExamSideEffects) {
            details.push('重考忽略推进效果：+' + addValue);
          } else if (this.state.activeProjects.length > 0 && addValue > 0) {
            this._queueProjectProgress({ amount: addValue, source: sourceName });
            details.push('等待选择项目：进度 +' + addValue);
          } else {
            details.push('没有可推进的项目');
          }
          break;
        }
        default:
          details.push(effect.effectType || '未知效果');
          break;
      }
    });
    return { score, achievement, details, vars };
  }

  _recalculate() {
    const hand = this.state.hand || [];
    const counts = { theory: 0, practice: 0, social: 0 };
    hand.forEach((card) => {
      if (card.symbols) {
        counts.theory += card.symbols.Theory || 0;
        counts.practice += card.symbols.Practice || 0;
        counts.social += card.symbols.Social || 0;
      } else if (card.type && counts.hasOwnProperty(card.type.toLowerCase())) {
        counts[card.type.toLowerCase()] += 1;
      }
    });

    const tempSymbols = this.state.examTempSymbols || {};
    counts.theory += Number(tempSymbols.theory) || 0;
    counts.practice += Number(tempSymbols.practice) || 0;
    counts.social += Number(tempSymbols.social) || 0;

    const permanentOutcome = this._applyPermanentEffects(counts);
    const permanentResults = permanentOutcome.results || [];
    const permanentScore = Number(permanentOutcome.score) || 0;
    const permanentAchievement = Number(permanentOutcome.achievement) || 0;
    this.state.counts = {
      Theory: counts.theory,
      Practice: counts.practice,
      Social: counts.social,
    };

    const baseVariables = this._getExamVariables(counts);
    const test = this.state.currentTest;
    const testEffects = test && Array.isArray(test.effect) ? test.effect : [];
    const recalcOptions = { ignoreSideEffects: !!this.state.ignoreExamSideEffects };
    const testScoreResult = this._applyScoringEffects(testEffects, { ...baseVariables }, test ? test.name : '考试', recalcOptions);
    const baseScore = testScoreResult.score;
    let score = permanentScore + baseScore + (Number(this.state.appliedNextScoreBonus) || 0);
    let achievementGain = permanentAchievement + testScoreResult.achievement;
    const cardResults = [];
    const testResults = (this.state.testResults || []).slice();
    if (permanentScore || permanentAchievement) {
      testResults.push({
        id: 'permanent_effects',
        name: '成果结算',
        score: permanentScore,
        achievement: permanentAchievement,
        effects: permanentResults.flatMap((item) => item.effects || []),
      });
    }
    if (test) {
      testResults.push({
        id: test._id || test.id,
        name: test.name,
        score: testScoreResult.score,
        achievement: testScoreResult.achievement,
        effects: testScoreResult.details,
      });
    }

    if ((Number(this.state.appliedNextScoreBonus) || 0) > 0) {
      cardResults.push({
        id: 'nextScoreBonus',
        name: '下次考试加分',
        score: Number(this.state.appliedNextScoreBonus) || 0,
        achievement: 0,
        effects: ['分数 +' + this.state.appliedNextScoreBonus],
      });
    }

    hand.forEach((card) => {
      const result = this._applyScoringEffects(card.effects, { ...baseVariables, baseScore }, card.name, recalcOptions);
      score += result.score;
      achievementGain += result.achievement;
      cardResults.push({
        id: card._id || card.id,
        name: card.name,
        score: result.score,
        achievement: result.achievement,
        effects: result.details,
      });
    });

    this.state.score = score;
    this.state.baseScore = baseScore;
    this.state.achievementPoints += achievementGain;
    this.state.currentExamEffectAchievementDelta = (Number(this.state.currentExamEffectAchievementDelta) || 0) + achievementGain;
    this.state.cardResults = cardResults;
    this.state.testResults = testResults;
    this.state.permanentResults = permanentResults;
  }

  _applyPermanentEffects(counts) {
    const permanentResults = [];
    let score = 0;
    let achievement = 0;
    const multiplier = this._shouldDoublePermanentEffects() ? 2 : 1;
    this.state.activePermanents.forEach((permanent) => {
      const effects = [];
      if (Array.isArray(permanent.effects)) {
        permanent.effects.forEach((effect) => {
          const scaled = { ...effect };
          if (scaled.effectType === 'addSymbol') {
            const symbol = String(scaled.input || '').toLowerCase();
            const amount = (Number(scaled.amount ?? scaled.multi ?? 1) || 0) * multiplier;
            if (Object.prototype.hasOwnProperty.call(counts, symbol)) {
              counts[symbol] += amount;
              effects.push(symbol + ' 符号 +' + amount);
            } else {
              effects.push('未知符号：' + scaled.input);
            }
            return;
          }
          if (['addScore', 'addAchievement', 'giveProgress', 'addProjectProgress'].includes(scaled.effectType)) {
            if (scaled.multi != null) scaled.multi = (Number(scaled.multi) || 1) * multiplier;
            else if (scaled.num != null) scaled.num = (Number(scaled.num) || 0) * multiplier;
            else if (typeof scaled.input === 'number') scaled.input = scaled.input * multiplier;
            else scaled.multi = multiplier;
          }
          const result = this._applyScoringEffects([scaled], this._getExamVariables(counts), permanent.name, { ignoreSideEffects: !!this.state.ignoreExamSideEffects });
          score += result.score;
          achievement += result.achievement;
          effects.push(...result.details);
        });
      }
      permanentResults.push({
        id: permanent._instanceId || permanent._id || permanent.id,
        name: permanent.name,
        effects,
      });
    });
    return { results: permanentResults, score, achievement };
  }

  _shouldDoublePermanentEffects() {
    return !!this.state.doublePermanentEffectsActive || !!(this.state.currentTest && Array.isArray(this.state.currentTest.effect) && this.state.currentTest.effect.some((effect) => effect.effectType === 'doublePermanentEffects'));
  }

  _describeEffect(effect, value) {
    switch (effect.effectType) {
      case 'addScore':
        return `得分：${value} = ${effect.input} × ${effect.multi || 0}`;
      case 'addAchievement':
        return `成就点：${value} = ${effect.input} × ${effect.multi || 0}`;
      case 'match':
        return `匹配 ${effect.input} 是否在 [${effect.list}]，结果 ${value}`;
      case 'compare':
        return `比较 ${effect.input1} ${effect.type} ${effect.input2}，结果 ${value}`;
      case 'getHighest':
        return `最高值判断 ${effect.target}，结果 ${value}`;
      case 'getVariable':
        return `取值 ${effect.target}，保存到 ${effect.output}`;
      default:
        return `${effect.effectType}`;
    }
  }

  _resolveValue(input, vars) {
    if (typeof input === 'number') return input;
    if (typeof input !== 'string') return 0;
    if (input in vars) return vars[input];
    if (input.startsWith('const')) {
      const value = Number(input.slice(5));
      return Number.isNaN(value) ? 0 : value;
    }
    const parsed = Number(input);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  _capitalizeSymbol(symbol) {
    const map = { theory: 'Theory', practice: 'Practice', social: 'Social' };
    return map[symbol] || symbol;
  }

  _getHighest(target, vars) {
    const symbolKeys = ['theory', 'practice', 'social'];
    if (target === 'symbol') {
      return Math.max(...symbolKeys.map((key) => Number(vars[key] || 0)));
    }
    const keys = ['theory', 'practice', 'social', 'achievement', 'progress', 'project', 'permanent'];
    const values = keys.map((key) => Number(vars[key] || 0));
    const max = Math.max(...values);
    const targetValue = Number(vars[target] || 0);
    return targetValue >= max ? 1 : 0;
  }

  _getLowest(target, vars) {
    const symbolKeys = ['theory', 'practice', 'social'];
    if (target === 'symbol') {
      return Math.min(...symbolKeys.map((key) => Number(vars[key] || 0)));
    }
    const keys = ['theory', 'practice', 'social', 'achievement', 'progress', 'project', 'permanent', 'completedProject', 'completepro', 'eventHand'];
    const values = keys.map((key) => Number(vars[key] || 0));
    const min = Math.min(...values);
    const targetValue = Number(vars[target] || 0);
    return targetValue <= min ? 1 : 0;
  }

  _compareValues(left, right, type) {
    switch (type) {
      case 'eq':
        return left === right;
      case 'ne':
        return left !== right;
      case 'lt':
        return left < right;
      case 'le':
        return left <= right;
      case 'gt':
        return left > right;
      case 'ge':
        return left >= right;
      default:
        return false;
    }
  }


  _serializeDeck(deck) {
    if (!deck) return null;
    return {
      original: Array.isArray(deck._original) ? deck._original : [],
      cards: Array.isArray(deck.cards) ? deck.cards : [],
    };
  }

  _restoreDeck(savedDeck, fallbackCards = []) {
    const original = savedDeck && Array.isArray(savedDeck.original) ? savedDeck.original : fallbackCards;
    const deck = new Deck(original);
    deck.cards = savedDeck && Array.isArray(savedDeck.cards) ? savedDeck.cards.slice() : original.slice();
    return deck;
  }

  exportSnapshot() {
    const plainState = {};
    Object.keys(this.state).forEach((key) => {
      if (['deck', 'eventDeck', 'testDeck'].includes(key)) return;
      plainState[key] = this.state[key];
    });

    return {
      version: 1,
      state: {
        ...plainState,
        deck: this._serializeDeck(this.state.deck),
        eventDeck: this._serializeDeck(this.state.eventDeck),
        testDeck: this._serializeDeck(this.state.testDeck),
      },
    };
  }

  importSnapshot(snapshot = {}) {
    const source = snapshot.state || snapshot;
    const nextState = new GameState();
    Object.keys(source).forEach((key) => {
      if (['deck', 'eventDeck', 'testDeck'].includes(key)) return;
      nextState[key] = source[key];
    });

    nextState.deck = this._restoreDeck(source.deck, this._buildCardsFromData());
    nextState.eventDeck = this._restoreDeck(source.eventDeck, this._buildEventsFromData());
    nextState.testDeck = this._restoreDeck(source.testDeck, this._buildTestsFromData());
    nextState.pendingProjectProgressQueue = Array.isArray(nextState.pendingProjectProgressQueue) ? nextState.pendingProjectProgressQueue : [];
    nextState.candidateTests = Array.isArray(nextState.candidateTests) ? nextState.candidateTests : [];
    nextState.selectedTestIndex = Number.isFinite(Number(nextState.selectedTestIndex)) ? Number(nextState.selectedTestIndex) : -1;
    nextState.examRerollUsed = !!nextState.examRerollUsed;
    nextState.examRandomSymbol = nextState.examRandomSymbol || null;
    nextState.examTempSymbols = nextState.examTempSymbols || { theory: 0, practice: 0, social: 0 };
    nextState.doublePermanentEffectsActive = !!nextState.doublePermanentEffectsActive;
    nextState.pendingCourseDeletion = nextState.pendingCourseDeletion || null;
    nextState.pendingCourseDeletionQueue = Array.isArray(nextState.pendingCourseDeletionQueue) ? nextState.pendingCourseDeletionQueue : [];
    nextState.examHistory = Array.isArray(nextState.examHistory) ? nextState.examHistory : [];
    nextState.finalExamAchievementAward = Number(nextState.finalExamAchievementAward) || 0;
    nextState.gameFinished = !!nextState.gameFinished;
    nextState.graduationSummary = nextState.graduationSummary || null;
    nextState.currentExamAchievementDelta = Number(nextState.currentExamAchievementDelta) || 0;
    nextState.currentExamEffectAchievementDelta = Number(nextState.currentExamEffectAchievementDelta) || 0;
    nextState.currentExamScoreDelta = Number(nextState.currentExamScoreDelta) || 0;
    nextState.currentExamGoalAchievementDelta = Number(nextState.currentExamGoalAchievementDelta) || 0;
    nextState.currentExamGoalSnapshot = Array.isArray(nextState.currentExamGoalSnapshot) ? nextState.currentExamGoalSnapshot : null;
    nextState.currentExamGoalResultLength = Number(nextState.currentExamGoalResultLength) || 0;
    nextState.pendingEventDiscard = nextState.pendingEventDiscard || null;
    this.state = nextState;
    this._refreshEventOptionStates();
    return this.state;
  }
  // 返回当前 GameState（用于 UI 读取）
  getState() {
    this._refreshFinalGoalProgress();
    return this.state;
  }
}





























