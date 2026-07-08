import React from 'react';
import GameEngine from '../engine/GameEngine';
import courses from '../data/courses.json';
import events from '../data/events.json';
import projects from '../data/projects.json';
import adcourses from '../data/adcourses.json';
import tests from '../data/test.json';
import permanents from '../data/permanent.json';
import taskText from '../data/任务.md';
import { post } from '../../../../utilities.js';

const SYMBOLS = {
  Theory: { icon: '🧠', label: '理论' },
  Practice: { icon: '🔧', label: '实践' },
  Social: { icon: '💬', label: '社会' },
};

const SAVE_SLOTS = ['1', '2'];
const AUTOSAVE_SLOT = 'auto';
const SAVE_PREFIX = 'deckgame_save_';
const GAME_NAME = 'ustcdeckgame';

const EVENT_SYMBOLS = {
  book: { icon: '📚', label: '课程' },
  connect: { icon: '🤝', label: '人脉' },
  data: { icon: '💾', label: '数据' },
  research: { icon: '🔬', label: '科研' },
  engineering: { icon: '⚙️', label: '工程' },
};

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: '欢迎来到科大',
    text: '教程会用固定剧本带你完成几次短学期：先看考试和课程，再学习事件、选课、温习，最后认识项目与成果。教程期间不会覆盖正式存档，完成时自动保存一次。',
    focus: '主界面',
    setup: { type: 'TUTORIAL_SETUP', reset: true, clearPermanents: true, semester: 1, testId: 'test_physics', courseIds: ['math', 'practice', 'experiment', 'chemistry', 'computer', 'physics', 'classmates', 'sports', 'hobby', 'extracurricular', 'extratask'], phase: 'briefing' },
  },
  {
    id: 'first_exam_card',
    title: '第一学期：翻开考试卡',
    text: '每学期开始时会先看到本学期考试。现在翻开的是“大学物理考试”：理论符号和实践符号都会提供分数。第一学期我们跳过事件和温习，直接看考试如何结算。',
    focus: '当前考试',
    setup: { type: 'TUTORIAL_SETUP', reset: true, clearPermanents: true, semester: 1, testId: 'test_physics', courseIds: ['math', 'practice', 'experiment', 'chemistry', 'computer', 'physics', 'classmates', 'sports', 'hobby', 'extracurricular', 'extratask'], phase: 'briefing' },
  },
  {
    id: 'first_exam_draw',
    title: '第一次考试：抽出课程',
    text: '第一学期是上学期，会额外多抽 1 张牌。这次固定抽前 6 张课程：高中数学、练习、高中实验、高中化学、电脑基础和高中物理。',
    focus: '考试阶段',
    setup: { type: 'TUTORIAL_SETUP', reset: true, clearPermanents: true, semester: 1, testId: 'test_physics', courseIds: ['math', 'practice', 'experiment', 'chemistry', 'computer', 'physics', 'classmates', 'sports', 'hobby', 'extracurricular', 'extratask'], phase: 'exam' },
  },
  {
    id: 'first_exam_symbols',
    title: '课程符号会互相配合',
    text: '高中数学提供理论，练习和高中实验提供实践。大学物理考试会把理论和实践都转化为分数；高中实验还会根据实践数量额外得分。',
    focus: '课程牌 / 知识符号',
  },
  {
    id: 'first_exam_effects',
    title: '课程也有自己的效果',
    text: '高中化学会固定加分；电脑基础在前两学期很强；高中物理会检查理论是否足够突出。考试不是只数符号，课程效果也会一起结算。',
    focus: '课程结算日志',
  },
  {
    id: 'first_exam_result',
    title: '第一次考试结果',
    text: '本次考试总分来自考试卡、课程符号和课程效果。达到不同分数档位会获得不同成就点，未达到最低线会扣成就点。接下来我们学习如何在考试前主动准备。',
    focus: '考试总分 / 日志',
    more: { label: '查看分数档位', text: '大一考试按 10 / 15 / 20 / 30 分给 1 / 4 / 6 / 8 成就点；如果低于 10 分，扣除 5 成就点。大二、大三、大四会把这些分数线按 1.5 / 2 / 2.5 倍提高。' },
  },
  {
    id: 'second_exam_card',
    title: '第二学期：先看高等数学考试',
    text: '第二学期开始时，先翻出“高等数学考试”。它主要吃理论符号：每个理论符号额外提供 2 分，所以我们这学期要主动找理论课程。',
    focus: '当前考试',
    setup: { type: 'TUTORIAL_SETUP', reset: true, clearPermanents: true, semester: 2, testId: 'test_calculus', courseIds: ['sports', 'classmates', 'extratask', 'physics', 'chemistry', 'math'], eventIds: ['event_course_selection', 'event_review', 'event_campus_competition'], phase: 'briefing' },
  },
  {
    id: 'second_event_phase',
    title: '进入事件阶段',
    text: '现在确认考试，进入事件阶段。每个学期进入事件阶段时，会保留上回合未打出的事件，并新抽 3 张事件卡；这里固定给你“选课时间、复习、校内比赛”。',
    focus: '事件手牌',
    setup: { type: 'TUTORIAL_SETUP', semester: 2, testId: 'test_calculus', courseIds: ['sports', 'classmates', 'extratask', 'physics', 'chemistry', 'math'], eventIds: ['event_course_selection', 'event_review', 'event_campus_competition'], phase: 'event' },
  },
  {
    id: 'course_reward_event',
    title: '打出选课时间',
    text: '请打出“选课时间”。教程会固定展示三张理论相关课程：高等数学A、线性代数、概率论基础。选择的课程会加入牌堆顶，本学期考试一定能抽到。',
    focus: '事件手牌 / 课程奖励',
    more: { label: '为什么新课程一定能抽到', text: '课程奖励会把新课程放到牌堆顶。课程牌堆只在每个学期开始时洗牌，所以事件阶段获得并置顶的课程，不会在本学期考试前被再次洗走。' },
    actions: [{ label: '打出选课时间', commands: [{ type: 'PLAY_EVENT', eventIndex: 0, optionIndex: 0 }, { type: 'TUTORIAL_SETUP', courseRewardIds: ['advancedMath', 'linearAlgebra', 'probability'], courseReward: { source: '选课时间', selectnum: 1, lessontype: 'theory' } }] }],
  },
  {
    id: 'course_reward_pick',
    title: '选择高等数学A',
    text: '高等数学A提供 2 理论符号，并固定获得 5 分。它很适合高等数学考试。你可以手动点选，也可以使用教程按钮直接选择第一张。',
    focus: '课程奖励面板',
    actions: [{ label: '选择高等数学A', commands: [{ type: 'TOGGLE_COURSE_REWARD_SELECTION', choiceIndex: 0 }, { type: 'CONFIRM_COURSE_REWARD' }] }],
  },
  {
    id: 'review_event',
    title: '打出复习',
    text: '现在打出“复习”。它会给你成就点和温习值。温习值不直接等于分数，但能在温习阶段帮你调整牌堆。',
    focus: '事件手牌',
    actions: [{ label: '打出复习', command: { type: 'PLAY_EVENT', eventIndex: 0, optionIndex: 0 } }],
  },
  {
    id: 'second_event_end',
    title: '结束事件阶段：保留未打出的事件',
    text: '现在事件阶段还剩“校内比赛”。未打出的事件会保留到下学期；如果事件阶段结束时手牌超过 3 张，才会弃置到只剩 3 张。',
    focus: '事件手牌 / 温习区',
    actions: [{ label: '结束事件阶段', command: { type: 'CONFIRM_EVENT_PHASE' } }],
  },
  {
    id: 'second_review_phase',
    title: '温习阶段：调整牌堆',
    text: '温习值让你查看牌堆底部课程。现在底部三张是高中物理、高中化学、高中数学；请把它们移到牌堆顶，为高等数学考试准备理论符号。',
    focus: '温习区',
    more: { label: '温习值会怎样消耗', text: '温习值不会在温习阶段直接扣除。它决定你能查看多少张牌堆底部课程。每个学期考试结算后，剩余温习值会减半并向下取整。' },
    actions: [{ label: '按教程完成温习调整', commands: [{ type: 'REVIEW_CARD', cardIndex: 2 }, { type: 'REVIEW_CARD', cardIndex: 0 }, { type: 'REVIEW_CARD', cardIndex: 0 }, { type: 'END_REVIEW' }] }],
  },
  {
    id: 'second_exam',
    title: '第二次考试：选课和温习生效',
    text: '现在进入第二次考试。刚才你在温习阶段把理论课程移到了牌堆顶，所以高等数学考试会真实抽到这些课程；高等数学A也仍在本学期牌堆中，会一起提高总分。',
    focus: '考试阶段',
  },
  {
    id: 'project_start',
    title: '第三学期：获得项目',
    text: '项目是长期目标。现在打出“计算机时代”的 ICPC 方向，获得一个 ICPC 项目。项目会显示推进进度和可用选项。',
    focus: '事件手牌 / 项目区',
    setup: { type: 'TUTORIAL_SETUP', reset: true, clearPermanents: true, semester: 3, testId: 'test_programming', courseIds: ['computer', 'practice', 'experiment', 'math', 'physics', 'chemistry'], eventIds: ['event_campus_competition', 'event_computer_age', 'event_club_fair', 'event_time_plan'], phase: 'event' },
    actions: [{ label: '选择 ICPC 方向', command: { type: 'PLAY_EVENT', eventIndex: 1, optionIndex: 1 } }],
  },
  {
    id: 'project_progress',
    title: '推进项目',
    text: '事件阶段点击项目会消耗一次事件行动并增加 1 推进。教程先把 ICPC 放到 3 推进，你可以点按钮补到 4，观察“保证银牌”选项高亮。',
    focus: '项目区',
    setup: { type: 'TUTORIAL_SETUP', semester: 3, projects: [{ id: 'project_icpc', progress: 3 }], phase: 'event' },
    actions: [{ label: '推进到 4', command: { type: 'TUTORIAL_SETUP', projects: [{ id: 'project_icpc', progress: 4 }], phase: 'event' } }],
  },
  {
    id: 'project_milestone',
    title: '项目选项：里程碑',
    text: 'ICPC 的“保证银牌”需要 4 推进，类型是 milestone：执行后不移除项目，也不清空推进，但同一个里程碑只能领一次。',
    focus: 'ICPC 项目',
    actions: [{ label: '领取保证银牌', command: { type: 'PLAY_PROJECT_OPTION', projectIndex: 0, optionIndex: 0 } }],
  },
  {
    id: 'project_permanent',
    title: '项目选项：获得成果',
    text: '把 ICPC 推进到 9 后，“备战金牌”会移除项目并获得成果“实践积累”。成果会长期留在成果区，考试时自动给实践符号 +1。',
    focus: '项目区 / 成果区',
    setup: { type: 'TUTORIAL_SETUP', projects: [{ id: 'project_icpc', progress: 9 }], phase: 'event' },
    actions: [{ label: '领取备战金牌', command: { type: 'PLAY_PROJECT_OPTION', projectIndex: 0, optionIndex: 1 } }],
  },
  {
    id: 'permanent_exam',
    title: '成果参与考试',
    text: '这个场景直接把“实践积累”放到成果区，再进入考试。你会在日志里看到成果先结算，再结算考试卡和课程卡。',
    focus: '成果区 / 考试阶段',
    setup: { type: 'TUTORIAL_SETUP', reset: true, semester: 3, testId: 'test_programming', clearPermanents: true, permanents: ['permanent_practice_accumulation'], courseIds: ['computer', 'practice', 'experiment', 'math', 'physics', 'chemistry'], phase: 'exam' },
  },
  {
    id: 'goal_intro',
    title: '目标：给整局一个方向',
    text: '左侧目标分为即时目标和终局目标。即时目标鼓励你在早期抢节奏，终局目标会影响你长期积累课程、项目和成果的路线。',
    focus: '目标',
    more: { label: '目标为什么重要', text: '正式游戏中，你不只是为了每场考试过线，也要在目标、项目和成果之间分配行动。后期有些考试还会根据项目数量、成果数量或项目推进计分。' },
  },
  {
    id: 'cram_intro',
    title: '临阵磨枪：事件阶段的一次补救',
    text: '临阵磨枪整局只能用一次，只能在事件阶段使用。它会给 1 温习值，并让下一次考试 +4 分，适合在关键考试前补一点稳定性。',
    focus: '状态区 / 临阵磨枪',
  },
  {
    id: 'retake_intro',
    title: '重考：不及格时的最后机会',
    text: '如果本次考试分数低于及格线，可以使用一次重考。重考会重新抽本次考试牌，但会忽略课程带来的推进等副效果。',
    focus: '状态区 / 重考',
  },
  {
    id: 'save_intro',
    title: '存档：教程结束时自动保存',
    text: '教程期间不可手动保存，也不会自动覆盖正式进度。点击完成教程时会自动保存一次；正式游戏中，存档栏会显示两个本地槽位和最新云端存档。',
    focus: '存档',
  },
  {
    id: 'finish',
    title: '教程结束',
    text: '你已经看过考试、事件、课程奖励、温习、项目、成果和补救机会。完成教程后，可以继续这个局面，也可以回主菜单开始正式游戏。',
    focus: '完成',
  },
];
const styles = {
  page: {
    minHeight: '100vh',
    padding: 16,
    background: '#f4f7fb',
    color: '#172033',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  topbar: {
    display: 'grid',
    gridTemplateColumns: '220px minmax(320px, 1fr) auto',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
    topAction: {
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '8px 10px',
    border: '1px solid #d8e1ee',
    borderRadius: 8,
    background: '#fff',
    boxSizing: 'border-box',
  },
  topActionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.35,
  },board: {
    display: 'grid',
    gridTemplateColumns: '300px minmax(480px, 1fr) 330px',
    gap: 12,
    alignItems: 'start',
  },
  panel: {
    background: '#fff',
    border: '1px solid #d8e1ee',
    borderRadius: 8,
    padding: 12,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  },
  panelTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 700,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  stat: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 9,
    background: '#f8fafc',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 800,
  },
  primaryButton: {
    border: '1px solid #2563eb',
    background: '#2563eb',
    color: '#fff',
    borderRadius: 7,
    padding: '9px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#1e293b',
    borderRadius: 7,
    padding: '8px 11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  disabledButton: {
    border: '1px solid #cbd5e1',
    background: '#f1f5f9',
    color: '#94a3b8',
    borderRadius: 7,
    padding: '8px 11px',
    fontWeight: 700,
    cursor: 'not-allowed',
  },
  cardGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  compactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
};

