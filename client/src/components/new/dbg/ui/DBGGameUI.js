import React from 'react';
import DBGEngine from '../engine/DBGEngine';
import config from '../data/GameConfig.json';
import startCards from '../data/Start_cards.json';
import basicCards from '../data/Basic_cards.json';
import upCards from '../data/Up_cards.json';
import statusCards from '../data/Status_cards.json';
import attackCards from '../data/Attack_cards.json';
import characterCards from '../data/Character_cards.json';
import tutorials from '../data/Tutorials.json';
import {
  LOCAL_SAVE_SLOTS,
  AUTOSAVE_SLOT,
  GAME_NAME,
  getSaveKey,
  readLocalSaveSlot,
  normalizeCloudSave,
  formatSaveTime,
  loadCloudSaveRecords,
  parseCloudSaveList,
  saveCloudRecord,
  readProgress,
  recordCompletedCharacter,
  setDebugUnlockAll,
} from './saveGameService';
import './DBGGameUI.css';

const RESOURCE_LABELS = {
  download: '下载',
  upload: '上传',
  block: '防护',
  mobility: '机动',
  counter: '反击',
  draw: '抽牌',
};

const ZONE_LABELS = {
  hand: '手牌',
  discardPile: '弃牌堆',
  drawPile: '抽牌堆',
  playArea: '打出区',
  retainedArea: '驻留区',
  upMarket: '进阶市场',
  basicMarket: '基础市场',
};

const RESOURCE_ICON = {
  download: 'download',
  upload: 'upload',
  block: 'block',
  mobility: 'mobility',
  counter: 'counter',
  draw: 'draw',
  upgrade: 'upgrade',
  trash: 'trash',
};

const STATUS_ICON = {
  status_stun: 'stun',
  status_wound: 'wound',
  status_injured: 'wound',
  status_bleed: 'bleed',
};

const FEATURE_META = {
  supply: { label: '补给', color: '#d970d6', className: 'supply' },
  fullPower: { label: '全力', color: '#f01925', className: 'full' },
  retain: { label: '保留', color: '#38d774', className: 'retain' },
  flow: { label: '流程', color: '#f0ea00', className: 'flow' },
};

const DIRECT_CHOICE_ZONES = new Set(['hand', 'upMarket', 'basicMarket']);
const DEFAULT_TUTORIAL_ID = tutorials[0]?.id || 'basic_upload';

export default class DBGGameUI extends React.Component {
  constructor(props) {
    super(props);
    const tutorialId = props.tutorialId || DEFAULT_TUTORIAL_ID;
    const tutorial = props.tutorialMode ? tutorials.find((item) => item.id === tutorialId) : null;
    this.engine = new DBGEngine({
      config,
      startCards,
      basicCards,
      upCards,
      statusCards,
      attackCards,
      characterCards,
      difficulty: tutorial?.difficulty || props.difficulty,
    });
    this.handPointer = null;
    this.devUnlockTimer = null;
    this.appliedTutorialSteps = new Set();
    this.sessionStartedAt = Date.now();
    this.state = {
      game: this.engine.getState(),
      tutorial: props.tutorialMode ? {
        active: true,
        tutorialId: tutorial?.id || tutorialId,
        stepIndex: 0,
        started: false,
        completed: false,
      } : null,
      progress: readProgress(),
      choiceSelection: {},
      basicShopOpen: false,
      upgradePreview: false,
      modePicker: null,
      pileViewer: null,
      dragCard: null,
      devUnlockOpen: false,
      saveSlots: this.readSaveSlots(),
      cloudSaveSlots: {},
      cloudLatestSave: null,
      saveMessage: '',
      cloudSaveMessage: '云端未同步',
    };
  }

  componentDidMount() {
    if (this.isTutorialSession()) {
      this.setState({ saveMessage: '教程模式不保存', cloudSaveMessage: '教程中不同步云端' });
      window.setTimeout(() => this.startTutorialIfNeeded(), 0);
      return;
    }
    this.refreshCloudSaves();
    if (this.props.initialSaveData) {
      window.setTimeout(() => this.loadSaveData(this.props.initialSaveData, '云端存档', { alert: false }), 0);
    } else if (this.props.initialSaveSlot) {
      window.setTimeout(() => this.loadSave(this.props.initialSaveSlot, { alert: false }), 0);
    }
  }

  componentWillUnmount() {
    this.cancelDevUnlockHold();
    this.removeDragListeners();
  }

  addDragListeners() {
    window.addEventListener('pointermove', this.handleGlobalPointerMove, { passive: false });
    window.addEventListener('pointerup', this.handleGlobalPointerUp);
    window.addEventListener('pointercancel', this.handleGlobalPointerCancel);
    document.body.classList.add('dbg-card-dragging');
  }

  removeDragListeners() {
    window.removeEventListener('pointermove', this.handleGlobalPointerMove);
    window.removeEventListener('pointerup', this.handleGlobalPointerUp);
    window.removeEventListener('pointercancel', this.handleGlobalPointerCancel);
    document.body.classList.remove('dbg-card-dragging');
  }

  syncState = (game, options = {}, afterSync = null) => {
    this.setState((prev) => ({
      game,
      choiceSelection: game.pendingChoice && prev.game.pendingChoice?.id === game.pendingChoice.id ? prev.choiceSelection : {},
      basicShopOpen: options.resetUi ? false : prev.basicShopOpen,
      pileViewer: options.resetUi ? null : prev.pileViewer,
      modePicker: null,
      dragCard: null,
    }), () => {
      const tutorialSession = this.isTutorialSession();
      if (!tutorialSession && !options.skipProgress && !options.wasWin) this.recordCompletionIfNeeded(game);
      if (!tutorialSession && !options.skipAutosave) this.writeAutosave();
      if (afterSync) afterSync();
    });
  };

  run = (command) => {
    this.removeDragListeners();
    this.handPointer = null;
    const wasWin = this.state.game?.result === 'win';
    const observedCommand = this.observeTutorialCommand(command);
    const game = this.engine.execute(command);
    this.syncState(game, { resetUi: command.type === 'RESET_GAME', wasWin }, () => {
      this.handleTutorialCommand(observedCommand, game);
    });
  };

  isTutorialSession(state = this.state) {
    return Boolean(state.tutorial?.active);
  }

  isTutorialPanelActive(state = this.state) {
    return Boolean(state.tutorial?.active && !state.tutorial.completed);
  }

  getCurrentTutorial(state = this.state) {
    if (!state.tutorial?.active) return null;
    return tutorials.find((tutorial) => tutorial.id === state.tutorial.tutorialId) || tutorials[0] || null;
  }

  getCurrentTutorialStep(state = this.state) {
    if (!this.isTutorialPanelActive(state)) return null;
    const tutorial = this.getCurrentTutorial(state);
    return tutorial?.steps?.[state.tutorial.stepIndex] || null;
  }

  startTutorialIfNeeded = () => {
    if (!this.isTutorialSession() || this.state.tutorial.started) return;
    this.setState((prev) => ({
      tutorial: {
        ...prev.tutorial,
        started: true,
      },
    }), this.applyCurrentTutorialStep);
  };

  restartTutorial = () => {
    const tutorial = this.getCurrentTutorial();
    this.appliedTutorialSteps = new Set();
    this.engine = new DBGEngine({
      config,
      startCards,
      basicCards,
      upCards,
      statusCards,
      attackCards,
      characterCards,
      difficulty: tutorial?.difficulty || this.props.difficulty,
    });
    this.setState((prev) => ({
      game: this.engine.getState(),
      tutorial: {
        ...(prev.tutorial || {}),
        active: true,
        tutorialId: tutorial?.id || prev.tutorial?.tutorialId || DEFAULT_TUTORIAL_ID,
        stepIndex: 0,
        started: false,
        completed: false,
      },
      choiceSelection: {},
      basicShopOpen: false,
      modePicker: null,
      pileViewer: null,
      dragCard: null,
      saveMessage: '教程已重置',
    }), this.startTutorialIfNeeded);
  };

  applyCurrentTutorialStep = () => {
    const tutorial = this.getCurrentTutorial();
    const step = this.getCurrentTutorialStep();
    if (!tutorial || !step) return;
    const key = `${tutorial.id}:${this.state.tutorial.stepIndex}:${step.id}`;
    if (this.appliedTutorialSteps.has(key)) return;
    this.appliedTutorialSteps.add(key);
    if (!step.setup) return;
    const game = this.engine.execute({ type: 'TUTORIAL_SETUP', setup: step.setup });
    this.syncState(game, { resetUi: step.setup.reset !== false, skipAutosave: true, skipProgress: true });
  };

  observeTutorialCommand(command = {}) {
    if (!this.isTutorialSession()) return command;
    const game = this.state.game || {};
    const observed = { ...command };
    if (command.type === 'PLAY_CARD') {
      const card = game.hand?.[Number(command.handIndex)];
      observed.cardId = card?.id;
      observed.cardName = card?.name;
    }
    if (command.type === 'BUY_CARD') {
      const market = command.marketType === 'basic' ? game.basicMarket : game.upMarket;
      const card = market?.[Number(command.index)];
      observed.marketType = command.marketType || 'up';
      observed.cardId = card?.id;
      observed.cardName = card?.name;
    }
    if (command.type === 'RESOLVE_CHOICE') {
      observed.choiceType = game.pendingChoice?.type;
      observed.choiceEffect = game.pendingChoice?.payload?.effect;
    }
    return observed;
  }

  handleTutorialCommand(observedCommand = {}, game = this.state.game) {
    const step = this.getCurrentTutorialStep();
    if (!step?.waitFor) return;
    if (this.tutorialWaitSatisfied(step.waitFor, observedCommand, game)) {
      this.advanceTutorial();
    }
  }

  handleTutorialUiEvent(eventType, payload = {}) {
    const step = this.getCurrentTutorialStep();
    if (!step?.waitFor) return;
    if (this.tutorialWaitSatisfied(step.waitFor, { type: eventType, ...payload }, this.state.game)) {
      this.advanceTutorial();
    }
  }

