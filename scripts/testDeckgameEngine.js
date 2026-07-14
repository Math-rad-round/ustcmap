const assert = require('assert');
const path = require('path');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');

const defaultJsLoader = require.extensions['.js'];
require.extensions['.js'] = function loadJs(module, filename) {
  if (filename.includes(path.sep + 'node_modules' + path.sep)) {
    return defaultJsLoader(module, filename);
  }
  const result = babel.transformFileSync(filename, {
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('@babel/preset-env'), { targets: { node: 'current' }, modules: 'commonjs' }]],
    plugins: [require.resolve('@babel/plugin-proposal-class-properties')],
  });
  module._compile(result.code, filename);
};

const GameEngine = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'engine', 'GameEngine.js')).default;
const courses = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data', 'courses.json'));
const events = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data', 'events.json'));
const projects = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data', 'projects.json'));
const adcourses = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data', 'adcourses.json'));
const permanents = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data', 'permanent.json'));
const tests = require(path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data', 'test.json'));

function createEngine() {
  return new GameEngine({ courses, events, projects, adcourses, permanents, tests });
}

function setDeck(engine, cards) {
  engine.state.deck.cards = cards.slice();
  engine.state.deck._original = cards.slice();
  engine.state.ownedCourses = cards.slice();
}

function run(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

run('course rewards stay in deck original after semester reset', () => {
  const engine = createEngine();
  const reward = { id: 'test_reward_course', name: '测试奖励课', symbols: { Theory: 1 }, effects: [] };
  const oldOriginalLength = engine.state.deck._original.length;

  engine.state.pendingCourseReward = {
    source: '测试奖励',
    choices: [reward],
    selectnum: 1,
    selectedIndices: [0],
  };
  engine.execute({ type: 'CONFIRM_COURSE_REWARD' });

  assert.strictEqual(engine.state.deck.cards[0].name, '测试奖励课');
  assert(engine.state.deck._original.some((card) => card.name === '测试奖励课'));
  assert.strictEqual(engine.state.deck._original.length, oldOriginalLength + 1);

  engine.state.awaitingEventStart = true;
  engine.execute({ type: 'CONFIRM_START_EVENT' });
  assert(engine.state.deck.cards.some((card) => card.name === '测试奖励课'));
});

run('deleteLessons lets player choose from owned courses and removes that course everywhere', () => {
  const engine = createEngine();
  const a = { id: 'delete_a', name: '删除测试A', symbols: {}, effects: [] };
  const b = { id: 'delete_b', name: '删除测试B', symbols: {}, effects: [] };
  setDeck(engine, [a, b]);

  engine._applyEffects([{ effectType: 'deleteLessons', num: 1 }], {});

  assert(engine.state.pendingCourseDeletion);
  assert(engine.state.deck.cards.some((card) => card.id === 'delete_a'));
  engine.execute({ type: 'TOGGLE_COURSE_DELETION_SELECTION', courseIndex: 1 });
  engine.execute({ type: 'CONFIRM_COURSE_DELETION' });

  assert(engine.state.deck.cards.some((card) => card.id === 'delete_a'));
  assert(engine.state.deck._original.some((card) => card.id === 'delete_a'));
  assert(engine.state.ownedCourses.some((card) => card.id === 'delete_a'));
  assert(!engine.state.deck.cards.some((card) => card.id === 'delete_b'));
  assert(!engine.state.deck._original.some((card) => card.id === 'delete_b'));
  assert(!engine.state.ownedCourses.some((card) => card.id === 'delete_b'));
});


run('event hand limit asks player to choose discards', () => {
  const engine = createEngine();
  engine.state.eventHand = [1, 2, 3, 4].map((n) => ({ id: `event_${n}`, name: `事件${n}` }));
  engine.state.eventStageActive = true;

  engine.execute({ type: 'CONFIRM_EVENT_PHASE' });

  assert(engine.state.pendingEventDiscard);
  assert.strictEqual(engine.state.pendingEventDiscard.discardCount, 1);
  assert.strictEqual(engine.state.reviewStageActive, false);

  engine.execute({ type: 'TOGGLE_EVENT_DISCARD_CARD', cardIndex: 1 });
  engine.execute({ type: 'CONFIRM_EVENT_DISCARD' });

  assert.strictEqual(engine.state.pendingEventDiscard, null);
  assert.strictEqual(engine.state.eventHand.length, 3);
  assert(!engine.state.eventHand.some((card) => card.name === '事件2'));
  assert.strictEqual(engine.state.reviewStageActive, true);
});

run('retake puts current exam hand back before drawing again and clears pending progress', () => {
  const engine = createEngine();
  const hand = [
    { id: 'hand_a', name: '考试手牌A', symbols: {}, effects: [] },
    { id: 'hand_b', name: '考试手牌B', symbols: {}, effects: [] },
  ];
  setDeck(engine, hand.concat([{ id: 'deck_c', name: '牌堆C', symbols: {}, effects: [] }]));
  engine.state.hand = hand.slice();
  engine.state.deck.cards = [{ id: 'deck_c', name: '牌堆C', symbols: {}, effects: [] }];
  engine.state.currentTest = { id: 'test_retake', name: '重考测试', drawnum: 2, effect: [] };
  engine.state.semester = 2;
  engine.state.examStageActive = true;
  engine.state.score = 0;
  engine.state.examRequirement = 10;
  engine.state.pendingProjectProgress = { amount: 2, source: '测试推进' };
  engine.state.pendingProjectProgressQueue = [{ amount: 1, source: '队列推进' }];

  const beforeTotal = engine.state.deck.cards.length + engine.state.hand.length;
  engine.execute({ type: 'USE_RETAKE' });
  const afterTotal = engine.state.deck.cards.length + engine.state.hand.length;

  assert.strictEqual(engine.state.retakeUsed, true);
  assert.strictEqual(engine.state.pendingProjectProgress, null);
  assert.deepStrictEqual(engine.state.pendingProjectProgressQueue, []);
  assert.strictEqual(afterTotal, beforeTotal);
  assert.strictEqual(engine.state.hand.length, 2);
});

run('retake rolls back exam-triggered immediate goal reward', () => {
  const engine = createEngine();
  engine.state.immediateGoals = [{ id: 'first_exam_35', name: '最早考试35分', reward: 4, status: 'active' }];
  engine.state.goalResults = [];
  engine.state.achievementPoints = 0;
  engine.state.totalExamScore = 0;
  engine.state.currentTest = { id: 'test_goal', name: '目标测试', drawnum: 1, effect: [{ effectType: 'addScore', input: 'const1', multi: 40 }] };
  engine.state.deck.cards = [{ id: 'goal_course', name: '目标课程', symbols: {}, effects: [] }];
  engine.state.deck._original = engine.state.deck.cards.slice();

  engine._drawExamHand(1);
  assert.strictEqual(engine.state.immediateGoals[0].status, 'completed');
  assert(engine.state.achievementPoints > 0);

  engine.state.examRequirement = 999;
  engine.state.currentTest.effect = [];
  engine.execute({ type: 'USE_RETAKE' });

  assert.strictEqual(engine.state.immediateGoals[0].status, 'active');
  assert.strictEqual(engine.state.goalResults.length, 0);
});

run('event phase refreshes payment states after drawing new event cards', () => {
  const engine = createEngine();
  engine.state.awaitingEventStart = true;
  engine.state.currentTest = { id: 'test_stub', name: 'Test Stub', drawnum: 5, effect: [] };
  engine.state.eventHand = [
    { id: 'kept_1', name: 'Kept event 1', symbol: 'social', options: [] },
    { id: 'kept_2', name: 'Kept event 2', symbol: 'practice', options: [] },
  ];
  engine.state.eventDeck.cards = [
    {
      id: 'pay_three_events',
      name: 'Pay three events',
      options: [{ name: 'Reward', cost: [{ type: 'discardEvent', num: 3 }], effects: [] }],
    },
    { id: 'drawn_1', name: 'Drawn event 1', symbol: 'theory', options: [] },
    { id: 'drawn_2', name: 'Drawn event 2', symbol: 'social', options: [] },
  ];

  engine.execute({ type: 'CONFIRM_START_EVENT' });

  assert.strictEqual(engine.state.eventHand.length, 5);
  const targetIndex = engine.state.eventHand.findIndex((card) => card.id === 'pay_three_events');
  assert(targetIndex >= 0);
  assert.strictEqual(engine.state.eventOptionStates[targetIndex][0].canPay, true);
});

run('semester start offers two tests before event phase', () => {
  const engine = createEngine();
  engine.execute({ type: 'START_SEMESTER' });

  assert.strictEqual(engine.state.awaitingEventStart, true);
  assert.strictEqual(engine.state.currentTest, null);
  assert.strictEqual(engine.state.candidateTests.length, 2);

  engine.execute({ type: 'CONFIRM_START_EVENT' });
  assert.strictEqual(engine.state.eventStageActive, false);

  engine.execute({ type: 'SELECT_TEST', testIndex: 0 });
  assert(engine.state.currentTest);
  engine.execute({ type: 'CONFIRM_START_EVENT' });
  assert.strictEqual(engine.state.eventStageActive, true);
});

console.log('Deckgame engine tests passed.');