export default class DeckGameUI extends React.Component {
  constructor(props) {
    super(props);
    this.engine = new GameEngine({ courses, events, projects, adcourses, permanents, tests, taskText });
    const initialState = this.engine.getState();
    this.state = {
      ...this.getUiStateFromEngine(initialState),
      saveSlots: this.readSaveSlots(),
      saveMessage: '',
      cloudLatestSave: null,
      tutorialStepIndex: 0,
      tutorialCollapsed: false,
      tutorialDetailOpen: false,
      tutorialExited: false,
      tutorialFinished: false,
    };
  }


  componentDidMount() {
    this.sessionStartedAt = Date.now();
    this.refreshCloudSaves();
    if (this.props.initialSaveData) {
      window.setTimeout(() => this.loadSaveData(this.props.initialSaveData, '云端存档'), 0);
    } else if (this.props.initialSaveSlot) {
      window.setTimeout(() => this.loadSave(this.props.initialSaveSlot), 0);
    } else if (this.props.tutorialMode) {
      window.setTimeout(() => this.applyTutorialStep(0), 0);
    }
  }

  getUiStateFromEngine(state) {
    return {
      hand: state.hand,
      counts: state.counts,
      score: state.score,
      baseScore: state.baseScore,
      immediateGoals: state.immediateGoals,
      finalGoals: state.finalGoals,
      goalResults: state.goalResults,
      acquiredCourseCount: state.acquiredCourseCount,
      totalExamScore: state.totalExamScore,
      currentTest: state.currentTest,
      awaitingEventStart: state.awaitingEventStart,
      testResults: state.testResults,
      examRequirement: state.examRequirement,
      examAchievementAward: state.examAchievementAward,
      examDrawCount: state.examDrawCount,
      examScoreScaling: state.examScoreScaling,
      examDrawPenalty: state.examDrawPenalty,
      reviewDrawTradeUsed: state.reviewDrawTradeUsed,
      semester: state.semester,
      achievementPoints: state.achievementPoints,
      reviewValue: state.reviewValue,
      lastAchievement: state.lastAchievement,
      nextScoreBonus: state.nextScoreBonus,
      cramUsed: state.cramUsed,
      retakeUsed: state.retakeUsed,
      appliedNextScoreBonus: state.appliedNextScoreBonus,
      cardResults: state.cardResults,
      activeProjects: state.activeProjects,
      activePermanents: state.activePermanents,
      permanentResults: state.permanentResults,
      examStageActive: state.examStageActive,
      pendingProjectProgress: state.pendingProjectProgress,
      pendingProjectProgressQueue: state.pendingProjectProgressQueue || [],
      pendingCourseReward: state.pendingCourseReward,
      eventHand: state.eventHand,
      eventOptionStates: state.eventOptionStates,
      pendingEventPayment: state.pendingEventPayment,
      eventStageActive: state.eventStageActive,
      eventPlayedCount: state.eventPlayedCount,
      eventResults: state.eventResults,
      eventMessage: state.eventMessage,
      reviewStageActive: state.reviewStageActive,
      reviewPreviewCards: state.reviewPreviewCards,
      reviewSelectedCards: state.reviewSelectedCards,
      reviewPreviewCount: state.reviewPreviewCount,
      reviewMessage: state.reviewMessage,
    };
  }
  isTutorialActive() {
    return !!this.props.tutorialMode && !this.state.tutorialExited;
  }

  syncState = (state, options = {}) => {
    this.setState(this.getUiStateFromEngine(state), () => {
      if (!options.skipAutosave && !this.isTutorialActive()) this.writeAutosave();
    });
  };


  getSaveKey(slot) {
    return `${SAVE_PREFIX}${slot}`;
  }

  getSavePhaseNameFromState(state = this.state) {
    if (state.eventStageActive) return '事件阶段';
    if (state.reviewStageActive) return '温习阶段';
    if (state.examStageActive) return '考试阶段';
    return '准备阶段';
  }

  readSaveSlot(slot) {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const raw = window.localStorage.getItem(this.getSaveKey(slot));
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  readSaveSlots() {
    return [...SAVE_SLOTS, AUTOSAVE_SLOT].reduce((map, slot) => {
      map[slot] = this.readSaveSlot(slot);
      return map;
    }, {});
  }


  normalizeCloudSave(raw) {
    if (!raw || raw.gamename !== GAME_NAME || !raw.gamedata) return null;
    return {
      ...raw.gamedata,
      _id: raw._id,
      cloudRecord: raw,
      savedAt: raw.gamedata.savedAt || raw.visdate || raw.regdate,
    };
  }

  getPlayTime() {
    const startedAt = this.sessionStartedAt || Date.now();
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  }

  mergeSaveSlots(localSlots = this.readSaveSlots()) {
    return [...SAVE_SLOTS, AUTOSAVE_SLOT].reduce((map, slot) => {
      map[slot] = localSlots[slot] || null;
      return map;
    }, {});
  }

  loadCloudSaves() {
    return post('/api/game/loadgame', {});
  }

  refreshCloudSaves() {
    this.loadCloudSaves()
      .then((res) => {
        if (res && res.error) {
          this.setState({ cloudSaveSlots: {}, cloudLatestSave: null, saveSlots: this.readSaveSlots(), cloudSaveMessage: '未登录，仅本地存档' });
          return;
        }
        const list = Array.isArray(res) ? res : [];
        const cloudSaves = list.map((item) => this.normalizeCloudSave(item)).filter(Boolean);
        const cloudLatestSave = cloudSaves
          .slice()
          .sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime())[0] || null;
        const cloudSaveSlots = {};
        cloudSaves.forEach((save) => {
          const slot = save.slot || (save.meta && save.meta.slot);
          if (!slot) return;
          const existing = cloudSaveSlots[slot];
          if (!existing || new Date(save.savedAt || 0) > new Date(existing.savedAt || 0)) {
            cloudSaveSlots[slot] = save;
          }
        });
        this.setState({
          cloudSaveSlots,
          cloudLatestSave,
          saveSlots: this.mergeSaveSlots(this.readSaveSlots(), cloudSaveSlots),
          cloudSaveMessage: cloudLatestSave ? '云端已同步' : '没有云端存档',
        });
      })
      .catch(() => {
        this.setState({ cloudSaveSlots: {}, cloudLatestSave: null, saveSlots: this.readSaveSlots(), cloudSaveMessage: '云端连接失败' });
      });
  }