  tutorialWaitSatisfied(waitFor, command = {}, game = this.state.game) {
    if (Array.isArray(waitFor)) return waitFor.some((condition) => this.tutorialWaitSatisfied(condition, command, game));
    if (!waitFor) return false;
    const type = waitFor.type || 'command';
    if (type === 'command') {
      const commands = waitFor.commands || (waitFor.command ? [waitFor.command] : []);
      if (!commands.includes(command.type)) return false;
      if (waitFor.marketType && waitFor.marketType !== command.marketType) return false;
      if (waitFor.cardId && waitFor.cardId !== command.cardId) return false;
      if (waitFor.cardIds && !waitFor.cardIds.includes(command.cardId)) return false;
      if (waitFor.choiceType && waitFor.choiceType !== command.choiceType) return false;
      if (waitFor.choiceEffect && waitFor.choiceEffect !== command.choiceEffect) return false;
      return true;
    }
    if (type === 'ui') {
      const events = waitFor.events || (waitFor.event ? [waitFor.event] : []);
      if (!events.includes(command.type)) return false;
      if (waitFor.zone && waitFor.zone !== command.zone) return false;
      return true;
    }
    if (type === 'phase') return game.phase === waitFor.phase;
    if (type === 'turnAtLeast') return Number(game.turn) >= (Number(waitFor.amount) || 0);
    if (type === 'uploadAtLeast') return Number(game.upload) >= (Number(waitFor.amount) || 0);
    if (type === 'result') return game.result === waitFor.result;
    return false;
  }

  goToTutorialStep(index) {
    const tutorial = this.getCurrentTutorial();
    const maxIndex = Math.max(0, (tutorial?.steps?.length || 1) - 1);
    this.setState((prev) => ({
      tutorial: {
        ...prev.tutorial,
        stepIndex: Math.max(0, Math.min(maxIndex, index)),
      },
    }), this.applyCurrentTutorialStep);
  }

  advanceTutorial = () => {
    const tutorial = this.getCurrentTutorial();
    if (!tutorial) return;
    const nextIndex = this.state.tutorial.stepIndex + 1;
    if (nextIndex >= (tutorial.steps || []).length) {
      this.completeTutorial();
      return;
    }
    this.goToTutorialStep(nextIndex);
  };

  completeTutorial = () => {
    this.setState((prev) => ({
      tutorial: {
        ...prev.tutorial,
        completed: true,
      },
      saveMessage: '教程已完成，不保存',
    }));
  };

  exitTutorial = () => {
    if (this.props.onBackToMenu) {
      this.props.onBackToMenu();
      return;
    }
    this.completeTutorial();
  };

  runTutorialAction = (action = {}) => {
    if (action.exit) {
      this.exitTutorial();
      return;
    }
    const commands = action.commands || [];
    let game = this.state.game;
    commands.forEach((command) => {
      game = this.engine.execute(command);
    });
    const finishAction = () => {
      if (action.complete) {
        this.completeTutorial();
      } else if (action.advance || commands.length === 0) {
        this.advanceTutorial();
      }
    };
    const closePatch = action.closeModals ? { basicShopOpen: false, pileViewer: null, modePicker: null } : null;
    if (commands.length === 0) {
      if (closePatch) this.setState(closePatch, finishAction);
      else finishAction();
      return;
    }
    this.syncState(game, {
      resetUi: commands.some((command) => command.type === 'RESET_GAME' || command.type === 'TUTORIAL_SETUP'),
      skipAutosave: true,
      skipProgress: true,
    }, () => {
      if (closePatch) this.setState(closePatch, finishAction);
      else finishAction();
    });
  };

  tutorialFocusClass(target) {
    const step = this.getCurrentTutorialStep();
    return step?.focus === target ? ' dbg-tutorial-focus' : '';
  }

  toggleUpgradePreview = () => {
    this.setState((prev) => ({ upgradePreview: !prev.upgradePreview }), () => {
      if (this.state.upgradePreview) this.handleTutorialUiEvent('TOGGLE_UPGRADE_PREVIEW');
    });
  };

  toggleBasicShop = () => {
    this.setState((prev) => ({ basicShopOpen: !prev.basicShopOpen }), () => {
      if (this.state.basicShopOpen) this.handleTutorialUiEvent('OPEN_BASIC_SHOP');
    });
  };

  openPileViewer = (zone) => {
    this.setState({ pileViewer: zone }, () => {
      this.handleTutorialUiEvent('OPEN_PILE_VIEWER', { zone });
    });
  };

  recordCompletionIfNeeded(game = this.state.game) {
    if (game.result !== 'win' || !game.selectedCharacter?.id) return;
    const nextProgress = recordCompletedCharacter(game.selectedCharacter.id);
    this.setState({ progress: nextProgress });
  }

  completedCharacterIds(progress = this.state.progress) {
    return Object.keys(progress.completedCharacters || {}).filter((id) => progress.completedCharacters[id]);
  }

  isCharacterUnlocked(character = {}) {
    const progress = this.state.progress || readProgress();
    if (!character.unlock || progress.debugUnlockAll) return true;
    const unlock = character.unlock;
    if (unlock.type === 'completeDifferentCharacters') {
      const excluded = new Set(unlock.exclude || []);
      return this.completedCharacterIds(progress).filter((id) => !excluded.has(id)).length >= (Number(unlock.count) || 1);
    }
    if (unlock.type === 'completeCharacter') {
      return Boolean(progress.completedCharacters?.[unlock.characterId]);
    }
    return true;
  }

  unlockHint(character = {}) {
    const unlock = character.unlock || {};
    if (unlock.type === 'completeDifferentCharacters') {
      const excluded = new Set(unlock.exclude || []);
      const current = this.completedCharacterIds().filter((id) => !excluded.has(id)).length;
      return `完成 ${Number(unlock.count) || 1} 个不同角色后解锁（${Math.min(current, Number(unlock.count) || 1)}/${Number(unlock.count) || 1}）`;
    }
    if (unlock.type === 'completeCharacter') return '完成第一个特殊角色后解锁';
    return '达成隐藏条件后解锁';
  }

  startDevUnlockHold = () => {
    this.cancelDevUnlockHold();
    if (typeof window === 'undefined') return;
    this.devUnlockTimer = window.setTimeout(() => {
      this.devUnlockTimer = null;
      this.setState({ devUnlockOpen: true });
    }, 5000);
  };