  syncSaveToCloud(slot, save, options = {}) {
    if (options.silent && this.state.cloudSaveMessage === '未登录，仅本地存档') return;
    const cloudSave = this.state.cloudSaveSlots && this.state.cloudSaveSlots[slot];
    const payload = {
      gamename: GAME_NAME,
      savename: slot === AUTOSAVE_SLOT ? '自动存档' : `槽位 ${slot}`,
      gamedata: save,
      times: this.getPlayTime(),
    };
    if (cloudSave && cloudSave._id) payload._id = cloudSave._id;

    post('/api/game/savegame', payload)
      .then((res) => {
        if (res && res.error) {
          if (!options.silent) this.setState({ cloudSaveMessage: '未登录，仅保存到本地' });
          return;
        }
        const savedRecord = res && res.data ? res.data : null;
        const savedCloud = this.normalizeCloudSave(savedRecord) || { ...save, _id: payload._id, savedAt: save.savedAt };
        this.setState((prev) => {
          const cloudSaveSlots = { ...prev.cloudSaveSlots, [slot]: savedCloud };
          const prevLatest = prev.cloudLatestSave;
          const cloudLatestSave = !prevLatest || new Date(savedCloud.savedAt || 0) >= new Date(prevLatest.savedAt || 0)
            ? savedCloud
            : prevLatest;
          return {
            cloudSaveSlots,
            cloudLatestSave,
            saveSlots: this.mergeSaveSlots(prev.saveSlots, cloudSaveSlots),
            cloudSaveMessage: options.silent ? prev.cloudSaveMessage : '云端已保存',
          };
        });
      })
      .catch(() => {
        if (!options.silent) this.setState({ cloudSaveMessage: '云端保存失败，本地已保存' });
      });
  }
  createSave(slot) {
    const snapshot = this.engine.exportSnapshot();
    return {
      version: 1,
      slot,
      savedAt: new Date().toISOString(),
      meta: {
        slot,
        semester: this.state.semester,
        phase: this.getSavePhaseNameFromState(),
        achievementPoints: this.state.achievementPoints,
      },
      snapshot,
    };
  }

  writeSave(slot, options = {}) {
    if (this.isTutorialActive() && !options.allowTutorialSave) {
      this.setState({ saveMessage: '教程期间不可手动保存，完成教程后会自动保存一次' });
      return;
    }
    if (typeof window === 'undefined' || !window.localStorage) return;
    const save = this.createSave(slot);
    window.localStorage.setItem(this.getSaveKey(slot), JSON.stringify(save));
    this.setState((prev) => ({
      saveSlots: { ...prev.saveSlots, [slot]: save },
      saveMessage: options.silent ? prev.saveMessage : `已保存到槽位 ${slot}`,
    }));
    this.syncSaveToCloud(slot, save, options);
  }

  writeAutosave() {
    if (this.isTutorialActive()) return;
    this.writeSave(AUTOSAVE_SLOT, { silent: true });
  }

  loadSaveData(save, label = '存档') {
    if (!save || !save.snapshot) {
      this.setState({ saveMessage: `${label} 没有存档` });
      return;
    }
    const restored = this.engine.importSnapshot(save.snapshot);
    this.syncState(restored, { skipAutosave: true });
    this.setState({
      saveSlots: this.mergeSaveSlots(this.readSaveSlots(), this.state.cloudSaveSlots),
      saveMessage: `已读取${label}`,
    });
  }

  loadSave(slot) {
    const save = this.readSaveSlot(slot);
    this.loadSaveData(save, `槽位 ${slot}`);
  }

  loadLatestCloudSave = () => {
    this.loadSaveData(this.state.cloudLatestSave, '最新云端存档');
  };

  deleteSave(slot) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(this.getSaveKey(slot));
    this.setState({
      saveSlots: this.mergeSaveSlots(this.readSaveSlots(), this.state.cloudSaveSlots),
      saveMessage: `已删除本地槽位 ${slot}`,
    });
  }

  formatSaveTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('zh-CN', { hour12: false });
  }
  startSemester = () => this.syncState(this.engine.execute({ type: 'START_SEMESTER', draw: 5 }));
  startEventPhase = () => this.syncState(this.engine.execute({ type: 'CONFIRM_START_EVENT', draw: 5 }));
  playEvent = (eventIndex, optionIndex) => this.syncState(this.engine.execute({ type: 'PLAY_EVENT', eventIndex, optionIndex }));
  toggleEventPaymentCard = (cardIndex) => this.syncState(this.engine.execute({ type: 'TOGGLE_EVENT_PAYMENT_CARD', cardIndex }));
  confirmEventPayment = () => this.syncState(this.engine.execute({ type: 'CONFIRM_EVENT_PAYMENT' }));
  cancelEventPayment = () => this.syncState(this.engine.execute({ type: 'CANCEL_EVENT_PAYMENT' }));
  toggleEventDiscardCard = (cardIndex) => this.syncState(this.engine.execute({ type: 'TOGGLE_EVENT_DISCARD_CARD', cardIndex }));
  confirmEventDiscard = () => this.syncState(this.engine.execute({ type: 'CONFIRM_EVENT_DISCARD' }));
  advanceProject = (projectIndex) => this.syncState(this.engine.execute({ type: 'ADVANCE_PROJECT', projectIndex }));
  playProjectOption = (projectIndex, optionIndex) => this.syncState(this.engine.execute({ type: 'PLAY_PROJECT_OPTION', projectIndex, optionIndex }));
  endEventPhase = () => this.syncState(this.engine.execute({ type: 'CONFIRM_EVENT_PHASE', draw: 5 }));
  applyProjectProgressTarget = (projectIndex) => this.syncState(this.engine.execute({ type: 'APPLY_PROJECT_PROGRESS_TARGET', projectIndex }));
  confirmExam = () => this.syncState(this.engine.execute({ type: 'CONFIRM_EXAM' }));
  toggleCourseRewardSelection = (choiceIndex) => this.syncState(this.engine.execute({ type: 'TOGGLE_COURSE_REWARD_SELECTION', choiceIndex }));
  confirmCourseReward = () => this.syncState(this.engine.execute({ type: 'CONFIRM_COURSE_REWARD' }));
  reviewCard = (cardIndex) => this.syncState(this.engine.execute({ type: 'REVIEW_CARD', cardIndex }));
  resetReview = () => this.syncState(this.engine.execute({ type: 'RESET_REVIEW' }));
  endReview = () => this.syncState(this.engine.execute({ type: 'END_REVIEW', draw: 5 }));
  tradeExamDrawForProgress = (amount) => this.syncState(this.engine.execute({ type: 'TRADE_EXAM_DRAW_FOR_PROGRESS', amount }));
  useCram = () => this.syncState(this.engine.execute({ type: 'USE_CRAM' }));
  useRetake = () => this.syncState(this.engine.execute({ type: 'USE_RETAKE' }));

  getPhase() {
    if (this.state.awaitingEventStart) return 'briefing';
    if (this.state.eventStageActive) return 'event';
    if (this.state.reviewStageActive) return 'review';
    if (this.state.examStageActive) return 'exam';
    return 'ready';
  }

  getPhaseName() {
    const phase = this.getPhase();
    if (phase === 'briefing') return '考试揭示';
    if (phase === 'event') return '事件阶段';
    if (phase === 'review') return '温习阶段';
    if (phase === 'exam') return '考试阶段';
    return '准备阶段';
  }


  getTopAction() {
    if (this.state.pendingCourseReward) {
      const { selectedIndices = [], selectnum = 0 } = this.state.pendingCourseReward;
      return {
        text: `选择 ${selectnum} 张新课程加入牌堆顶（已选 ${selectedIndices.length}）`,
        buttonText: '确认课程',
        onClick: this.confirmCourseReward,
        disabled: selectedIndices.length !== selectnum,
      };
    }
    if (this.state.pendingEventPayment) {
      const selected = this.state.pendingEventPayment.selectedIndices || [];
      return {
        text: `选择用于支付费用的事件牌（已选 ${selected.length}）`,
        buttonText: '确认支付',
        onClick: this.confirmEventPayment,
        disabled: selected.length !== this.getPendingEventPaymentRequiredCount(),
      };
    }
    if (this.state.pendingEventDiscard) {
      const selected = this.state.pendingEventDiscard.selectedIndices || [];
      const discardCount = this.state.pendingEventDiscard.discardCount || 0;
      return {
        text: '事件手牌超过 3 张，请选择 ' + discardCount + ' 张弃置（已选 ' + selected.length + '）',
        buttonText: '确认弃置',
        onClick: this.confirmEventDiscard,
        disabled: selected.length !== discardCount,
      };
    }
    if (this.state.pendingProjectProgress) {
      return {
        text: `选择一个项目，获得 ${this.state.pendingProjectProgress.amount} 点推进`,
      };
    }
    if (this.state.awaitingEventStart) {
      return {
        text: '查看本学期考试卡，确认后进入事件阶段',
        buttonText: '进入事件阶段',
        onClick: this.startEventPhase,
      };
    }
    if (this.state.eventStageActive) {
      return {
        text: `打出事件或推进项目（已行动 ${this.state.eventPlayedCount} / 2）`,
        buttonText: `${this.state.eventPlayedCount === 2 ? '进入温习' : `提前结束，获得 ${4-this.state.eventPlayedCount*2} 温习值`}`,
        onClick: this.endEventPhase,
      };
    }
    if (this.state.reviewStageActive) {
      return {
        text: '查看底部课程、调整牌堆顶，或用少抽牌换项目推进',
        buttonText: '进入考试',
        onClick: this.endReview,
      };
    }
    if (this.state.examStageActive) {
      return {
        text: this.getExamSummaryText(),
        buttonText: `确认结算：${this.getExamRating()} / ${this.state.examAchievementAward} 成就点`,
        onClick: this.confirmExam,
      };
    }
    return {
      text: '开始新学期：揭示考试，抽取事件，然后进入事件阶段',
      buttonText: '开始学期',
      onClick: this.startSemester,
    };
  }


  getExamRating() {
    const award = Number(this.state.examAchievementAward) || 0;
    if (award >= 8) return 'S';
    if (award >= 6) return 'A';
    if (award >= 4) return 'B';
    if (award >= 1) return 'C';
    return '未达标';
  }

  getExamSummaryText() {
    const examScore = Number(this.state.baseScore) || 0;
    const totalScore = Number(this.state.score) || 0;
    const extraScore = totalScore - examScore;
    const achievement = Number(this.state.examAchievementAward) || 0;
    const achievementText = achievement >= 0 ? `获得 ${achievement} 成就点` : `扣除 ${Math.abs(achievement)} 成就点`;
    return `考试牌提供 ${examScore} 分，额外获得 ${extraScore} 分，总分 ${totalScore}，得到 ${this.getExamRating()} 评级，${achievementText}`;
  }
  getExamFeatureBlocks(test = this.state.currentTest) {
    if (!test) return [];
    const blocks = [
      { key: 'draw', label: '抽牌', value: `${this.state.examDrawCount || test.drawnum || 0} 张`, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    ];
    const scaling = Number(this.state.examScoreScaling || test.scorescaling || 1);
    if (scaling !== 1) {
      blocks.push({ key: 'scaling', label: '达标倍率', value: `${scaling}x`, bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' });
    }
    const describeInput = (input) => {
      const map = {
        theory: '理论',
        practice: '实践',
        social: '社会',
        review: '温习值',
        progress: '项目推进',
        project: '项目数量',
        permanent: '成果数量',
        highest: '最高符号',
        const1: '固定',
      };
      return map[input] || input || '变量';
    };
    const styleForInput = (input, type) => {
      if (type === 'review') return { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' };
      if (input === 'theory') return { bg: '#eef2ff', border: '#c7d2fe', color: '#3730a3' };
      if (input === 'practice') return { bg: '#ecfdf5', border: '#a7f3d0', color: '#047857' };
      if (input === 'social') return { bg: '#fdf2f8', border: '#fbcfe8', color: '#be185d' };
      if (input === 'review') return { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' };
      if (input === 'progress' || input === 'project') return { bg: '#fefce8', border: '#fde68a', color: '#a16207' };
      if (input === 'permanent') return { bg: '#faf5ff', border: '#ddd6fe', color: '#7e22ce' };
      if (input === 'const1') return { bg: '#f8fafc', border: '#cbd5e1', color: '#334155' };
      return { bg: '#f8fafc', border: '#cbd5e1', color: '#334155' };
    };
    (test.start || []).forEach((effect, index) => {
      if (effect.effectType === 'addReview') {
        const value = Number(effect.input) || Number(effect.multi) || 0;
        blocks.push({ key: `start-review-${index}`, label: '开局温习', value: `+${value}`, ...styleForInput('review', 'review') });
      }
    });
    (test.effect || []).forEach((effect, index) => {
      if (effect.effectType === 'addScore') {
        const input = effect.input;
        const multi = Number(effect.multi) || 1;
        const label = input === 'const1' ? '固定分' : `${describeInput(input)}计分`;
        const value = input === 'const1' ? `+${multi}` : `每点 x${multi}`;
        blocks.push({ key: `score-${index}`, label, value, ...styleForInput(input) });
      } else if (effect.effectType === 'getHighest') {
        blocks.push({ key: `highest-${index}`, label: '最高符号', value: '取最大', ...styleForInput('highest') });
      }
    });
    return blocks;
  }

  renderTestFeatureBlocks(test = this.state.currentTest) {
    const blocks = this.getExamFeatureBlocks(test);
    if (!blocks.length) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {blocks.map((block) => (
          <div key={block.key} style={{ border: `1px solid ${block.border}`, background: block.bg, color: block.color, borderRadius: 7, padding: '7px 9px', minWidth: 86 }}>
            <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.82 }}>{block.label}</div>
            <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2 }}>{block.value}</div>
          </div>
        ))}
      </div>
    );
  }

  getTutorialStep(index = this.state.tutorialStepIndex) {
    return TOUR_STEPS[Math.min(index, TOUR_STEPS.length - 1)] || TOUR_STEPS[0];
  }

  applyTutorialStep = (index = this.state.tutorialStepIndex) => {
    if (!this.props.tutorialMode) return;
    const step = this.getTutorialStep(index);
    if (!step || !step.setup) return;
    this.syncState(this.engine.execute(step.setup), { skipAutosave: true });
  };

  runTutorialAction = (action = {}) => {
    const commands = action.commands || (action.command ? [action.command] : []);
    if (commands.length === 0) return;
    let state = this.engine.getState();
    commands.forEach((command) => {
      state = this.engine.execute(command);
    });
    this.syncState(state, { skipAutosave: true });
    if (action.advance !== false) window.setTimeout(() => this.nextTutorialStep(), 0);
  };

  nextTutorialStep = () => {
    if (this.state.tutorialStepIndex >= TOUR_STEPS.length - 1) {
      this.finishTutorial();
      return;
    }
    this.setState((prev) => ({ tutorialStepIndex: Math.min(prev.tutorialStepIndex + 1, TOUR_STEPS.length - 1), tutorialDetailOpen: false }), () => {
      this.applyTutorialStep(this.state.tutorialStepIndex);
    });
  };

  prevTutorialStep = () => {
    this.setState((prev) => ({ tutorialStepIndex: Math.max(prev.tutorialStepIndex - 1, 0), tutorialDetailOpen: false }), () => {
      this.applyTutorialStep(this.state.tutorialStepIndex);
    });
  };

  toggleTutorialPanel = () => {
    this.setState((prev) => ({ tutorialCollapsed: !prev.tutorialCollapsed }));
  };

  finishTutorial = () => {
    if (this.state.tutorialFinished) return;
    this.setState({ tutorialFinished: true, tutorialExited: true, tutorialCollapsed: false, saveMessage: '教程完成，已自动保存一次' }, () => {
      this.writeSave(AUTOSAVE_SLOT, { allowTutorialSave: true });
    });
  };



  exitTutorial = () => {
    this.setState({ tutorialFinished: true, tutorialExited: true, tutorialCollapsed: false, saveMessage: '已结束教程，可以继续正常游玩' });
  };
  toggleTutorialDetail = () => {
    this.setState((prev) => ({ tutorialDetailOpen: !prev.tutorialDetailOpen }));
  };

  getTutorialKeywordRegex() {
    const words = ['大学物理考试', '高等数学考试', '高等数学A', '临阵磨枪', '成就点', '考试卡', '课程奖励', '事件阶段', '温习阶段', '考试阶段', 'ICPC', '理论', '实践', '社会', '考试', '课程', '事件', '温习', '项目', '成果', '重考', '存档', '目标'];
    const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`(${escaped.join('|')})`, 'g');
  }

  renderTutorialText(text) {
    if (!text) return null;
    const regex = this.getTutorialKeywordRegex();
    return String(text).split(regex).filter(Boolean).map((part, idx) => {
      if (regex.test(part)) {
        regex.lastIndex = 0;
        return <strong key={idx} style={{ color: '#1d4ed8', fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 900 }}>{part}</strong>;
      }
      regex.lastIndex = 0;
      return <span key={idx}>{part}</span>;
    });
  }

  getTutorialHighlightStyle(key) {
    if (!this.props.tutorialMode || this.state.tutorialCollapsed) return {};
    const step = this.getTutorialStep();
    const focus = `${step.focusKey || ''} ${step.focus || ''} ${step.title || ''}`;
    const map = {
      test: ['当前考试', '考试卡', '翻开'],
      exam: ['考试阶段', '考试总分', '第一次考试', '第二次考试', '课程牌'],
      event: ['事件手牌', '事件阶段', '课程奖励'],
      review: ['温习区', '温习阶段'],
      project: ['项目区', 'ICPC', '项目'],
      permanent: ['成果区', '成果'],
      status: ['状态区', '知识符号', '临阵磨枪', '重考', '补救'],
      goals: ['目标'],
      save: ['存档'],
      log: ['日志', '结算日志'],
    };
    const matched = (map[key] || []).some((word) => focus.includes(word));
    if (!matched) return {};
    return {
      position: 'relative',
      zIndex: 12,
      outline: '3px solid #f59e0b',
      boxShadow: '0 0 0 6px rgba(245, 158, 11, 0.18), 0 12px 26px rgba(15, 23, 42, 0.16)',
    };
  }
  renderTutorialPanel() {
    if (!this.props.tutorialMode || this.state.tutorialExited) return null;
    const step = this.getTutorialStep();
    const atFirst = this.state.tutorialStepIndex === 0;
    const atLast = this.state.tutorialStepIndex >= TOUR_STEPS.length - 1;
    const hasActions = Array.isArray(step.actions) && step.actions.length > 0;
    if (this.state.tutorialCollapsed) {
      return (
        <button type="button" onClick={this.toggleTutorialPanel} style={{ position: 'fixed', right: 18, top: 96, zIndex: 30, ...styles.primaryButton }}>
          展开教程
        </button>
      );
    }
    return (
      <div style={{ position: 'fixed', right: 18, top: 86, width: 420, maxWidth: 'calc(100vw - 36px)', zIndex: 30, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: 16, boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800 }}>新手教程 {this.state.tutorialStepIndex + 1} / {TOUR_STEPS.length}</div>
            <div style={{ fontSize: 17, fontWeight: 900, marginTop: 3 }}>{step.title}</div>
          </div>
          <button type="button" onClick={this.toggleTutorialPanel} style={{ ...styles.secondaryButton, padding: '4px 7px', fontSize: 12 }}>最小化</button>
        </div>
        <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.65, marginTop: 10 }}>{this.renderTutorialText(step.text)}</div>
        <div style={{ marginTop: 10, padding: 9, border: '1px solid #e2e8f0', borderRadius: 7, background: '#f8fafc', color: '#475569', fontSize: 12 }}>关注区域：{this.renderTutorialText(step.focus)}</div>
        {step.more && (
          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={this.toggleTutorialDetail} style={{ ...styles.secondaryButton, padding: '6px 9px', fontSize: 12 }}>
              {this.state.tutorialDetailOpen ? '收起说明' : step.more.label}
            </button>
            {this.state.tutorialDetailOpen && (
              <div style={{ marginTop: 8, padding: 10, border: '1px solid #bfdbfe', borderRadius: 7, background: '#eff6ff', color: '#1e3a8a', fontSize: 13, lineHeight: 1.55 }}>
                {this.renderTutorialText(step.more.text)}
              </div>
            )}
          </div>
        )}
        {hasActions && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {step.actions.map((action, idx) => (
              <button key={idx} type="button" onClick={() => this.runTutorialAction(action)} style={{ ...styles.primaryButton, padding: '7px 10px', fontSize: 12 }}>
                {action.label}
              </button>
            ))}
          </div>
        )}
        {this.state.tutorialFinished && <div style={{ marginTop: 10, color: '#166534', fontSize: 13, fontWeight: 800 }}>教程已完成，并自动保存了一次。</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button type="button" disabled={atFirst} onClick={this.prevTutorialStep} style={{ ...this.buttonStyle(atFirst), padding: '6px 9px', fontSize: 12 }}>上一步</button>
          {!hasActions && <button type="button" onClick={atLast ? this.finishTutorial : this.nextTutorialStep} style={{ ...styles.primaryButton, padding: '6px 9px', fontSize: 12 }}>{atLast ? '完成并保存' : '下一步'}</button>}
          <button type="button" onClick={this.exitTutorial} style={{ ...styles.secondaryButton, padding: '6px 9px', fontSize: 12 }}>结束教程继续游玩</button>
          {this.props.onBackToMenu && <button type="button" onClick={this.props.onBackToMenu} style={{ ...styles.secondaryButton, padding: '6px 9px', fontSize: 12 }}>回主菜单</button>}
        </div>
      </div>
    );
  }
  renderTopAction() {
    const action = this.getTopAction();
    return (
      <div style={styles.topAction}>
        <div style={styles.topActionText}>{action.text}</div>
        {action.buttonText && (
          <button onClick={action.onClick} disabled={!!action.disabled} style={this.buttonStyle(!!action.disabled, true)}>
            {action.buttonText}
          </button>
        )}
      </div>
    );
  }
  buttonStyle(disabled, primary = false) {
    if (disabled) return styles.disabledButton;
    return primary ? styles.primaryButton : styles.secondaryButton;
  }

  renderSectionTitle(title, right) {
    return (
      <div style={styles.panelTitle}>
        <span>{title}</span>
        {right && <span style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>{right}</span>}
      </div>
    );
  }

  renderPhaseStrip() {
    const phase = this.getPhase();
    const steps = [
      ['briefing', '揭示'],
      ['event', '事件'],
      ['review', '温习'],
      ['exam', '考试'],
      ['ready', '结算'],
    ];
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {steps.map(([id, label]) => {
          const active = phase === id;
          return (
            <div key={id} style={{ padding: '6px 10px', borderRadius: 7, border: active ? '1px solid #2563eb' : '1px solid #cbd5e1', background: active ? '#dbeafe' : '#fff', color: active ? '#1d4ed8' : '#64748b', fontWeight: active ? 800 : 600 }}>
              {label}
            </div>
          );
        })}
      </div>
    );
  }

  renderSymbolRow(card, size = 25) {
    const symbols = card.symbols || {};
    return (
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', margin: '8px 0', fontSize: size, lineHeight: 1 }}>
        {Object.entries(SYMBOLS).map(([key, item]) => {
          const count = symbols[key] || 0;
          if (count <= 0) return null;
          return <span key={key} title={item.label}>{Array.from({ length: count }, (_, idx) => <span key={idx}>{item.icon}</span>)}</span>;
        })}
      </div>
    );
  }

  renderEventSymbol(symbol) {
    const item = EVENT_SYMBOLS[symbol] || { icon: '▫️', label: '无类型' };
    return <span title={item.label} style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>;
  }

  renderProgressSymbols(progress = 0) {
    const count = Math.max(0, Number(progress) || 0);
    if (count === 0) return <span style={{ color: '#94a3b8', fontSize: 20 }}>◇</span>;
    return <span style={{ color: '#2563eb', fontSize: 20, lineHeight: 1 }}>{Array.from({ length: count }, (_, idx) => <span key={idx}>◆</span>)}</span>;
  }

  getProjectOptionType(option = {}) {
    return ['consume', 'remove', 'milestone'].includes(option.type) ? option.type : 'remove';
  }

  getProjectOptionTypeLabel(option = {}) {
    const type = this.getProjectOptionType(option);
    if (type === 'consume') return '消耗推进';
    if (type === 'milestone') return '里程碑';
    return '完成移除';
  }

  getProjectRequirement(project, option) {
    const progress = Number(project.progress) || 0;
    if (!option || option.require == null) return 0;
    if (option.require === 'local_progress') return Math.max(1, progress);
    const value = Number(option.require);
    return Number.isNaN(value) ? 0 : value;
  }

  canUseProjectOption(project, option) {
    const progress = Number(project.progress) || 0;
    if (!option || option.require == null) return true;
    if (option.require === 'local_progress') return progress > 0;
    return progress >= this.getProjectRequirement(project, option);
  }

  renderCourseCard(card, i, result = {}, compact = false) {
    return (
      <div key={card._id || card.id || i} style={{ width: compact ? 178 : 210, minHeight: compact ? 150 : 190, padding: 11, border: '1px solid #d9e2ef', borderTop: '4px solid #475569', borderRadius: 8, background: '#fff', boxSizing: 'border-box' }}>
        <div style={{ fontSize: compact ? 15 : 17, fontWeight: 800, lineHeight: 1.25 }}>{card.name}</div>
        {this.renderSymbolRow(card, compact ? 21 : 28)}
        <div style={{ minHeight: compact ? 34 : 46, color: '#475569', fontSize: 13, lineHeight: 1.35 }}>{card.content || '无描述'}</div>
        {!compact && (
          <div style={{ marginTop: 8, borderTop: '1px solid #edf2f7', paddingTop: 8, fontSize: 12, color: '#64748b' }}>
            {result.effects && result.effects.length > 0 ? result.effects.map((line, idx) => <div key={idx}>{line}</div>) : <div>本次无额外得分</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontWeight: 800, color: '#1e293b' }}>
              <span>分数 {result.score ?? 0}</span>
              <span>成就 {result.achievement ?? 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  getEffectInputText(effect = {}) {
    const input = effect.input ?? effect.num ?? effect.amount;
    if (input == null) return '1';
    const map = {
      const1: '1',
      theory: '理论符号数',
      practice: '实践符号数',
      social: '社会符号数',
      review: '温习值',
      progress: '项目总推进',
      project: '项目数',
      permanent: '成果数',
      achievement: '成就点',
      local_progress: '本项目推进',
    };
    return map[input] || String(input);
  }

  getEffectAmountText(effect = {}) {
    const input = effect.input ?? effect.num ?? effect.amount;
    const multi = effect.multi == null ? 1 : effect.multi;
    if (typeof input === 'number') return String(input * multi);
    if (input == null) return String(multi);
    if (String(input).startsWith('const')) {
      const value = Number(String(input).slice(5));
      return String((Number.isNaN(value) ? 0 : value) * multi);
    }
    const inputText = this.getEffectInputText(effect);
    return multi === 1 ? inputText : `${inputText} x ${multi}`;
  }

  describeOptionCost(costs = []) {
    if (!Array.isArray(costs) || costs.length === 0) return '无费用';
    return costs.map((cost) => {
      const amount = Number(cost.amount ?? cost.num ?? 1) || 0;
      const symbol = EVENT_SYMBOLS[cost.symbol] ? EVENT_SYMBOLS[cost.symbol].label : cost.symbol;
      if (cost.type === 'symbolCost' || cost.type === 'discardEvent') {
        return cost.symbol ? `弃置 ${amount} 张${symbol}事件` : `弃置 ${amount} 张事件`;
      }
      if (cost.type === 'discardLesson') return `弃置 ${amount} 门课程`;
      if (['eventCost', 'cardCost', 'anyCost', 'anyEventCost'].includes(cost.type)) return `弃置 ${amount} 张事件`;
      return cost.type || '未知费用';
    }).join('；');
  }


  findProjectTemplate(name) {
    if (!name) return null;
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
    const normalized = aliases[name] || name;
    return (projects || []).find((project) => {
      const id = project.id || project._id;
      return id === name || id === normalized || project.name === name || project.name === normalized;
    }) || null;
  }

  findPermanentTemplate(name) {
    if (!name) return null;
    return (permanents || []).find((permanent) => {
      const id = permanent.id || permanent._id;
      return id === name || permanent.name === name;
    }) || null;
  }

  getProjectDisplayName(name) {
    const project = this.findProjectTemplate(name);
    return (project && project.name) || name || '';
  }

  getPermanentDisplayName(name) {
    const permanent = this.findPermanentTemplate(name);
    return (permanent && permanent.name) || name || '';
  }

  describePermanentEffect(effect = {}) {
    const amount = this.getEffectAmountText(effect);
    const symbolMap = { theory: '理论符号', practice: '实践符号', social: '社会符号' };
    switch (effect.effectType) {
      case 'addSymbol':
        return `${symbolMap[effect.input] || effect.input || '符号'} +${amount}`;
      case 'addScore':
        return `考试分数 +${amount}`;
      case 'addAchievement':
        return `成就点 +${amount}`;
      case 'giveProgress':
      case 'addProjectProgress':
        return effect.type ? `${effect.type} 项目推进 +${amount}` : `项目推进 +${amount}`;
      default:
        return this.describeSimpleEffect(effect);
    }
  }

  describePermanentSummary(name) {
    const permanent = this.findPermanentTemplate(name);
    if (!permanent) return '';
    const effects = Array.isArray(permanent.effects) ? permanent.effects : [];
    const lines = effects.map((effect) => this.describePermanentEffect(effect)).filter(Boolean);
    if (lines.length > 0) return `（${lines.join('；')}）`;
    return permanent.content ? `（${permanent.content}）` : '';
  }

  describeSimpleEffect(effect = {}) {
    const amount = this.getEffectAmountText(effect);
    switch (effect.effectType) {
      case 'addAchievement':
        return `获得 ${amount} 成就点`;
      case 'addReview':
        return `获得 ${amount} 温习值`;
      case 'addNextScore':
        return `下次考试 +${amount} 分`;
      case 'drawEvent':
        return `抽 ${amount} 张事件卡`;
      case 'giveProject':
        return `获得项目 ${this.getProjectDisplayName(effect.name || effect.target)}`.trim();
      case 'givePermanent': {
        const permanentName = effect.name || effect.target;
        return `获得成果 ${this.getPermanentDisplayName(permanentName)}${this.describePermanentSummary(permanentName)}`.trim();
      }
      case 'giveProgress':
      case 'addProjectProgress':
        return effect.type ? `获得专精 ${effect.type} 类型的 ${amount} 推进` : `获得 ${amount} 推进`;
      case 'giveProgressOn':
        return `${effect.name || effect.target || '指定项目'} 推进 +${amount}`;
      case 'deleteLessons':
        return `删除 ${amount} 门课程`;
      case 'sReward': {
        const shownum = effect.shownum ?? 3;
        const selectnum = effect.selectnum ?? 1;
        const typeMap = { theory: '理论课程', practice: '实践课程', social: '社会课程' };
        const lessonType = effect.lessontype ? (typeMap[effect.lessontype] || `${effect.lessontype}课程`) : '课程';
        return `获得 ${shownum} 选 ${selectnum} 的${lessonType}奖励`;
      }
      default:
        return null;
    }
  }

  describeOptionEffects(option = {}) {
    const effects = Array.isArray(option.effects) ? option.effects : [];
    if (effects.length === 0) return option.content || '无效果';
    const lines = effects.map((effect) => this.describeSimpleEffect(effect));
    if (lines.some((line) => !line)) return option.content || '复杂效果，按卡牌文本执行';
    return lines.join('；');
  }

  describeEventOption(option = {}) {
    const cost = this.describeOptionCost(option.cost);
    const effect = this.describeOptionEffects(option);
    if(cost=='无费用') return `${effect}。`;
    return `【${cost}】：${effect}。`;
  }
  renderEventCard(event, idx) {
    const optionStates = this.state.eventOptionStates[idx] || [];
    return (
      <div key={event._id || event.id || idx} style={{ flex: '1 1 calc(33.333% - 10px)', maxWidth: 'calc(33.333% - 7px)', minWidth: 210, padding: 9, border: '1px solid #f3cf78', borderTop: '4px solid #f59e0b', borderRadius: 8, background: '#fffaf0', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{event.name}</div>
          {this.renderEventSymbol(event.symbol)}
        </div>
        <div style={{ margin: '6px 0 8px', color: '#6b4e16', fontSize: 12, minHeight: 30, lineHeight: 1.35 }}>{event.content || '无描述'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {(event.options || []).map((option, optIdx) => {
            const optionState = optionStates[optIdx] || { canPay: true, costText: '' };
            const disabled = this.state.eventPlayedCount >= 2 || !!this.state.pendingCourseReward || !!this.state.pendingEventPayment || !optionState.canPay;
            return (
              <button key={optIdx} disabled={disabled} onClick={() => this.playEvent(idx, optIdx)} style={{ ...this.buttonStyle(disabled), padding: '6px 7px', textAlign: 'left', fontWeight: 700 }}>
                <div>{option.name}</div>
                <div style={{ marginTop: 3, fontSize: 12, fontWeight: 500, lineHeight: 1.35, color: disabled ? '#94a3b8' : '#475569' }}>{this.describeEventOption(option)}</div>
                {optionState.costText && <div style={{ marginTop: 3, fontSize: 12, fontWeight: 700, color: disabled ? '#94a3b8' : '#b45309' }}>可支付：{optionState.costText}</div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  renderProjectCard(project, i) {
    const canAdvance = this.state.eventStageActive && this.state.eventPlayedCount < 2 && !this.state.pendingCourseReward && !this.state.pendingEventPayment;
    return (
      <div key={project._instanceId || project._id || project.id || i} onClick={canAdvance ? () => this.advanceProject(i) : undefined} style={{ flex: '1 1 220px', maxWidth: 280, padding: 9, border: canAdvance ? '1px solid #3b82f6' : '1px solid #c7d7ea', borderTop: '4px solid #0ea5e9', borderRadius: 8, background: canAdvance ? '#eff6ff' : '#fff', cursor: canAdvance ? 'pointer' : 'default' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{project.name}</div>
          <div style={{ color: '#0f766e', fontSize: 12, fontWeight: 700 }}>{project.type || '通用'}</div>
        </div>
        <div style={{ margin: '5px 0' }}>{this.renderProgressSymbols(project.progress)}</div>
        <div style={{ color: '#475569', fontSize: 12, marginBottom: 6, lineHeight: 1.35 }}>{project.content || '无描述'}</div>
        {(project.options || []).map((option, idx) => {
          const ready = this.canUseProjectOption(project, option);
          const requirement = this.getProjectRequirement(project, option);
          return (
            <button key={idx} disabled={!ready} onClick={(evt) => { evt.stopPropagation(); this.playProjectOption(i, idx); }} style={{ ...this.buttonStyle(!ready), display: 'block', width: '100%', marginTop: 5, padding: '6px 7px', textAlign: 'left', fontSize: 12 }}>
              <div>{option.name} · {requirement} · {this.getProjectOptionTypeLabel(option)}</div>
              <div style={{ marginTop: 3, fontSize: 12, fontWeight: 500 }}>{option.content}</div>
            </button>
          );
        })}
      </div>
    );
  }

  renderPermanentCard(permanent, i) {
    return (
      <div key={permanent._instanceId || permanent._id || permanent.id || i} style={{ padding: 10, border: '1px solid #e7c96a', borderTop: '4px solid #d6a323', borderRadius: 8, background: '#fff9e6' }}>
        <div style={{ fontWeight: 800 }}>{permanent.name}</div>
        <div style={{ color: '#6b5a24', fontSize: 13, margin: '6px 0' }}>{permanent.content || '无描述'}</div>
        {(permanent.effects || []).map((effect, idx) => <div key={idx} style={{ fontSize: 12, color: '#7c651e' }}>{effect.effectType}：{effect.input || effect.num} × {effect.multi ?? effect.amount ?? 1}</div>)}
      </div>
    );
  }

  renderGoalCard(goal, i, kind) {
    const statusMap = {
      active: { text: '进行中', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
      completed: { text: '已完成', color: '#166534', bg: '#ecfdf5', border: '#86efac' },
      expired: { text: '已移除', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
      failed: { text: '未达成', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
    };
    const state = statusMap[goal.status] || statusMap.active;
    const value = kind === 'final' ? (goal.value ?? 0) : null;
    return (
      <div key={goal.id || i} style={{ padding: 9, border: '1px solid ' + state.border, borderRadius: 8, background: state.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ fontWeight: 800 }}>{goal.name}</div>
          <div style={{ color: state.color, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{state.text}</div>
        </div>
        <div style={{ color: '#475569', fontSize: 12, lineHeight: 1.35 }}>{goal.content}</div>
        {kind === 'immediate' && <div style={{ marginTop: 6, color: '#334155', fontSize: 12, fontWeight: 700 }}>第 {goal.deadline} 学期结束</div>}
        {kind === 'final' && (
          <div style={{ marginTop: 7 }}>
            <div style={{ height: 6, borderRadius: 999, background: '#dbeafe', overflow: 'hidden' }}>
              <div style={{ width: Math.min(100, (value / goal.threshold) * 100) + '%', height: '100%', background: '#2563eb' }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700 }}>{value} / {goal.threshold}</div>
          </div>
        )}
      </div>
    );
  }


  renderSaveSlot(slot, label, canSave = true) {
    const save = this.state.saveSlots && this.state.saveSlots[slot];
    const isCloud = !!(save && save._id);
    const meta = save && save.meta ? save.meta : null;
    return (
      <div key={slot} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ fontWeight: 800 }}>{label}</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>{save ? `${isCloud ? '云端' : '本地'} · ${this.formatSaveTime(save.savedAt)}` : '空'}</div>
        </div>
        {meta && (
          <div style={{ color: '#475569', fontSize: 12, lineHeight: 1.45, marginBottom: 7 }}>
            第 {meta.semester} 学期 · {meta.phase} · {meta.achievementPoints} 成就点
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {canSave && <button onClick={() => this.writeSave(slot)} style={{ ...styles.secondaryButton, padding: '5px 8px', fontSize: 12 }}>保存</button>}
          <button onClick={() => this.loadSave(slot)} disabled={!save} style={{ ...this.buttonStyle(!save), padding: '5px 8px', fontSize: 12 }}>读取</button>
          <button onClick={() => this.deleteSave(slot)} disabled={!this.readSaveSlot(slot)} style={{ ...this.buttonStyle(!this.readSaveSlot(slot)), padding: '5px 8px', fontSize: 12 }}>删本地</button>
        </div>
      </div>
    );
  }

  renderLatestCloudSaveSlot() {
    const save = this.state.cloudLatestSave;
    const meta = save && save.meta ? save.meta : null;
    return (
      <div key="cloud-latest" style={{ border: '1px solid #bfdbfe', borderRadius: 8, padding: 8, background: '#eff6ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ fontWeight: 800 }}>最新云端存档</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>{save ? `云端 · ${this.formatSaveTime(save.savedAt)}` : '空'}</div>
        </div>
        {meta && (
          <div style={{ color: '#475569', fontSize: 12, lineHeight: 1.45, marginBottom: 7 }}>
            第 {meta.semester} 学期 · {meta.phase} · {meta.achievementPoints} 成就点
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={this.loadLatestCloudSave} disabled={!save} style={{ ...this.buttonStyle(!save), padding: '5px 8px', fontSize: 12 }}>读取</button>
          <button onClick={() => this.refreshCloudSaves()} style={{ ...styles.secondaryButton, padding: '5px 8px', fontSize: 12 }}>刷新云端</button>
        </div>
      </div>
    );
  }

  renderSavePanel() {
    if (this.isTutorialActive()) {
      return (
        <div style={{ ...styles.panel, marginBottom: 12, borderColor: '#fde68a', background: '#fffbeb', ...this.getTutorialHighlightStyle('save') }}>
          {this.renderSectionTitle('教程存档', this.state.tutorialFinished ? '已自动保存' : '完成后自动保存')}
          <div style={{ color: '#92400e', fontSize: 13, lineHeight: 1.55 }}>教程期间不可手动保存，也不会自动覆盖正式进度。完成教程时会自动保存一次。</div>
        </div>
      );
    }
    return (
      <div style={{ ...styles.panel, marginBottom: 12, ...this.getTutorialHighlightStyle('save') }}>
        {this.renderSectionTitle('存档', (this.state.saveMessage || '本地') + ' · ' + (this.state.cloudSaveMessage || '云端'))}
        <div style={{ ...styles.compactList }}>
          {SAVE_SLOTS.map((slot) => this.renderSaveSlot(slot, `本地槽位 ${slot}`))}
          {this.renderLatestCloudSaveSlot()}
        </div>
      </div>
    );
  }
  renderStatusPanel() {
    const { achievementPoints, reviewValue, score, counts, appliedNextScoreBonus, examDrawPenalty, cramUsed, retakeUsed, eventStageActive, examStageActive, examRequirement, pendingEventPayment, pendingCourseReward } = this.state;
    const statItems = [
      { label: '成就点', value: achievementPoints, color: '#7c2d12', bg: '#fff7ed', border: '#fed7aa' },
      { label: '温习值', value: reviewValue, color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
      { label: '本次分数', value: score, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    ];
    return (
      <div style={{ ...styles.panel, marginBottom: 12, ...this.getTutorialHighlightStyle('status') }}>
        {this.renderSectionTitle('状态', this.getPhaseName())}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>{statItems.map((item) => (
          <div key={item.label} style={{ border: '1px solid ' + item.border, borderRadius: 8, padding: 10, background: item.bg }}>
            <div style={{ color: item.color, fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: 26, fontWeight: 900 }}>{item.value}</div>
          </div>
        ))}</div>
        <div style={{ marginTop: 10, padding: 10, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
          <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, marginBottom: 6 }}>知识符号</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <div style={{ textAlign: 'center', color: '#334155' }}><div style={{ fontSize: 22 }}>🧠</div><strong>{counts.Theory}</strong></div>
            <div style={{ textAlign: 'center', color: '#334155' }}><div style={{ fontSize: 22 }}>🔧</div><strong>{counts.Practice}</strong></div>
            <div style={{ textAlign: 'center', color: '#334155' }}><div style={{ fontSize: 22 }}>💬</div><strong>{counts.Social}</strong></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button onClick={this.useCram} disabled={cramUsed || !eventStageActive || !!pendingEventPayment || !!pendingCourseReward} style={this.buttonStyle(cramUsed || !eventStageActive || !!pendingEventPayment || !!pendingCourseReward)}>
              临阵磨枪{cramUsed ? '（已用）' : ''}
            </button>
            <button onClick={this.useRetake} disabled={retakeUsed || !examStageActive || !!pendingCourseReward || score >= examRequirement} style={this.buttonStyle(retakeUsed || !examStageActive || !!pendingCourseReward || score >= examRequirement)}>
              重考{retakeUsed ? '（已用）' : ''}
            </button>
          </div>
          {!cramUsed && !retakeUsed && <div style={{ marginTop: 6, color: '#64748b', fontSize: 12 }}>若两次机会均未使用，游戏结束时 +1 最终成就值。</div>}          {(appliedNextScoreBonus > 0 || examDrawPenalty > 0) && (
            <div style={{ marginTop: 8, color: '#475569', fontSize: 12, lineHeight: 1.5 }}>
              {appliedNextScoreBonus > 0 && <div>已应用加分 {appliedNextScoreBonus}</div>}
              {examDrawPenalty > 0 && <div>本次考试少抽 {examDrawPenalty} 张</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  renderGoalPanel() {
    const { immediateGoals, finalGoals } = this.state;
    return (
      <div style={{ ...styles.panel, ...this.getTutorialHighlightStyle('goals') }}>
        {this.renderSectionTitle('目标', '开局抽取')}
        <div style={{ ...styles.compactList, marginBottom: 12 }}>
          {(immediateGoals || []).map((goal, i) => this.renderGoalCard(goal, i, 'immediate'))}
        </div>
        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 800, margin: '2px 0 8px' }}>终局目标</div>
        <div style={styles.compactList}>{(finalGoals || []).map((goal, i) => this.renderGoalCard(goal, i, 'final'))}</div>
      </div>
    );
  }

  renderCurrentTestPanel() {
    const { currentTest, examDrawCount, examScoreScaling } = this.state;
    if (!currentTest) return null;
    return (
      <div style={{ ...styles.panel, borderColor: '#c4b5fd', background: '#faf5ff', marginBottom: 12, ...this.getTutorialHighlightStyle('test') }}>
        {this.renderSectionTitle('当前考试', '已揭示')}
        <div style={{ fontSize: 17, fontWeight: 800 }}>{currentTest.name}</div>
        <div style={{ color: '#5b4b80', marginTop: 6, fontSize: 13 }}>{currentTest.content || '无描述'}</div>
        {this.renderTestFeatureBlocks(currentTest)}
      </div>
    );
  }


  getPendingEventPaymentOption() {
    const pending = this.state.pendingEventPayment;
    if (!pending) return null;
    const event = this.state.eventHand[pending.eventIndex];
    return event && Array.isArray(event.options) ? event.options[pending.optionIndex] || event.options[0] : null;
  }

  isEventPaymentCost(cost = {}) {
    return cost.type === 'symbolCost' || cost.type === 'discardEvent' || ['eventCost', 'cardCost', 'anyCost', 'anyEventCost'].includes(cost.type);
  }

  getPendingEventPaymentRequiredCount() {
    const option = this.getPendingEventPaymentOption();
    const costs = option && Array.isArray(option.cost) ? option.cost : [];
    return costs.reduce((sum, cost) => this.isEventPaymentCost(cost) ? sum + (Math.max(0, Number(cost.amount ?? cost.num ?? 1) || 0)) : sum, 0);
  }

  canUseEventCardForPayment(event, cardIndex) {
    const pending = this.state.pendingEventPayment;
    if (!pending || cardIndex === pending.eventIndex) return false;
    const option = this.getPendingEventPaymentOption();
    const costs = option && Array.isArray(option.cost) ? option.cost : [];
    return costs.some((cost) => {
      if (!this.isEventPaymentCost(cost)) return false;
      if (cost.type === 'symbolCost' || cost.type === 'discardEvent') return !cost.symbol || event.symbol === cost.symbol;
      return true;
    });
  }

  renderEventPaymentPanel() {
    const pending = this.state.pendingEventPayment;
    if (!pending) return null;
    const event = this.state.eventHand[pending.eventIndex];
    const option = this.getPendingEventPaymentOption();
    const selected = pending.selectedIndices || [];
    const required = this.getPendingEventPaymentRequiredCount();
    return (
      <div style={{ ...styles.panel, borderColor: '#f59e0b', background: '#fff7ed', marginBottom: 12, ...this.getTutorialHighlightStyle('event') }}>
        {this.renderSectionTitle('支付事件费用', `${selected.length} / ${required}`)}
        <div style={{ color: '#7c2d12', fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>
          {event ? event.name : '事件'} / {option ? option.name : '选项'}：{pending.costText || '无费用'}
        </div>
        <div style={styles.cardGrid}>{this.state.eventHand.map((card, idx) => {
          const isPlayed = idx === pending.eventIndex;
          const selectable = this.canUseEventCardForPayment(card, idx);
          const checked = selected.includes(idx);
          const disabled = isPlayed || (!checked && (!selectable || selected.length >= required));
          return (
            <button key={card._id || card.id || idx} onClick={() => this.toggleEventPaymentCard(idx)} disabled={disabled} style={{ flex: '1 1 160px', padding: 8, border: checked ? '2px solid #f59e0b' : '1px solid #fed7aa', borderRadius: 8, background: checked ? '#ffedd5' : '#fff', color: disabled ? '#94a3b8' : '#7c2d12', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{card.name}</strong>
                {this.renderEventSymbol(card.symbol)}
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>{isPlayed ? '正在打出的事件，不能支付自己' : selectable ? (checked ? '已选择' : '可作为费用') : '不符合费用要求'}</div>
            </button>
          );
        })}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={this.confirmEventPayment} disabled={selected.length !== required} style={this.buttonStyle(selected.length !== required, true)}>确认支付并打出</button>
          <button onClick={this.cancelEventPayment} style={styles.secondaryButton}>取消</button>
        </div>
      </div>
    );
  }
  renderEventDiscardPanel() {
    const pending = this.state.pendingEventDiscard;
    if (!pending) return null;
    const selected = pending.selectedIndices || [];
    const discardCount = pending.discardCount || 0;
    return (
      <div style={{ ...styles.panel, borderColor: '#fb7185', background: '#fff1f2', marginBottom: 12, ...this.getTutorialHighlightStyle('event') }}>
        {this.renderSectionTitle('选择弃置事件', `${selected.length} / ${discardCount}`)}
        <div style={{ color: '#9f1239', fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>
          事件阶段结束时最多保留 3 张事件卡。请选择要弃置的事件卡，未选择的会保留到下学期。
        </div>
        <div style={styles.cardGrid}>{this.state.eventHand.map((card, idx) => {
          const checked = selected.includes(idx);
          const disabled = !checked && selected.length >= discardCount;
          return (
            <button key={card._id || card.id || idx} onClick={() => this.toggleEventDiscardCard(idx)} disabled={disabled} style={{ flex: '1 1 170px', padding: 8, border: checked ? '2px solid #e11d48' : '1px solid #fecdd3', borderRadius: 8, background: checked ? '#ffe4e6' : '#fff', color: disabled ? '#94a3b8' : '#881337', textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{card.name}</strong>
                {this.renderEventSymbol(card.symbol)}
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>{checked ? '将被弃置' : '保留'}</div>
            </button>
          );
        })}</div>
        <button onClick={this.confirmEventDiscard} disabled={selected.length !== discardCount} style={{ ...this.buttonStyle(selected.length !== discardCount, true), marginTop: 10 }}>确认弃置并进入温习</button>
      </div>
    );
  }
  renderPendingPanels() {
    const { pendingProjectProgress, pendingCourseReward, activeProjects } = this.state;
    return (
      <>
        {this.renderEventPaymentPanel()}
        {this.renderEventDiscardPanel()}
        {pendingProjectProgress && (
          <div style={{ ...styles.panel, borderColor: '#93c5fd', background: '#eff6ff', marginBottom: 12, ...this.getTutorialHighlightStyle('project') }}>
            {this.renderSectionTitle('选择项目推进', '+' + pendingProjectProgress.amount)}
            <div style={styles.cardGrid}>{activeProjects.map((project, idx) => (
              <button key={project._instanceId || project._id || project.id || idx} onClick={() => this.applyProjectProgressTarget(idx)} style={{ ...styles.secondaryButton, textAlign: 'left' }}>
                {project.name} · {project.progress || 0}
              </button>
            ))}</div>
          </div>
        )}
        {pendingCourseReward && (
          <div style={{ ...styles.panel, borderColor: '#60a5fa', background: '#eef6ff', marginBottom: 12, ...this.getTutorialHighlightStyle('event') }}>
            {this.renderSectionTitle('选择课程奖励', pendingCourseReward.selectedIndices.length + ' / ' + pendingCourseReward.selectnum)}
            <div style={styles.cardGrid}>{pendingCourseReward.choices.map((course, idx) => {
              const selected = pendingCourseReward.selectedIndices.includes(idx);
              return (
                <button key={course._choiceId || course._id || course.id || idx} onClick={() => this.toggleCourseRewardSelection(idx)} style={{ padding: 0, border: selected ? '2px solid #2563eb' : '1px solid transparent', borderRadius: 9, background: selected ? '#dbeafe' : 'transparent', cursor: 'pointer' }}>
                  {this.renderCourseCard(course, idx, {}, true)}
                </button>
              );
            })}</div>
            <button onClick={this.confirmCourseReward} disabled={pendingCourseReward.selectedIndices.length !== pendingCourseReward.selectnum} style={{ ...this.buttonStyle(pendingCourseReward.selectedIndices.length !== pendingCourseReward.selectnum, true), marginTop: 10 }}>
              确认加入牌堆顶
            </button>
          </div>
        )}
      </>
    );
  }

  renderEventPhase() {
    const disabled = !!this.state.pendingCourseReward || !!this.state.pendingEventPayment || !!this.state.pendingEventDiscard;
    return (
      <div style={{ ...styles.panel, ...this.getTutorialHighlightStyle('event') }}>
        {this.renderSectionTitle('事件阶段', '已行动 ' + this.state.eventPlayedCount + ' / 2')}
        <div style={{ color: '#64748b', marginBottom: 12 }}>{this.state.eventMessage}</div>
        <div style={styles.cardGrid}>{this.state.eventHand.map((event, idx) => this.renderEventCard(event, idx))}</div>
        <button onClick={this.endEventPhase} disabled={disabled} style={{ ...this.buttonStyle(disabled, true), marginTop: 12 }}>确认进入下一阶段</button>
      </div>
    );
  }

  renderReviewPhase() {
    const disabled = !!this.state.pendingCourseReward || !!this.state.pendingEventPayment || !!this.state.pendingEventDiscard;
    return (
      <div style={{ ...styles.panel, ...this.getTutorialHighlightStyle('review') }}>
        {this.renderSectionTitle('温习阶段', '底部 ' + this.state.reviewPreviewCount + ' 张')}
        <div style={{ color: '#64748b', marginBottom: 12 }}>{this.state.reviewMessage}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, padding: 10, border: '1px solid #dbeafe', borderRadius: 8, background: '#f8fbff' }}>
          <div style={{ flex: '1 1 220px', color: '#475569', fontSize: 13 }}>可以降低本次考试抽牌数，换取等量项目推进。</div>
          {[1, 2].map((amount) => {
            const disabledTrade = !!this.state.pendingProjectProgress || !!this.state.pendingCourseReward || this.state.activeProjects.length === 0 || (this.state.reviewDrawTradeUsed + amount > 2);
            return <button key={amount} onClick={() => this.tradeExamDrawForProgress(amount)} disabled={disabledTrade} style={this.buttonStyle(disabledTrade)}>少抽 {amount} 张 · 推进 +{amount}</button>;
          })}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>当前牌堆顶</div>
          <div style={styles.cardGrid}>{this.state.reviewSelectedCards.length === 0 ? <div style={{ color: '#94a3b8' }}>暂无置顶课程</div> : this.state.reviewSelectedCards.map((card, idx) => this.renderCourseCard(card, idx, {}, true))}</div>
        </div>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>可查看课程</div>
        <div style={styles.cardGrid}>{this.state.reviewPreviewCards.map((card, idx) => (
          <button key={card._id || card.id || idx} onClick={() => this.reviewCard(idx)} style={{ padding: 0, border: '1px solid transparent', background: 'transparent', cursor: 'pointer' }}>
            {this.renderCourseCard(card, idx, {}, true)}
          </button>
        ))}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={this.endReview} disabled={disabled} style={this.buttonStyle(disabled, true)}>确认进入考试</button>
          <button onClick={this.resetReview} style={styles.secondaryButton}>重置</button>
        </div>
      </div>
    );
  }

  renderExamPhase(resultMap) {
    return (
      <div style={{ ...styles.panel, ...this.getTutorialHighlightStyle('exam') }}>
        {this.renderSectionTitle('考试阶段', '本次 ' + this.state.score + ' 分')}
        <div style={styles.cardGrid}>{this.state.hand.map((card, i) => this.renderCourseCard(card, i, resultMap[card._id || card.id]))}</div>
        <div style={{ marginTop: 12, color: '#334155', fontSize: 13, fontWeight: 700 }}>{this.getExamSummaryText()}</div>
        <button onClick={this.confirmExam} disabled={!!this.state.pendingProjectProgress || !!this.state.pendingCourseReward} style={{ ...this.buttonStyle(!!this.state.pendingProjectProgress || !!this.state.pendingCourseReward, true), marginTop: 12 }}>确认结算并进入下一学期</button>
      </div>
    );
  }

  renderReadyPhase() {
    const disabled = this.state.eventStageActive || this.state.reviewStageActive || this.state.examStageActive || !!this.state.pendingCourseReward;
    if (this.state.awaitingEventStart && this.state.currentTest) {
      const test = this.state.currentTest;
      return (
        <div style={{ ...styles.panel, border: '2px solid #7c3aed', background: '#faf5ff', boxShadow: '0 10px 24px rgba(124, 58, 237, 0.14)', ...this.getTutorialHighlightStyle('test') }}>
          {this.renderSectionTitle('本学期考试', '确认后进入事件阶段')}
          <div style={{ fontSize: 24, fontWeight: 900, color: '#4c1d95', marginBottom: 8 }}>{test.name}</div>
          <div style={{ color: '#5b4b80', fontSize: 14, lineHeight: 1.55, marginBottom: 12 }}>{test.content || '无描述'}</div>
          {this.renderTestFeatureBlocks(test)}
          <div style={{ marginBottom: 14 }} />
          <button onClick={this.startEventPhase} style={this.buttonStyle(false, true)}>进入事件阶段</button>
        </div>
      );
    }
    return (
      <div style={{ ...styles.panel, ...this.getTutorialHighlightStyle('test') }}>
        {this.renderSectionTitle('准备阶段', '等待开始')}
        <div style={{ color: '#64748b', marginBottom: 12 }}>开始新学期后会先揭示考试牌；确认后才会保留已有事件牌并新抽 3 张事件卡。</div>
        <button onClick={this.startSemester} disabled={disabled} style={this.buttonStyle(disabled, true)}>开始学期</button>
      </div>
    );
  }
  renderMainPhase(resultMap) {
    if (this.state.awaitingEventStart) return this.renderReadyPhase();
    if (this.state.eventStageActive) return this.renderEventPhase();
    if (this.state.reviewStageActive) return this.renderReviewPhase();
    if (this.state.examStageActive) return this.renderExamPhase(resultMap);
    return this.renderReadyPhase();
  }

  renderBoardPanel() {
    const { activePermanents } = this.state;
    return (
      <div>
        {this.renderCurrentTestPanel()}
        <div style={{ ...styles.panel, ...this.getTutorialHighlightStyle('permanent') }}>
          {this.renderSectionTitle('成果区', activePermanents.length + ' 张')}
          <div style={styles.compactList}>{activePermanents.length === 0 ? <div style={{ color: '#94a3b8' }}>暂无成果卡</div> : activePermanents.map((permanent, i) => this.renderPermanentCard(permanent, i))}</div>
        </div>
        {this.renderLogPanel()}
        {this.renderSavePanel()}
      </div>
    );
  }

  renderProjectPanel() {
    const { activeProjects } = this.state;
    return (
      <div style={{ ...styles.panel, marginBottom: 12, ...this.getTutorialHighlightStyle('project') }}>
        {this.renderSectionTitle('项目区', activeProjects.length + ' 张')}
        <div style={styles.cardGrid}>
          {activeProjects.length === 0
            ? <div style={{ color: '#94a3b8' }}>暂无项目卡</div>
            : activeProjects.map((project, i) => this.renderProjectCard(project, i))}
        </div>
      </div>
    );
  }

  renderLogPanel() {
    const rows = [];
    (this.state.goalResults || []).forEach((line) => rows.push(['目标', line]));
    (this.state.testResults || []).forEach((item) => rows.push(['考试', item.name + '：' + ((item.effects || []).join('；') || '无明细') + (item.score != null ? '（分数 ' + item.score + '）' : '')]));
    (this.state.permanentResults || []).forEach((item) => rows.push(['成果', item.name + '：' + item.effects.join('；')]));
    (this.state.eventResults || []).forEach((item) => rows.push(['事件', item.name + ' / ' + item.optionName + '：' + item.effects.join('；')]));
    if (this.state.lastAchievement) rows.push(['提示', this.state.lastAchievement]);
    return (
      <div style={{ ...styles.panel, marginTop: 12, maxHeight: 360, overflowY: 'auto', ...this.getTutorialHighlightStyle('log') }}>
        {this.renderSectionTitle('日志', rows.length + ' 条')}
        {rows.length === 0 ? <div style={{ color: '#94a3b8' }}>暂无日志</div> : rows.map(([type, text], idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 8, padding: '7px 0', borderTop: idx === 0 ? 'none' : '1px solid #edf2f7', fontSize: 13 }}>
            <div style={{ color: '#64748b', fontWeight: 800 }}>{type}</div>
            <div style={{ color: '#334155' }}>{text}</div>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const resultMap = this.state.cardResults.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div>
            <h3 style={styles.title}>Deckgame</h3>
            <div style={styles.subtitle}>第 {this.state.semester} 学期 · {this.getPhaseName()}</div>
          </div>
          {this.renderTopAction()}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            {this.renderPhaseStrip()}
            {this.props.onBackToMenu && (
              <button type="button" onClick={this.props.onBackToMenu} style={styles.secondaryButton}>
                主菜单
              </button>
            )}
          </div>
        </div>
        <div style={styles.board}>
          <div>
            {this.renderStatusPanel()}
            {this.renderGoalPanel()}
          </div>
          <div>
            {this.renderPendingPanels()}
            {this.renderProjectPanel()}
            {this.renderMainPhase(resultMap)}
          </div>
          {this.renderBoardPanel()}
        </div>
        {this.renderTutorialPanel()}
      </div>
    );
  }
}