  cancelDevUnlockHold = () => {
    if (this.devUnlockTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.devUnlockTimer);
    }
    this.devUnlockTimer = null;
  };

  unlockAllForDev = () => {
    const progress = setDebugUnlockAll(true);
    this.setState({ progress, devUnlockOpen: false });
  };

  getSavePhaseName(game = this.state.game) {
    if (game.gameOver) return game.result === 'win' ? '上传完成' : '上传失败';
    if (game.phase === 'setup') return '角色选择';
    if (game.pendingChoice) return '选择结算';
    return '行动阶段';
  }

  readSaveSlot(slot) {
    return readLocalSaveSlot(slot);
  }

  readSaveSlots() {
    return [...LOCAL_SAVE_SLOTS, AUTOSAVE_SLOT].reduce((map, slot) => {
      map[slot] = this.readSaveSlot(slot);
      return map;
    }, {});
  }

  mergeSaveSlots(localSlots = this.readSaveSlots()) {
    return [...LOCAL_SAVE_SLOTS, AUTOSAVE_SLOT].reduce((map, slot) => {
      map[slot] = localSlots[slot] || null;
      return map;
    }, {});
  }

  getPlayTime() {
    return Math.max(0, Math.floor((Date.now() - this.sessionStartedAt) / 1000));
  }

  refreshCloudSaves() {
    loadCloudSaveRecords()
      .then((res) => {
        const parsed = parseCloudSaveList(res);
        if (parsed.error) {
          this.setState({ cloudSaveSlots: {}, cloudLatestSave: null, saveSlots: this.readSaveSlots(), cloudSaveMessage: '未登录，仅本地存档' });
          return;
        }
        const cloudSaveSlots = {};
        parsed.saves.forEach((save) => {
          const slot = save.slot || save.meta?.slot;
          if (!slot) return;
          const existing = cloudSaveSlots[slot];
          if (!existing || new Date(save.savedAt || 0) > new Date(existing.savedAt || 0)) {
            cloudSaveSlots[slot] = save;
          }
        });
        this.setState({
          cloudSaveSlots,
          cloudLatestSave: parsed.saves[0] || null,
          saveSlots: this.mergeSaveSlots(this.readSaveSlots()),
          cloudSaveMessage: parsed.saves.length ? '云端已同步' : '没有云端存档',
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

    saveCloudRecord(payload)
      .then((res) => {
        if (res && res.error) {
          if (!options.silent) this.setState({ cloudSaveMessage: '未登录，仅保存到本地' });
          return;
        }
        const savedRecord = res && res.data ? res.data : null;
        const savedCloud = normalizeCloudSave(savedRecord) || { ...save, _id: payload._id, savedAt: save.savedAt };
        this.setState((prev) => {
          const cloudSaveSlots = { ...prev.cloudSaveSlots, [slot]: savedCloud };
          const previous = prev.cloudLatestSave;
          const cloudLatestSave = !previous || new Date(savedCloud.savedAt || 0) >= new Date(previous.savedAt || 0)
            ? savedCloud
            : previous;
          return {
            cloudSaveSlots,
            cloudLatestSave,
            saveSlots: this.mergeSaveSlots(prev.saveSlots),
            cloudSaveMessage: options.silent ? prev.cloudSaveMessage : '云端已保存',
          };
        });
      })
      .catch(() => {
        if (!options.silent) this.setState({ cloudSaveMessage: '云端保存失败，本地已保存' });
      });
  }

  createSave(slot) {
    const game = this.state.game;
    const snapshot = this.engine.exportSnapshot();
    return {
      version: 1,
      slot,
      name: slot === AUTOSAVE_SLOT ? '自动存档' : `本地槽位 ${slot}`,
      savedAt: new Date().toISOString(),
      meta: {
        slot,
        turn: game.turn,
        phase: this.getSavePhaseName(game),
        upload: game.upload,
        uploadTarget: game.uploadTarget,
        character: game.selectedCharacter?.name || '',
        difficulty: game.difficulty?.name || '',
        difficultyId: game.difficulty?.id || '',
        lifeLoss: game.lifeLoss,
      },
      snapshot,
    };
  }

  writeSave(slot, options = {}) {
    if (this.isTutorialSession()) {
      if (!options.silent) this.setState({ saveMessage: '教程模式不保存' });
      return;
    }
    if (typeof window === 'undefined' || !window.localStorage) return;
    const save = this.createSave(slot);
    try {
      window.localStorage.setItem(getSaveKey(slot), JSON.stringify(save));
    } catch (err) {
      if (!options.silent) this.setState({ saveMessage: '本地保存失败' });
      return;
    }
    this.setState((prev) => ({
      saveSlots: { ...prev.saveSlots, [slot]: save },
      saveMessage: options.silent ? prev.saveMessage : `已保存到槽位 ${slot}`,
    }));
    this.syncSaveToCloud(slot, save, options);
  }

  writeAutosave() {
    this.writeSave(AUTOSAVE_SLOT, { silent: true });
  }

  loadSaveData(save, label = '存档', options = {}) {
    const shouldAlert = options.alert !== false;
    if (!save || !save.snapshot) {
      const message = `${label} 没有存档`;
      this.setState({ saveMessage: message });
      if (shouldAlert && typeof window !== 'undefined' && window.alert) window.alert(message);
      return;
    }
    const restored = this.engine.importSnapshot(save.snapshot);
    this.syncState(restored, { skipAutosave: true, skipProgress: true, resetUi: true });
    const message = `已读取${label}`;
    this.setState({
      saveSlots: this.mergeSaveSlots(this.readSaveSlots()),
      saveMessage: message,
    });
    if (shouldAlert && typeof window !== 'undefined' && window.alert) window.alert(message);
  }

  loadSave(slot, options = {}) {
    this.loadSaveData(this.readSaveSlot(slot), `槽位 ${slot}`, options);
  }

  loadLatestCloudSave = () => {
    this.loadSaveData(this.state.cloudLatestSave, '最新云端存档');
  };

  deleteSave(slot) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(getSaveKey(slot));
    this.setState({
      saveSlots: this.mergeSaveSlots(this.readSaveSlots()),
      saveMessage: `已删除本地槽位 ${slot}`,
    });
  }

  choiceKey(candidate) {
    return `${candidate.zone}:${candidate.instanceId}`;
  }

  choiceCandidateFor(zone, card = {}) {
    const choice = this.state.game.pendingChoice;
    if (!choice || !card?._instanceId) return null;
    return (choice.candidates || []).find((candidate) => candidate.zone === zone && candidate.instanceId === card._instanceId);
  }

  selectedChoiceCandidates(choice) {
    return (choice.candidates || []).filter((candidate) => this.state.choiceSelection[this.choiceKey(candidate)]);
  }

  requiresChoiceModal(choice = null) {
    if (!choice) return false;
    return (choice.candidates || []).some((candidate) => !DIRECT_CHOICE_ZONES.has(candidate.zone));
  }

  toggleChoiceCandidate = (candidate) => {
    this.setState((prev) => {
      const choice = prev.game.pendingChoice;
      if (!choice) return null;
      const key = this.choiceKey(candidate);
      const next = { ...prev.choiceSelection };
      if (next[key]) {
        delete next[key];
        return { choiceSelection: next };
      }
      if (choice.max <= 1) return { choiceSelection: { [key]: true } };
      if (Object.keys(next).length >= choice.max) return null;
      next[key] = true;
      return { choiceSelection: next };
    });
  };

  confirmChoice = () => {
    const choice = this.state.game.pendingChoice;
    if (!choice) return;
    const selected = this.selectedChoiceCandidates(choice).map((candidate) => ({
      zone: candidate.zone,
      instanceId: candidate.instanceId,
    }));
    this.run({ type: 'RESOLVE_CHOICE', choiceId: choice.id, selected, accepted: true });
  };

  skipChoice = () => {
    const choice = this.state.game.pendingChoice;
    if (!choice) return;
    this.run({ type: 'RESOLVE_CHOICE', choiceId: choice.id, selected: [], accepted: false });
  };

  fullCardFromSummary(summary = {}) {
    const definition = this.engine.definitions?.[summary.id] || {};
    return {
      ...definition,
      ...summary,
      _instanceId: summary.instanceId || summary._instanceId,
      upgraded: Boolean(summary.upgraded),
    };
  }

  displayCard(card = {}) {
    if (!this.state.upgradePreview || card.upgraded || !card.upgrade) return card;
    return { ...card, upgraded: true };
  }

  getFeatureKeys(card = {}, face = {}) {
    const found = new Set();
    (face.keywords || []).forEach((keyword) => {
      if (FEATURE_META[keyword]) found.add(keyword);
    });
    return Array.from(found);
  }

  titleStyleFor(features = []) {
    if (features.length <= 1) return undefined;
    const stops = features.map((feature, index) => {
      const start = Math.floor((index / features.length) * 100);
      const end = Math.floor(((index + 1) / features.length) * 100);
      return `${FEATURE_META[feature].color} ${start}% ${end}%`;
    }).join(', ');
    return { background: `linear-gradient(135deg, ${stops})` };
  }

  titleClassFor(features = []) {
    return features.length === 1 ? FEATURE_META[features[0]].className : 'none';
  }

  isPointOverPlayArea(x, y) {
    const target = document.elementFromPoint(x, y);
    return Boolean(target?.closest?.('[data-dbg-drop-zone="play-area"]'));
  }

  tierFor(value, breakpoints = []) {
    const number = Number(value) || 0;
    if (number >= (Number(breakpoints[1]) || Infinity)) return 2;
    if (number >= (Number(breakpoints[0]) || Infinity)) return 1;
    return 0;
  }

  tierLabel(index, breakpoints = []) {
    if (index === 0) return '0';
    return `>=${breakpoints[index - 1] || 0}`;
  }

  describeAfterAttackEffect(effect = {}) {
    switch (effect.type) {
      case 'addDecay':
        return `额外衰减+${effect.amount || 1}`;
      case 'gainStatus': {
        const names = {
          status_stun: '处理延迟',
          status_wound: '机体损伤',
          status_bleed: '线路泄漏',
        };
        return `${names[effect.cardId] || '状态'}+${effect.amount || 1}`;
      }
      case 'draw':
        return `下回合抽牌+${effect.amount || 1}`;
      case 'discardAllRetainedCards':
        return '弃掉保留牌';
      case 'nextTurnGain':
        return Object.keys(effect.gain || {}).map((resource) => `下回合${RESOURCE_LABELS[resource] || resource}+${effect.gain[resource]}`).join('、');
      case 'nextTurnLose':
        return Object.keys(effect.loss || {}).map((resource) => `下回合${RESOURCE_LABELS[resource] || resource}-${effect.loss[resource]}`).join('、');
      case 'nextTurnUploadMultiplier':
        return `下回合上传×${effect.multiplier || 1}`;
      default:
        return effect.label || effect.type || '';
    }
  }

  describeAfterAttack(attack = null, cell = null) {
    if (!attack?.afterAttack) return '';
    const normal = (attack.afterAttack.effects || []).map((effect) => this.describeAfterAttackEffect(effect)).filter(Boolean);
    const red = cell?.cancelRedEffects ? [] : (attack.afterAttack.redEffects || []).map((effect) => this.describeAfterAttackEffect(effect)).filter(Boolean);
    return [...normal, ...red.map((text) => `红色：${text}`)].join(' / ');
  }

  getBasicRecommendations(game = this.state.game) {
    const download = Number(game.download) || 0;
    const market = (game.basicMarket || []).map((card, index) => ({ card, index }));
    const buyable = market
      .filter(({ card }) => (Number(card.cost) || 0) <= download)
      .sort((a, b) => (Number(b.card.cost) || 0) - (Number(a.card.cost) || 0) || a.index - b.index);
    const selected = buyable.slice(0, 3);
    if (selected.length >= 3) return selected;
    const selectedIndexes = new Set(selected.map(({ index }) => index));
    const fillers = market
      .filter(({ index }) => !selectedIndexes.has(index))
      .sort((a, b) => (Number(a.card.cost) || 0) - (Number(b.card.cost) || 0) || a.index - b.index)
      .slice(0, 3 - selected.length);
    return [...selected, ...fillers];
  }

  faceOptionsFor(card = {}) {
    const modes = this.engine.getPlayableModes(card);
    if (!modes.length) return [this.engine.getCardFace(card)];
    return modes.map((mode) => this.engine.getCardFace(card, mode.id));
  }

  cardHasKeyword(card = {}, keyword) {
    return this.faceOptionsFor(card).some((face) => (face.keywords || []).includes(keyword));
  }

  isFullPowerBlocked(card = {}) {
    if (!this.state.game.fullPowerUsedThisTurn || this.state.game.supplyCharges > 0) return false;
    const faces = this.faceOptionsFor(card);
    return faces.length > 0 && faces.every((face) => (face.keywords || []).includes('fullPower') && !(face.keywords || []).includes('supply'));
  }

  isRetainPredictionCard(card = {}) {
    return this.faceOptionsFor(card).some((face) => (face.keywords || []).includes('retain'));
  }

  predictionNonCombatScore(face = {}) {
    const gain = face.gain || {};
    return (Number(gain.upload) || 0) * 10 + (Number(gain.download) || 0);
  }

  predictionCombatScore(face = {}) {
    const gain = face.gain || {};
    return (Number(gain.block) || 0) * 4 + (Number(gain.mobility) || 0) * 3 + (Number(gain.counter) || 0) * 3;
  }

  choosePredictionFace(card = {}) {
    return this.faceOptionsFor(card)
      .slice()
      .sort((a, b) => this.predictionNonCombatScore(b) - this.predictionNonCombatScore(a) || this.predictionCombatScore(b) - this.predictionCombatScore(a))[0] || this.engine.getCardFace(card);
  }

  attackCellForResources(attack = null, mobility = 0, counter = 0) {
    if (!attack) return null;
    if (Object.prototype.hasOwnProperty.call(attack, 'fixedAttack')) return { attack: Number(attack.fixedAttack) || 0 };
    const row = this.tierFor(mobility, attack.mobilityBreakpoints || []);
    const col = this.tierFor(counter, attack.counterBreakpoints || []);
    return attack.attackTable?.[row]?.[col] || { attack: null };
  }

  estimateCombatOutcome(options = {}) {
    const game = this.state.game;
    const attack = game.currentAttack;
    const excludeRetain = Boolean(options.excludeRetain);
    let block = Number(game.block) || 0;
    let mobility = Number(game.mobility) || 0;
    let counter = Number(game.counter) || 0;
    let supplyCharges = Number(game.supplyCharges) || 0;
    let fullPowerUsed = Boolean(game.fullPowerUsedThisTurn);

    (game.hand || []).forEach((card) => {
      if (card.id === 'status_wound' && card.canDiscardForBlock !== false) {
        block += Number(game.config?.defaultDiscardForBlock) || 1;
        return;
      }
      if (card.type === 'status') return;
      if (excludeRetain && this.isRetainPredictionCard(card)) return;

      const face = this.choosePredictionFace(card);
      const keywords = face.keywords || [];
      const suppliesSelf = keywords.includes('supply');
      const fullPower = keywords.includes('fullPower');
      const nextSupply = supplyCharges + (suppliesSelf ? 1 : 0);
      if (fullPower && fullPowerUsed && nextSupply <= 0) return;

      supplyCharges = nextSupply;
      if (fullPower) {
        if (supplyCharges > 0) supplyCharges -= 1;
        else fullPowerUsed = true;
      }

      const gain = face.gain || {};
      block += Number(gain.block) || 0;
      mobility += Number(gain.mobility) || 0;
      counter += Number(gain.counter) || 0;
    });

    const cell = this.attackCellForResources(attack, mobility, counter);
    const attackValue = cell?.attack;
    const totalDefense = (Number(game.armor) || 0) + block;
    const excess = attackValue === null || attackValue === undefined ? 0 : Math.max(0, (Number(attackValue) || 0) - totalDefense);
    return {
      attack,
      attackValue,
      block,
      mobility,
      counter,
      totalDefense,
      excess,
      lifeLoss: Math.floor(excess / 3),
      stun: excess % 3,
    };
  }

  renderCombatPrediction() {
    const result = this.estimateCombatOutcome();
    if (!result.attack) return <div className="dbg-combat-preview">全手牌预估：本回合没有威胁。</div>;
    if (this.state.game.skipAttackThisTurn) return <div className="dbg-combat-preview safe">全手牌预估：不攻击，请做好预备！</div>;
    const resultText = result.attackValue === null || result.attackValue === undefined || result.excess <= 0
      ? '完全防御'
      : `还差 ${result.excess} 点防护`;
    const reserve = this.estimateCombatOutcome({ excludeRetain: true });
    const reserveText = reserve.attackValue === null || reserve.attackValue === undefined || reserve.excess <= 0
      ? '保存实力不需防护'
      : `保存实力需${reserve.excess}点`;
    if (result.attackValue === null || result.attackValue === undefined) {
      return <div className="dbg-combat-preview safe">全手牌预估：机动 {result.mobility}，反击 {result.counter}，{resultText}，{reserveText}</div>;
    }
    return (
      <div className={['dbg-combat-preview', result.excess > 0 ? 'danger' : 'safe'].filter(Boolean).join(' ')}>
        全手牌预估：机动 {result.mobility}，反击 {result.counter}，{resultText}，{reserveText}
      </div>
    );
  }

  renderSvgDefs() {
    return (
      <svg className="dbg-svg-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <symbol id="dbg-i-download" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M5 3h18l4 4v22H5zM9 6v8h13V8h-3v4h-7V6zm2 13v6h8v-6z" />
            <path className="dbg-px-white" d="M20 19h5v4h4l-7 7-7-7h4z" />
            <path className="dbg-px-fill" d="M21 20h3v4h3l-5 5-5-5h4z" />
          </symbol>
          <symbol id="dbg-i-upload" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M10 19H8c-4 0-6-2-6-5 0-3 2-5 5-5 1-4 4-6 8-6 5 0 8 3 9 8 4 0 6 2 6 5s-2 5-6 5h-3v-4h4c1 0 2-1 2-2s-1-2-3-2h-3l-1-3c-1-3-3-4-6-4s-5 2-5 5v2H8c-2 0-3 1-3 2s1 2 3 2h2zM14 30V17h-4l6-7 6 7h-4v13z" />
          </symbol>
          <symbol id="dbg-i-block" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M16 3l11 4v8c0 7-4 12-11 15C9 27 5 22 5 15V7zM9 10v5c0 5 2 8 7 11 5-3 7-6 7-11v-5l-7-3z" />
          </symbol>
          <symbol id="dbg-i-mobility" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M4 8h9v3H4zm4 5h9v3H8zm4 5h8v3h-8zm8-11h5v8l4 3v5h-7l-4-4v-7h2zm1 18h8v4H13c-4 0-6-2-6-5h10z" />
          </symbol>
          <symbol id="dbg-i-counter" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M16 2l7 7-5 13h-4L9 9zM8 21h16v4H8zM14 24h4v6h-4zM11 29h10v3H11z" />
          </symbol>
          <symbol id="dbg-i-draw" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M7 5h18v24H7zM10 9v16h12V9zM14 12h4v4h4v4h-4v4h-4v-4h-4v-4h4z" />
          </symbol>
          <symbol id="dbg-i-discard" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M7 5h18v24H7zM10 9v16h12V9zM14 11h4v8h4l-6 6-6-6h4z" />
          </symbol>
          <symbol id="dbg-i-trash" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M8 9h16v3H8zM12 4h8v4h-8zm-1 9h11l-2 15h-7zm3 3v9h2v-9zm4 0v9h2v-9z" />
          </symbol>
          <symbol id="dbg-i-trash-self" viewBox="0 0 32 32">
            <circle className="dbg-px-ring" cx="16" cy="16" r="14" />
            <path className="dbg-px-fill" d="M8 9h16v3H8zM12 4h8v4h-8zm-1 9h11l-2 15h-7zm3 3v9h2v-9zm4 0v9h2v-9z" />
          </symbol>
          <symbol id="dbg-i-upgrade" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M16 3l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zm-2 11v8h4v-8h4l-6-6-6 6z" />
          </symbol>
          <symbol id="dbg-i-upgrade-self" viewBox="0 0 32 32">
            <circle className="dbg-px-ring" cx="16" cy="16" r="14" />
            <path className="dbg-px-fill" d="M16 3l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zm-2 11v8h4v-8h4l-6-6-6 6z" />
          </symbol>
          <symbol id="dbg-i-downgrade-self" viewBox="0 0 32 32">
            <circle className="dbg-px-ring" cx="16" cy="16" r="14" />
            <path className="dbg-px-fill" d="M16 29l-4-8-9-1 7-6-2-9 8 5 8-5-2 9 7 6-9 1zm2-11v-8h-4v8h-4l6 6 6-6z" />
          </symbol>
          <symbol id="dbg-i-stun" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M4 4h24v4H4zM4 4h4v24H4zM24 4h4v24h-4zM4 24h24v4H4zM10 10h12v4H14v4h8v4H10v-4h4v-4h-4zM18 14h4v4h-4z" />
          </symbol>
          <symbol id="dbg-i-wound" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M16 28L6 18C1 13 4 5 10 5c3 0 5 2 6 4 1-2 3-4 6-4 6 0 9 8 4 13zM17 9l-5 7 6 3-4 7 7-8-6-3z" />
          </symbol>
          <symbol id="dbg-i-bleed" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M16 3c5 7 8 11 8 17 0 6-4 10-8 10S8 26 8 20c0-6 3-10 8-17zm-2 12c-2 3-3 5-3 7 0 3 2 5 5 5v-4c-1 0-2-1-2-2 0-2 1-4 2-6z" />
          </symbol>
          <symbol id="dbg-i-decay" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M16 4a12 12 0 1 0 11 7h-4a8 8 0 1 1-7-4zM22 2l8 8h-6v6h-4V6h2zM11 13l3 3-3 3-2-2 1-1-1-1zm10 0l2 2-1 1 1 1-2 2-3-3z" />
          </symbol>
          <symbol id="dbg-i-free" viewBox="0 0 32 32">
            <path className="dbg-px-fill" d="M8 10h16l3 18H5zM12 10c0-5 2-7 4-7s4 2 4 7h-3c0-2 0-4-1-4s-1 2-1 4zm2 5h4v4h4v4h-4v4h-4v-4h-4v-4h4z" />
          </symbol>
          <symbol id="dbg-i-convert" viewBox="0 0 32 20">
            <path className="dbg-px-fill" d="M7 4h5v2h4v2h4v2h4v2h-4v2h-4v2h-4v2H7z" />
          </symbol>
          <symbol id="dbg-i-convert-repeat" viewBox="0 0 40 20">
            <path className="dbg-px-fill" d="M4 4h4v2h3v2h3v2h3v2h-3v2h-3v2H8v2H4zM17 4h4v2h3v2h3v2h3v2h-3v2h-3v2h-3v2h-4z" />
          </symbol>
        </defs>
      </svg>
    );
  }

  renderIcon(icon, tone = 'gain', key = icon, count = 1) {
    const countLabel = Math.abs(Number(count) || 0);
    return (
      <span className={`dbg-effect-icon ${tone}`} key={key}>
        <svg aria-hidden="true" focusable="false"><use href={`#dbg-i-${icon}`} /></svg>
        {countLabel > 1 && <b>×{countLabel}</b>}
      </span>
    );
  }

  renderIconCopies(icon, amount = 1, tone = 'gain', key = icon) {
    const count = Math.abs(Number(amount) || 0);
    if (!icon || count <= 0) return [];
    if (count <= 3) return Array.from({ length: count }, (_, index) => this.renderIcon(icon, tone, `${key}-${index}`));
    return [this.renderIcon(icon, tone, key, count)];
  }

  renderConvertIcon(key, repeat = false) {
    return (
      <span className={`dbg-convert-icon ${repeat ? 'repeat' : ''}`} key={key}>
        <svg aria-hidden="true" focusable="false"><use href={`#dbg-i-${repeat ? 'convert-repeat' : 'convert'}`} /></svg>
      </span>
    );
  }

  renderResourceTokens(gain = {}, keyPrefix = 'gain') {
    return Object.keys(gain || {}).flatMap((resource) => {
      const amount = Number(gain[resource]) || 0;
      const icon = RESOURCE_ICON[resource];
      if (!icon || amount === 0) return [];
      return this.renderIconCopies(icon, amount, amount > 0 ? 'gain' : 'loss', `${keyPrefix}-${resource}`);
    });
  }

  renderEffectTokens(effects = [], keyPrefix = 'effect') {
    return (effects || []).flatMap((effect, index) => {
      const key = `${keyPrefix}-${index}`;
      switch (effect.type) {
        case 'payResource':
          return effect.required ? this.renderIconCopies(RESOURCE_ICON[effect.resource], effect.amount || 1, 'loss', `${key}-pay`) : [];
        case 'reduceArmor':
          return this.renderIconCopies('block', effect.amount || 1, 'loss', `${key}-armor`);
        case 'doubleCurrentBlock':
          return [this.renderIcon('block', 'gain', `${key}-block`), <span className="dbg-effect-count" key={`${key}-x2`}>×2</span>];
        case 'gainStatus':
          return this.renderIconCopies(STATUS_ICON[effect.cardId] || 'stun', effect.amount || 1, 'gain', `${key}-status`);
        case 'draw':
          return this.renderIconCopies('draw', effect.amount || 1, 'gain', `${key}-draw`);
        case 'addDecay':
          return this.renderIconCopies('decay', effect.amount || 1, 'gain', `${key}-decay`);
        case 'upgradeSelf':
          return this.renderIconCopies('upgrade-self', 1, 'gain', `${key}-upself`);
        case 'downgradeSelf':
          return this.renderIconCopies('downgrade-self', 1, 'loss', `${key}-downself`);
        case 'trashSelf':
          return this.renderIconCopies('trash-self', 1, 'loss', `${key}-trashself`);
        case 'lockUploadGain':
          return [<span className="dbg-effect-text loss" key={`${key}-lock`}>本回合不能上传</span>];
        case 'convertResource':
        case 'enableResourceConversion':
          return [
            ...this.renderIconCopies(RESOURCE_ICON[effect.from] || 'download', effect.rate || 1, 'loss', `${key}-from`),
            this.renderConvertIcon(`${key}-convert`, effect.maxTimes === 'any'),
            ...this.renderIconCopies(RESOURCE_ICON[effect.to] || 'upload', effect.amount || 1, 'gain', `${key}-to`),
          ];
        case 'reduceArmorForGain':
          return [
            ...this.renderIconCopies('block', effect.armor || 1, 'loss', `${key}-fromblock`),
            this.renderConvertIcon(`${key}-convert`, effect.maxTimes === 'any'),
            ...this.renderResourceTokens(effect.gain || {}, `${key}-gain`),
          ];
        case 'discardMarketCard':
          return [<span className="dbg-effect-text" key={`${key}-marketdiscard`}>{effect.amount === 'any' ? '刷新任意市场牌' : '刷新1张市场牌'}</span>];
        case 'firstBuyThisTurnUpgraded':
          return [<span className="dbg-effect-text" key={`${key}-firstup`}>首购升级</span>];
        case 'firstBuyThisTurnMayGoToDeckTop':
          return [<span className="dbg-effect-text" key={`${key}-firsttop`}>首购置顶</span>];
        case 'returnPlayedCardToDeckTopAtEndTurn':
          return [<span className="dbg-effect-text" key={`${key}-top`}>回合末回顶</span>];
        case 'discardAnyCardsThenDraw':
        case 'discardUpToThenDraw':
          return [this.renderIcon('discard', 'loss', `${key}-discard`), this.renderConvertIcon(`${key}-repeat`, true), ...this.renderIconCopies('draw', effect.drawPerDiscard || 1, 'gain', `${key}-draw`)];
        case 'discardCardsThenDraw':
          return [...this.renderIconCopies('discard', effect.discard || 1, 'loss', `${key}-discard`), this.renderConvertIcon(`${key}-convert`), ...this.renderIconCopies('draw', effect.draw || 1, 'gain', `${key}-draw`)];
        case 'discardCardsForGain':
          return [...this.renderIconCopies('discard', effect.amount === 'any' ? 1 : effect.amount || 1, 'loss', `${key}-discard`), this.renderConvertIcon(`${key}-convert`, effect.amount === 'any'), ...this.renderResourceTokens(effect.gainPerCard || effect.gain || {}, `${key}-gain`)];
        case 'freeBuy':
          return [this.renderIcon('free', 'gain', `${key}-free`, effect.maxCost || 1)];
        case 'trashHandToGainMarketCard':
          return [this.renderIcon('trash', 'loss', `${key}-trash`), this.renderConvertIcon(`${key}-convert`), this.renderIcon('free', 'gain', `${key}-free`, effect.costBonus || 1)];
        case 'payStatusForGain':
          return [this.renderIcon(STATUS_ICON[effect.cardId] || 'stun', 'gain', `${key}-paystatus`, effect.amount || 1), this.renderConvertIcon(`${key}-convert`), ...this.renderResourceTokens(effect.gain || {}, `${key}-gain`)];
        case 'searchDrawPileToHand':
          return this.renderIconCopies('draw', effect.amount || 1, 'gain', `${key}-search`);
        case 'nextTurnGain':
          return [...this.renderResourceTokens(effect.gain || {}, `${key}-nextgain`), <span className="dbg-effect-count" key={`${key}-next`}>次</span>];
        case 'nextTurnLose':
          return [...Object.keys(effect.loss || {}).flatMap((resource) => this.renderIconCopies(RESOURCE_ICON[resource], effect.loss[resource], 'loss', `${key}-nextloss-${resource}`)), <span className="dbg-effect-count" key={`${key}-next`}>次</span>];
        case 'nextTurnUploadMultiplier':
          return [this.renderIcon('upload', 'gain', `${key}-upload`), <span className="dbg-effect-count" key={`${key}-multi`}>×{effect.multiplier || 1}</span>];
        case 'improveFinalRating':
          return [this.renderIcon('upload', 'gain', `${key}-rate`, effect.amount || 1)];
        case 'retainHandCard':
          return [<span className="dbg-effect-text" key={`${key}-retain`}>保留手牌</span>];
        case 'skipThreatAttackThisTurn':
        case 'skipAttackOnRevealTurn':
          return [<span className="dbg-effect-text" key={`${key}-skip`}>跳过攻击</span>];
        case 'discardAllRetainedCards':
          return [<span className="dbg-effect-text loss" key={`${key}-dropretain`}>弃保留</span>];
        case 'spendResourceToPutSelfOnDeckTop':
          return [...this.renderIconCopies(RESOURCE_ICON[effect.resource] || 'download', effect.amount || 1, 'loss', `${key}-spend`), this.renderConvertIcon(`${key}-convert`), this.renderIcon('draw', 'gain', `${key}-top`)];
        case 'triggerFullPower':
          return [<span className="dbg-effect-text" key={`${key}-fullpower`}>触发全力</span>];
        case 'modifySelfEffect':
          return [<span className="dbg-effect-text" key={`${key}-modify`}>强化自身效果</span>];
        case 'requireLifeLossAtMost':
          return [<span className="dbg-effect-text" key={`${key}-lifelimit`}>生命受损≤{effect.amount}</span>];
        case 'increaseChosenModeGain':
          return [<span className="dbg-effect-text" key={`${key}-modegain`}>所选项+{effect.amount || 1}</span>];
        case 'reduceSelfArmorLoss':
          return [<span className="dbg-effect-text" key={`${key}-reducearmor`}>少降{effect.amount || 1}防护</span>];
        case 'preventRatingPenaltyAtLifeLoss':
          return [<span className="dbg-effect-text" key={`${key}-ratingprotect`}>免评分惩罚</span>];
        default:
          return [<span className="dbg-effect-text" key={`${key}-unknown`}>{effect.label || effect.type}</span>];
      }
    });
  }

  renderEffectLine(tokens, key = 'line') {
    if (!tokens || tokens.length === 0) return <div className="dbg-effect-line muted" key={key}>无效果</div>;
    return <div className="dbg-effect-line" key={key}>{tokens}</div>;
  }

  renderCardEffects(card = {}) {
    const display = this.displayCard(card);
    if (display.type === 'status') {
      const statusText = {
        status_stun: display.upgraded ? '回合结束移除，移除后上传+1' : '回合结束移除',
        status_wound: '不能删除',
        status_bleed: '不能删除，不能弃作防护',
      }[display.id] || '状态';
      return (
        <div className="dbg-card-effects status-effects">
          <div className="dbg-effect-line status-text">{statusText}</div>
        </div>
      );
    }
    const face = this.engine.getCardFace(display);
    const modes = this.engine.getPlayableModes(display);
    const features = this.getFeatureKeys(display, face);
    return (
      <div className="dbg-card-effects">
        {modes.length > 0 ? (
          <div className="dbg-mode-lines">
            {modes.map((mode, index) => {
              const modeFace = this.engine.getCardFace(display, mode.id);
              const tokens = [...this.renderResourceTokens(modeFace.gain || {}, `mode-${mode.id}-gain`), ...this.renderEffectTokens(modeFace.effects || [], `mode-${mode.id}-effect`)];
              return (
                <React.Fragment key={mode.id}>
                  {index > 0 && <div className="dbg-effect-or">OR</div>}
                  {this.renderEffectLine(tokens, `mode-${mode.id}`)}
                </React.Fragment>
              );
            })}
          </div>
        ) : this.renderEffectLine([...this.renderResourceTokens(face.gain || {}, `${display._instanceId}-gain`), ...this.renderEffectTokens(face.effects || [], `${display._instanceId}-effect`)], 'main')}
        {features.length > 0 && (
          <div className="dbg-feature-row">
            {features.map((feature) => <span className={`dbg-feature ${FEATURE_META[feature].className}`} key={feature}>{FEATURE_META[feature].label}</span>)}
          </div>
        )}
      </div>
    );
  }

  renderCard(card = {}, options = {}) {
    const { index = 0, zone = 'hand', marketType = null, compact = false, choiceCandidate = null } = options;
    if (!card) {
      return (
        <div className={['dbg-market-slot-empty', compact ? 'compact' : ''].filter(Boolean).join(' ')} key={`empty-${zone}-${index}`}>
          <span>空位</span>
        </div>
      );
    }
    const display = this.displayCard(card);
    const face = this.engine.getCardFace(display);
    const features = this.getFeatureKeys(display, face);
    const titleClass = display.type === 'status' ? 'status' : this.titleClassFor(features);
    const titleStyle = display.type === 'status' ? undefined : this.titleStyleFor(features);
    const titleSuffix = display.upgraded || (this.state.upgradePreview && card.upgrade && !card.upgraded) ? '+' : '';
    const selected = choiceCandidate && this.state.choiceSelection[this.choiceKey(choiceCandidate)];
    const dragging = zone === 'hand' && this.state.dragCard?.index === index;
    const canBuy = (zone === 'upMarket' || zone === 'basicMarket') && this.engine.canBuy(marketType, index);
    const canPlay = zone === 'hand' && this.engine.getPlayableModes(card).length === 0 && this.engine.canPlayCard(index);
    const canDiscard = zone === 'hand' && this.engine.canDiscardForBlock(index);
    const fullPowerBlocked = zone === 'hand' && this.isFullPowerBlocked(card);
    return (
      <button
        type="button"
        key={card._instanceId || `${card.id}-${zone}-${index}`}
        className={['dbg-card', compact ? 'compact' : '', display.type === 'status' ? display.id : '', display.upgraded ? 'upgraded' : '', choiceCandidate ? 'choice-candidate' : '', selected ? 'selected' : '', canBuy ? 'buyable' : '', canPlay ? 'playable' : '', fullPowerBlocked ? 'full-power-blocked' : '', dragging ? 'dragging-source' : ''].filter(Boolean).join(' ')}
        title={fullPowerBlocked ? `${card.text || card.name}\n本回合已使用全力。` : (card.text || card.name)}
        onClick={() => this.handleCardClick({ index, zone, marketType, choiceCandidate })}
        onPointerDown={(event) => this.handleHandPointerDown(event, index, zone)}
        onContextMenu={(event) => this.handleCardContextMenu(event, index, zone, canDiscard)}
      >
        <div className={`dbg-card-title ${titleClass}`} style={titleStyle}>
          <strong>{display.name}{titleSuffix}</strong>
          {(zone === 'upMarket' || zone === 'basicMarket') && <span className="dbg-card-cost">{Number(card.cost) || 0}</span>}
        </div>
        <div className="dbg-card-art" />
        {this.renderCardEffects(display)}
      </button>
    );
  }

  handleCardClick({ index, zone, marketType, choiceCandidate }) {
    const choice = this.state.game.pendingChoice;
    if (choice && choiceCandidate && !this.requiresChoiceModal(choice)) {
      this.toggleChoiceCandidate(choiceCandidate);
      return;
    }
    if ((zone === 'upMarket' || zone === 'basicMarket') && !choice && this.engine.canBuy(marketType, index)) {
      this.run({ type: 'BUY_CARD', marketType, index });
    }
  }

  handleHandPointerDown(event, index, zone) {
    if (zone !== 'hand' || event.button !== 0 || this.state.game.pendingChoice) return;
    const card = this.state.game.hand[index];
    if (!card || this.state.game.gameOver) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.preventDefault();
    this.handPointer = { index, pointerId: event.pointerId };
    this.removeDragListeners();
    this.addDragListeners();
    this.setState({
      dragCard: {
        index,
        card,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        grabOffsetX: event.clientX - rect.left,
        grabOffsetY: event.clientY - rect.top,
        overPlayArea: this.isPointOverPlayArea(event.clientX, event.clientY),
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      },
    });
  }

  handleGlobalPointerMove = (event) => {
    const active = this.handPointer;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.setState((prev) => {
      const drag = prev.dragCard;
      if (!drag || drag.pointerId !== event.pointerId) return null;
      return {
        dragCard: {
          ...drag,
          currentX: event.clientX,
          currentY: event.clientY,
          overPlayArea: this.isPointOverPlayArea(event.clientX, event.clientY),
        },
      };
    });
  };

  handleGlobalPointerUp = (event) => {
    const start = this.handPointer;
    const drag = this.state.dragCard;
    if (!start || !drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const shouldPlay = Boolean(start.index === drag.index && this.isPointOverPlayArea(event.clientX, event.clientY));
    const handIndex = drag.index;
    this.handPointer = null;
    this.removeDragListeners();
    this.setState({ dragCard: null }, () => {
      if (shouldPlay) this.playHandCard(handIndex);
    });
  };

  handleGlobalPointerCancel = (event) => {
    const drag = this.state.dragCard;
    if (!drag || drag.pointerId !== event.pointerId) return;
    this.handPointer = null;
    this.removeDragListeners();
    this.setState({ dragCard: null });
  };

  handleCardContextMenu(event, index, zone, canDiscard) {
    if (zone !== 'hand') return;
    event.preventDefault();
    if (this.state.game.pendingChoice || !canDiscard || this.state.game.gameOver) return;
    this.run({ type: 'DISCARD_FOR_BLOCK', handIndex: index });
  }

  playHandCard(index) {
    const card = this.state.game.hand[index];
    if (!card || this.state.game.pendingChoice || this.state.game.gameOver) return;
    const modes = this.engine.getPlayableModes(card);
    if (modes.length > 1) {
      this.setState({ modePicker: { handIndex: index, card, modes } });
    } else if (modes.length === 1) {
      this.run({ type: 'PLAY_CARD', handIndex: index, modeId: modes[0].id });
    } else {
      this.run({ type: 'PLAY_CARD', handIndex: index });
    }
  }

  renderDragPreview() {
    const drag = this.state.dragCard;
    if (!drag) return null;
    const dx = drag.currentX - drag.startX;
    const armed = drag.overPlayArea;
    return (
      <div
        className={`dbg-drag-layer ${armed ? 'armed' : ''}`}
        style={{
          left: drag.currentX - drag.grabOffsetX,
          top: drag.currentY - drag.grabOffsetY,
          width: drag.rect.width,
          height: drag.rect.height,
          transform: `rotate(${Math.max(-7, Math.min(7, dx / 18))}deg)`,
        }}
      >
        {this.renderCard(drag.card, { zone: 'dragPreview' })}
      </div>
    );
  }

  renderUploadBar() {
    const game = this.state.game;
    const progress = Math.max(0, Math.min(100, ((Number(game.upload) || 0) / (Number(game.uploadTarget) || 1)) * 100));
    return (
      <header className={`dbg-upload-strip${this.tutorialFocusClass('status')}`} data-tutorial-target="status">
        <div className="dbg-upload-label">
          <strong>{game.selectedCharacter?.name || 'USTC DBG'}</strong>
          <span>{game.gameOver ? game.message : game.pendingChoice ? '等待选择' : game.fullPowerUsedThisTurn ? `第 ${game.turn} 回合，全力已用 · ${game.difficulty?.name || ''}` : `第 ${game.turn} 回合 · ${game.difficulty?.name || ''}`}</span>
        </div>
        <div className="dbg-upload-track" aria-label="上传进度">
          <div className="dbg-upload-fill" style={{ width: `${progress}%` }} />
          <span>{game.upload}/{game.uploadTarget}</span>
        </div>
        <div className={`dbg-state-badge ${game.result || ''}`}>{game.gameOver ? (game.result === 'win' ? '胜利' : '失败') : game.pendingChoice ? '选择中' : '行动中'}</div>
      </header>
    );
  }

  renderDecayDial() {
    const game = this.state.game;
    const max = Math.max(1, Number(game.decayPerArmorLoss) || 4);
    const filled = Math.max(0, Math.min(4, Math.ceil(((Number(game.decay) || 0) / max) * 4)));
    return (
      <div className="dbg-decay-dial" style={{ '--decay-angle': `${filled * 90}deg` }}>
        <span>{game.decay}/{game.decayPerArmorLoss}</span>
      </div>
    );
  }

  renderResourceTiles() {
    const game = this.state.game;
    return (
      <div className="dbg-threat-stats">
        <div className="dbg-threat-stat wide">
          {this.renderIcon('mobility', 'gain', 'mobility-icon')}
          <span>机动</span>
          <strong>{game.mobility}</strong>
        </div>
        <div className="dbg-threat-stat wide">
          {this.renderIcon('counter', 'gain', 'counter-icon')}
          <span>反击</span>
          <strong>{game.counter}</strong>
        </div>
        <div className="dbg-threat-stat">
          {this.renderIcon('block', 'gain', 'block-icon')}
          <span>防护</span>
          <strong>{Number(game.armor) || 0}+{Number(game.block) || 0}</strong>
        </div>
        <div className="dbg-threat-stat decay">
          {this.renderDecayDial()}
          <span>衰减</span>
        </div>
        <div className="dbg-threat-stat">
          {this.renderIcon('wound', 'loss', 'life-icon')}
          <span>生命</span>
          <strong>{game.lifeLoss}/{game.lifeLimit}</strong>
        </div>
      </div>
    );
  }

  renderThreatTable(attack) {
    if (!attack) return <div className="dbg-empty">本回合没有威胁。</div>;
    if (Object.prototype.hasOwnProperty.call(attack, 'fixedAttack')) return <div className="dbg-fixed-attack">固定攻击 {attack.fixedAttack}</div>;
    const rowTier = this.tierFor(this.state.game.mobility, attack.mobilityBreakpoints || []);
    const colTier = this.tierFor(this.state.game.counter, attack.counterBreakpoints || []);
    return (
      <div className="dbg-threat-table">
        <div className="dbg-threat-cell corner">机/反</div>
        {[0, 1, 2].map((col) => <div className="dbg-threat-cell header" key={`c-${col}`}>{this.tierLabel(col, attack.counterBreakpoints || [])}</div>)}
        {[0, 1, 2].map((row) => (
          <React.Fragment key={`r-${row}`}>
            <div className="dbg-threat-cell header">{this.tierLabel(row, attack.mobilityBreakpoints || [])}</div>
            {[0, 1, 2].map((col) => {
              const cell = attack.attackTable?.[row]?.[col] || {};
              return <div className={`dbg-threat-cell ${row === rowTier && col === colTier ? 'active' : ''}`} key={`${row}-${col}`}>{cell.attack === null || cell.attack === undefined ? 'X' : cell.attack}</div>;
            })}
          </React.Fragment>
        ))}
      </div>
    );
  }

  renderThreatPanel() {
    const game = this.state.game;
    const attack = game.currentAttack;
    const afterText = this.describeAfterAttack(attack, game.attackCell);
    const feedback = game.lastAttackFeedback || {};
    const tookLifeDamage = Number(feedback.lifeLoss) > 0;
    const tookOnlyStun = !tookLifeDamage && Number(feedback.stun) > 0 && Number(feedback.excess) > 0;
    const attackText = game.skipAttackThisTurn
      ? '本回合不攻击'
      : game.attackValue === null || game.attackValue === undefined
        ? '无效'
        : `攻击 ${game.attackValue}`;
    return (
      <section
        className={['dbg-panel', 'dbg-threat-panel', tookLifeDamage ? 'damage-shake' : '', tookOnlyStun ? 'stun-flash' : '', this.tutorialFocusClass('threat').trim()].filter(Boolean).join(' ')}
        data-tutorial-target="threat"
      >
        <div className="dbg-panel-title dbg-threat-title">
          <strong>{attack ? attack.name : '当前威胁'}</strong>
          <span className="dbg-threat-meta"><b>{attackText}</b>{afterText && <em>{afterText}</em>}</span>
        </div>
        {this.renderThreatTable(attack)}
        {this.renderResourceTiles()}
        {this.renderCombatPrediction()}
        {game.nextAttackPreview && <div className="dbg-next-threat">预判：{game.nextAttackPreview.name}</div>}
      </section>
    );
  }

  renderLog() {
    const game = this.state.game;
    return (
      <section className={`dbg-panel dbg-log-panel${this.tutorialFocusClass('log')}`} data-tutorial-target="log">
        <div className="dbg-panel-title"><strong>日志</strong><span>{game.log.length}</span></div>
        <div className="dbg-log-list">
          {game.log.map((item, index) => (
            <div className="dbg-log-row" key={`${item.turn}-${index}`}><span>#{item.turn}</span><p>{item.text}</p></div>
          ))}
        </div>
      </section>
    );
  }

  renderMarketPanel() {
    const game = this.state.game;
    const recommendations = this.getBasicRecommendations(game);
    return (
      <section className={`dbg-panel dbg-market-panel${this.tutorialFocusClass('market')}`} data-tutorial-target="market">
        <div className="dbg-panel-title">
          <div className="dbg-market-heading"><strong>进阶装备</strong><span>下载 {game.download}</span></div>
          <div className="dbg-title-actions">
            <button type="button" onClick={this.toggleUpgradePreview} className={this.state.upgradePreview ? 'active' : ''}>升级预览</button>
            <button type="button" onClick={this.toggleBasicShop}>基础商店</button>
          </div>
        </div>
        <div className="dbg-market-layout">
          <div className="dbg-market-row">
            {game.upMarket.length === 0 ? <div className="dbg-empty">暂无可购买装备。</div> : game.upMarket.map((card, index) => this.renderCard(card, { index, zone: 'upMarket', marketType: 'up', choiceCandidate: this.choiceCandidateFor('upMarket', card) }))}
          </div>
          <div className="dbg-basic-suggestions">
            <div className="dbg-suggestion-title">基础</div>
            {recommendations.length === 0 ? <div className="dbg-empty compact">暂无可买。</div> : recommendations.map(({ card, index }) => this.renderCard(card, { index, zone: 'basicMarket', marketType: 'basic', choiceCandidate: this.choiceCandidateFor('basicMarket', card) }))}
          </div>
        </div>
      </section>
    );
  }

  renderPlayedPanel() {
    const game = this.state.game;
    return (
      <section
        className={`dbg-play-drop-zone ${this.state.dragCard?.overPlayArea ? 'armed' : ''}${this.tutorialFocusClass('playArea')}`}
        data-dbg-drop-zone="play-area"
        data-tutorial-target="playArea"
        aria-label="本回合结算"
      >
        {game.playArea.length > 0 && (
          <div className="dbg-played-row">
            {game.playArea.map((card, index) => this.renderCard(card, { index, zone: 'playArea' }))}
          </div>
        )}
      </section>
    );
  }

  renderInlineChoiceControls() {
    const choice = this.state.game.pendingChoice;
    if (!choice || this.requiresChoiceModal(choice)) return null;
    const selectedCount = this.selectedChoiceCandidates(choice).length;
    const canConfirm = selectedCount >= choice.min && selectedCount <= choice.max;
    return (
      <div className={`dbg-inline-choice${this.tutorialFocusClass('choice')}`} data-tutorial-target="choice">
        <strong>{choice.title || '选择牌'}</strong>
        <span>{selectedCount}/{choice.max}</span>
        <p>{choice.prompt || '请选择要结算的牌。'}</p>
        <div className="dbg-rail-buttons horizontal">
          {choice.optional && <button type="button" onClick={this.skipChoice}>跳过</button>}
          <button type="button" onClick={this.confirmChoice} disabled={!canConfirm}>确认</button>
        </div>
      </div>
    );
  }

  renderCharacterActions() {
    const game = this.state.game;
    const character = game.selectedCharacter;
    if (!character?.abilities?.length) return null;
    return (
      <div className="dbg-rail-group">
        <strong>{character.name}</strong>
        {(character.abilities || []).map((ability, abilityIndex) => (
          <div className="dbg-rail-buttons" key={ability.id}>
            {(ability.options && ability.options.length > 0 ? ability.options : [ability]).map((option) => (
              <button type="button" key={option.id || ability.id} onClick={() => this.run({ type: 'USE_CHARACTER_ABILITY', abilityIndex, optionId: option.id })} disabled={Boolean(game.pendingChoice) || game.gameOver || game.characterAbilityUsed[ability.id] || (ability.blockedByFullPower && game.fullPowerLocked)}>
                {option.name || ability.name}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  }

  describeConversion(conversion) {
    const limitText = conversion.remaining === 'any'
      ? '（不限次）'
      : `（${Number(conversion.remaining) > 1 ? `剩余${conversion.remaining}次` : '限1次'}）`;
    if (conversion.type === 'reduceArmorForGain') {
      const gainText = Object.keys(conversion.gain || {}).map((key) => `${RESOURCE_LABELS[key] || key}+${conversion.gain[key]}`).join(' ');
      return `防护-${conversion.armor} ${gainText}${limitText}`;
    }
    return `${RESOURCE_LABELS[conversion.from] || conversion.from}-${conversion.rate} ${RESOURCE_LABELS[conversion.to] || conversion.to}+1${limitText}`;
  }

  renderConversions() {
    const game = this.state.game;
    if (!game.availableConversions.length) return null;
    return (
      <div className="dbg-rail-group">
        <strong>可用转换</strong>
        <div className="dbg-rail-buttons">
          {game.availableConversions.map((conversion, index) => (
            <button type="button" key={`${conversion.label}-${index}`} onClick={() => this.run({ type: 'CONVERT_RESOURCE', index })} disabled={Boolean(game.pendingChoice)}>{this.describeConversion(conversion)}</button>
          ))}
        </div>
      </div>
    );
  }

  renderSaveSlot(slot, label) {
    const save = this.state.saveSlots && this.state.saveSlots[slot];
    const meta = save?.meta || null;
    const localSave = this.readSaveSlot(slot);
    return (
      <div className="dbg-save-slot" key={slot}>
        <div className="dbg-save-slot-head">
          <strong>{label}</strong>
          <span>{save ? formatSaveTime(save.savedAt) : '空'}</span>
        </div>
        {meta && <p>第 {meta.turn} 回合 · 上传 {meta.upload}/{meta.uploadTarget}</p>}
        <div className="dbg-save-buttons">
          <button type="button" onClick={() => this.writeSave(slot)}>保存</button>
          <button type="button" onClick={() => this.loadSave(slot)} disabled={!save}>读取</button>
          <button type="button" onClick={() => this.deleteSave(slot)} disabled={!localSave}>删本地</button>
        </div>
      </div>
    );
  }

  renderLatestCloudSaveSlot() {
    const save = this.state.cloudLatestSave;
    const meta = save?.meta || null;
    return (
      <div className="dbg-save-slot cloud">
        <div className="dbg-save-slot-head">
          <strong>最新云端</strong>
          <span>{save ? formatSaveTime(save.savedAt) : '空'}</span>
        </div>
        {meta && <p>第 {meta.turn} 回合 · 上传 {meta.upload}/{meta.uploadTarget}</p>}
        <div className="dbg-save-buttons">
          <button type="button" onClick={this.loadLatestCloudSave} disabled={!save}>读取</button>
          <button type="button" onClick={() => this.refreshCloudSaves()}>刷新</button>
        </div>
      </div>
    );
  }

  renderSavePanel() {
    if (this.isTutorialSession()) {
      return (
        <div className="dbg-rail-group dbg-save-panel">
          <strong>教程</strong>
          <span className="dbg-save-message">教程局面不会保存，也不会写入解锁进度。</span>
        </div>
      );
    }
    return (
      <div className="dbg-rail-group dbg-save-panel">
        <strong>存档</strong>
        <span className="dbg-save-message">{this.state.saveMessage || '自动存档'} · {this.state.cloudSaveMessage}</span>
        {LOCAL_SAVE_SLOTS.map((slot) => this.renderSaveSlot(slot, `槽位 ${slot}`))}
        <div className="dbg-save-slot autosave">
          <div className="dbg-save-slot-head">
            <strong>自动</strong>
            <span>{this.state.saveSlots?.[AUTOSAVE_SLOT] ? formatSaveTime(this.state.saveSlots[AUTOSAVE_SLOT].savedAt) : '空'}</span>
          </div>
        </div>
        {this.renderLatestCloudSaveSlot()}
      </div>
    );
  }

  renderActionRail() {
    const game = this.state.game;
    const hasChoice = Boolean(game.pendingChoice);
    return (
      <aside className={`dbg-action-rail${this.tutorialFocusClass('actions')}`} data-tutorial-target="actions">
        <div className="dbg-rail-buttons">
          <button type="button" onClick={() => this.run({ type: 'PLAY_ALL' })} disabled={hasChoice || game.gameOver || game.hand.length === 0}>一键打出</button>
          <button type="button" onClick={() => this.run({ type: 'END_TURN' })} disabled={hasChoice || game.gameOver}>结束回合</button>
          <button type="button" onClick={this.isTutorialSession() ? this.restartTutorial : () => this.run({ type: 'RESET_GAME' })}>{this.isTutorialSession() ? '重置教程' : '新开一局'}</button>
          {this.props.onBackToMenu && <button type="button" onClick={this.props.onBackToMenu}>主菜单</button>}
        </div>
        {this.renderCharacterActions()}
        {this.renderConversions()}
        <div className="dbg-pile-counters">
          <button type="button" onClick={() => this.openPileViewer('drawPile')}>抽 {game.drawPile.length}</button>
          <button type="button" onClick={() => this.openPileViewer('discardPile')}>弃 {game.discardPile.length}</button>
          <span>进 {game.upDeck.length}</span><span>移 {game.exilePile.length}</span>
        </div>
        {this.renderSavePanel()}
      </aside>
    );
  }

  renderHandPanel() {
    const game = this.state.game;
    return (
      <section className={`dbg-panel dbg-hand-panel${this.tutorialFocusClass('hand')}`} data-tutorial-target="hand">
        <div className="dbg-panel-title"><strong>手牌</strong><span>向上拖出打出，右键用作防护</span></div>
        <div className="dbg-hand-layout">
          <div className="dbg-hand-row">
            {game.hand.length === 0 ? <div className="dbg-empty">手牌为空。</div> : game.hand.map((card, index) => this.renderCard(card, { index, zone: 'hand', choiceCandidate: this.choiceCandidateFor('hand', card) }))}
          </div>
          {this.renderActionRail()}
        </div>
      </section>
    );
  }

  renderChoiceCard(candidate) {
    const card = this.fullCardFromSummary(candidate.card || {});
    const selected = Boolean(this.state.choiceSelection[this.choiceKey(candidate)]);
    return (
      <div className="dbg-modal-card-wrap" key={this.choiceKey(candidate)}>
        {this.renderCard(card, { zone: candidate.zone, compact: true, choiceCandidate: candidate })}
        <button type="button" className={selected ? 'selected' : ''} onClick={() => this.toggleChoiceCandidate(candidate)}>{selected ? '已选择' : '选择'}</button>
      </div>
    );
  }

  renderChoiceModal() {
    const choice = this.state.game.pendingChoice;
    if (!choice || !this.requiresChoiceModal(choice)) return null;
    const selectedCount = this.selectedChoiceCandidates(choice).length;
    const canConfirm = selectedCount >= choice.min && selectedCount <= choice.max;
    const grouped = (choice.candidates || []).reduce((result, candidate) => {
      if (!result[candidate.zone]) result[candidate.zone] = [];
      result[candidate.zone].push(candidate);
      return result;
    }, {});
    return (
      <div className="dbg-modal-backdrop">
        <section className={`dbg-modal${this.tutorialFocusClass('choice')}`} data-tutorial-target="choice">
          <div className="dbg-panel-title"><strong>{choice.title || '选择牌'}</strong><span>{selectedCount}/{choice.max}</span></div>
          <p className="dbg-modal-prompt">{choice.prompt || '请选择要结算的牌。'}</p>
          <div className="dbg-choice-groups">
            {Object.keys(grouped).map((zone) => (
              <div className="dbg-choice-group" key={zone}>
                <div className="dbg-choice-zone">{ZONE_LABELS[zone] || zone}</div>
                <div className="dbg-modal-card-grid">{grouped[zone].map((candidate) => this.renderChoiceCard(candidate))}</div>
              </div>
            ))}
          </div>
          <div className="dbg-modal-actions">
            {choice.optional && <button type="button" onClick={this.skipChoice}>跳过</button>}
            <button type="button" onClick={this.confirmChoice} disabled={!canConfirm}>确认选择</button>
          </div>
        </section>
      </div>
    );
  }

  renderBasicShopModal() {
    if (!this.state.basicShopOpen) return null;
    const game = this.state.game;
    return (
      <div className="dbg-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) this.setState({ basicShopOpen: false }); }}>
        <section className={`dbg-modal wide${this.tutorialFocusClass('basicShop')}`} data-tutorial-target="basicShop">
          <div className="dbg-panel-title"><strong>基础装备商店</strong><button type="button" onClick={() => this.setState({ basicShopOpen: false })}>关闭</button></div>
          <div className="dbg-basic-grid">
            {game.basicMarket.map((card, index) => this.renderCard(card, { index, zone: 'basicMarket', marketType: 'basic', choiceCandidate: this.choiceCandidateFor('basicMarket', card) }))}
          </div>
        </section>
      </div>
    );
  }

  renderPileModal() {
    const zone = this.state.pileViewer;
    if (!zone) return null;
    const game = this.state.game;
    const cards = game[zone] || [];
    const title = zone === 'drawPile' ? '抽牌堆' : '弃牌堆';
    const note = zone === 'drawPile' ? '抽牌堆顺序仅供查看。' : '弃牌堆当前内容。';
    return (
      <div className="dbg-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) this.setState({ pileViewer: null }); }}>
        <section className={`dbg-modal wide${this.tutorialFocusClass('pileViewer')}`} data-tutorial-target="pileViewer">
          <div className="dbg-panel-title"><strong>{title}</strong><button type="button" onClick={() => this.setState({ pileViewer: null })}>关闭</button></div>
          <p className="dbg-modal-prompt">{note}</p>
          {cards.length === 0 ? (
            <div className="dbg-empty">没有牌。</div>
          ) : (
            <div className="dbg-basic-grid">
              {cards.map((card, index) => this.renderCard(card, { index, zone, compact: true }))}
            </div>
          )}
        </section>
      </div>
    );
  }

  renderModePicker() {
    const picker = this.state.modePicker;
    if (!picker) return null;
    const card = this.displayCard(picker.card);
    return (
      <div className="dbg-modal-backdrop">
        <section className="dbg-modal narrow">
          <div className="dbg-panel-title"><strong>{card.name}</strong><button type="button" onClick={() => this.setState({ modePicker: null })}>关闭</button></div>
          <p className="dbg-modal-prompt">选择一种打出方式。</p>
          <div className="dbg-mode-pick-list">
            {picker.modes.map((mode) => {
              const face = this.engine.getCardFace(card, mode.id);
              const tokens = [...this.renderResourceTokens(face.gain || {}, `pick-${mode.id}-gain`), ...this.renderEffectTokens(face.effects || [], `pick-${mode.id}-effect`)];
              return <button type="button" key={mode.id} onClick={() => this.run({ type: 'PLAY_CARD', handIndex: picker.handIndex, modeId: mode.id })}><strong>{mode.name}</strong><span>{tokens}</span></button>;
            })}
          </div>
        </section>
      </div>
    );
  }

  renderDamageAlert() {
    const feedback = this.state.game.lastAttackFeedback;
    if (!feedback || Number(feedback.lifeLoss) <= 0) return null;
    return (
      <div className="dbg-damage-alert" key={feedback.id}>
        <strong>生命损失 +{feedback.lifeLoss}</strong>
        <span>{feedback.attackName}：攻击 {feedback.attackValue} / 防护 {feedback.defense}</span>
      </div>
    );
  }

  renderTutorialOverlay() {
    const tutorial = this.getCurrentTutorial();
    const step = this.getCurrentTutorialStep();
    if (!tutorial || !step) return null;
    const actions = step.actions || [];
    const placement = step.placement || 'right';
    const stepNumber = (this.state.tutorial?.stepIndex || 0) + 1;
    const stepTotal = tutorial.steps?.length || stepNumber;
    return (
      <section className={`dbg-tutorial-panel ${placement}`}>
        <div className="dbg-tutorial-kicker"><span>{tutorial.name}</span><span>{stepNumber}/{stepTotal}</span></div>
        <h2>{step.title || '教程'}</h2>
        <p>{step.text || ''}</p>
        {step.waitFor && <div className="dbg-tutorial-wait">{step.waitText || '完成高亮区域的操作继续。'}</div>}
        <div className="dbg-tutorial-actions">
          {actions.map((action, index) => (
            <button type="button" key={`${action.label || 'action'}-${index}`} onClick={() => this.runTutorialAction(action)}>
              {action.label || '继续'}
            </button>
          ))}
          {!step.waitFor && actions.length === 0 && !step.complete && (
            <button type="button" onClick={this.advanceTutorial}>继续</button>
          )}
          <button type="button" className="secondary" onClick={this.exitTutorial}>退出教程</button>
        </div>
      </section>
    );
  }

  renderCharacterCard(character) {
    const unlocked = this.isCharacterUnlocked(character);
    if (!unlocked && character.unlock?.hidden) {
      return (
        <button type="button" className="dbg-character-card locked" key={character.id} disabled>
          <strong>？？？</strong>
          <span>{this.unlockHint(character)}</span>
        </button>
      );
    }
    return (
      <button type="button" className="dbg-character-card" key={character.id} onClick={() => this.run({ type: 'SELECT_CHARACTER', characterId: character.id })}>
        <strong>{character.name}</strong>
        <span>{character.text}</span>
      </button>
    );
  }

  renderDevUnlockModal() {
    if (!this.state.devUnlockOpen) return null;
    return (
      <div className="dbg-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) this.setState({ devUnlockOpen: false }); }}>
        <section className="dbg-modal narrow">
          <div className="dbg-panel-title"><strong>开发解锁</strong><button type="button" onClick={() => this.setState({ devUnlockOpen: false })}>关闭</button></div>
          <p className="dbg-modal-prompt">启用本地开发解锁后，所有角色都会在本浏览器中可选；这不会写入通关记录。</p>
          <div className="dbg-modal-actions">
            <button type="button" onClick={() => this.setState({ devUnlockOpen: false })}>取消</button>
            <button type="button" onClick={this.unlockAllForDev}>全解锁</button>
          </div>
        </section>
      </div>
    );
  }

  renderSetup() {
    const game = this.state.game;
    return (
      <main className="dbg-page setup">
        {this.renderSvgDefs()}
        <section className={`dbg-setup-panel${this.tutorialFocusClass('setup')}`} data-tutorial-target="setup">
          <div className="dbg-setup-title">
            <div>
              <h1
                onPointerDown={this.startDevUnlockHold}
                onPointerUp={this.cancelDevUnlockHold}
                onPointerLeave={this.cancelDevUnlockHold}
                onPointerCancel={this.cancelDevUnlockHold}
              >
                USTC DBG
              </h1>
              <p>选择角色，抽 5 张牌，在威胁压垮机体前完成上传。当前难度：{game.difficulty?.name || '未指定'}。</p>
            </div>
            {this.props.onBackToMenu && <button type="button" onClick={this.props.onBackToMenu}>主菜单</button>}
          </div>
          <div className={`dbg-character-grid${this.tutorialFocusClass('characters')}`} data-tutorial-target="characters">
            {game.characters.map((character) => this.renderCharacterCard(character))}
          </div>
        </section>
        {this.renderTutorialOverlay()}
        {this.renderDevUnlockModal()}
      </main>
    );
  }

  render() {
    const game = this.state.game;
    if (game.phase === 'setup') return this.renderSetup();
    return (
      <main className="dbg-page">
        {this.renderSvgDefs()}
        {this.renderUploadBar()}
        <div className="dbg-board">
          <aside className="dbg-left-column">{this.renderThreatPanel()}{this.renderLog()}</aside>
          <section className="dbg-right-column">{this.renderMarketPanel()}{this.renderPlayedPanel()}{this.renderHandPanel()}</section>
        </div>
        {this.renderInlineChoiceControls()}
        {this.renderChoiceModal()}
        {this.renderBasicShopModal()}
        {this.renderPileModal()}
        {this.renderModePicker()}
        {this.renderDamageAlert()}
        {this.renderDevUnlockModal()}
        {this.renderTutorialOverlay()}
        {this.renderDragPreview()}
      </main>
    );
  }
}
