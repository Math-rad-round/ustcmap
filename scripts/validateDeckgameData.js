const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'client', 'src', 'components', 'new', 'deckgame', 'data');

const files = {
  courses: 'courses.json',
  adcourses: 'adcourses.json',
  events: 'events.json',
  projects: 'projects.json',
  permanents: 'permanent.json',
  tests: 'test.json',
};

const allowedEffects = new Set([
  'addAchievement',
  'addNextScore',
  'addProjectProgress',
  'addReview',
  'addScore',
  'addSymbol',
  'compare',
  'deleteLessons',
  'drawEvent',
  'getHighest',
  'addAchievementIf',
  'doublePermanentEffects',
  'randomExamSymbol',
  'getLowest',
  'getVariable',
  'givePermanent',
  'giveProgress',
  'giveProgressOn',
  'giveProject',
  'match',
  'sReward',
]);

const allowedCosts = new Set(['symbolCost', 'discardEvent', 'eventCost', 'cardCost', 'anyCost', 'anyEventCost']);
const allowedProjectOptionTypes = new Set(['consume', 'remove', 'milestone']);
const allowedSymbols = new Set(['book', 'connect', 'data', 'research', 'engineering']);
const allowedLessonTypes = new Set(['theory', 'practice', 'social']);
const allowedAchievementModes = new Set(['easy', 'normal', 'hard']);
const allowedVariables = new Set([
  'theory', 'practice', 'social', 'Theory', 'Practice', 'Social', 'semester', 'achievement', 'review', 'progress', 'project', 'permanent',
  'baseScore', 'social_ge_4', 'social_ge_3', 'requirement', 'score', 'passed', 'randomSymbolName', 'randomSymbol', 'eventHand', 'completepro', 'completedProject', 'lowest', 'highest', 't', 'p', 's', 'local_progress', 'TheoryHighest', 'physicsIsTheoryHighest', 'computerEarlySemester', 'sportsSocialAtLeast4', 'hobbySpecialSemester', 'const1', 'const2', 'const3', 'const4', 'const5', 'const6',
  'const7', 'const8', 'const9', 'const10', 'const12', 'const15', 'const20', 'const30',
]);

const projectAliases = {
  pro_robotmaster: 'project_robotmaster',
  pro_ICPC: 'project_icpc',
  pro_icpc: 'project_icpc',
  pro_group: 'project_group',
  pro_teach: 'project_teach',
  pro_research: 'project_research',
  pro_company: 'project_company',
  pro_startup: 'project_startup',
};

const errors = [];
const warnings = [];

function readJson(name) {
  const fullPath = path.join(dataDir, files[name]);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (err) {
    errors.push(`${files[name]}: JSON 读取失败：${err.message}`);
    return [];
  }
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.courses)) return value.courses;
  if (value && Array.isArray(value.events)) return value.events;
  if (value && Array.isArray(value.projects)) return value.projects;
  if (value && Array.isArray(value.permanents)) return value.permanents;
  if (value && Array.isArray(value.tests)) return value.tests;
  return [];
}

function label(scope, item, index) {
  return `${scope}[${index}] ${item && (item.id || item.name) ? `(${item.id || item.name})` : ''}`.trim();
}

function checkUniqueId(scope, items) {
  const seen = new Map();
  items.forEach((item, index) => {
    if (!item || !item.id) {
      errors.push(`${label(scope, item, index)}: 缺少 id`);
      return;
    }
    if (seen.has(item.id)) {
      errors.push(`${label(scope, item, index)}: id 重复，首次出现在 ${seen.get(item.id)}`);
    }
    seen.set(item.id, `${scope}[${index}]`);
  });
}

function normalizeProjectId(name) {
  return projectAliases[name] || name;
}

function checkNumber(value, pathName, options = {}) {
  if (value == null) return;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    errors.push(`${pathName}: 应为数字，实际是 ${value}`);
  } else if (options.nonNegative && num < 0) {
    errors.push(`${pathName}: 不应为负数，实际是 ${value}`);
  }
}

function checkVariable(value, pathName, allowNumber = true, localVariables = new Set()) {
  if (value == null) return;
  if (allowNumber && typeof value === 'number') return;
  if (typeof value !== 'string') {
    errors.push(`${pathName}: 变量应为字符串或数字`);
    return;
  }
  if (value.startsWith('const')) return;
  if (!allowedVariables.has(value)) warnings.push(`${pathName}: 未知变量 ${value}`);
}

function checkEffect(effect, pathName, refs, localVariables = new Set()) {
  if (!effect || typeof effect !== 'object') {
    errors.push(`${pathName}: effect 必须是对象`);
    return;
  }
  if (!allowedEffects.has(effect.effectType)) {
    errors.push(`${pathName}: 未支持的 effectType ${effect.effectType}`);
    return;
  }

  switch (effect.effectType) {
    case 'giveProject': {
      const id = normalizeProjectId(effect.name || effect.target);
      if (!refs.projects.has(id)) errors.push(`${pathName}: 项目不存在 ${effect.name || effect.target}`);
      break;
    }
    case 'giveProgressOn': {
      const id = normalizeProjectId(effect.name || effect.target);
      if (!refs.projects.has(id)) errors.push(`${pathName}: 指定推进项目不存在 ${effect.name || effect.target}`);
      break;
    }
    case 'givePermanent': {
      if (!refs.permanents.has(effect.name || effect.target)) errors.push(`${pathName}: 成果不存在 ${effect.name || effect.target}`);
      break;
    }
    case 'sReward': {
      checkNumber(effect.shownum, `${pathName}.shownum`, { nonNegative: true });
      checkNumber(effect.selectnum, `${pathName}.selectnum`, { nonNegative: true });
      if (effect.lessontype && !allowedLessonTypes.has(effect.lessontype)) errors.push(`${pathName}: lessontype 不合法 ${effect.lessontype}`);
      break;
    }
    case 'addScore':
    case 'addAchievement':
    case 'addReview':
    case 'addNextScore':
    case 'addProjectProgress':
    case 'giveProgress':
    case 'deleteLessons':
      checkVariable(effect.input ?? effect.num ?? 1, `${pathName}.input`, true, localVariables);
      checkNumber(effect.multi, `${pathName}.multi`);
      break;
    case 'addSymbol': {
      if (!allowedLessonTypes.has(String(effect.input || '').toLowerCase())) errors.push(`${pathName}: addSymbol input 不合法 ${effect.input}`);
      checkNumber(effect.multi ?? effect.amount, `${pathName}.multi`);
      break;
    }
    case 'compare':
      checkVariable(effect.input1, `${pathName}.input1`, true, localVariables);
      checkVariable(effect.input2, `${pathName}.input2`, true, localVariables);
      if (!['eq', 'ne', 'lt', 'le', 'gt', 'ge'].includes(effect.type)) errors.push(`${pathName}: compare type 不合法 ${effect.type}`);
      break;
    case 'match':
      checkVariable(effect.input, `${pathName}.input`, true, localVariables);
      if (!Array.isArray(effect.list)) errors.push(`${pathName}: match 缺少 list`);
      break;
    case 'getHighest':
    case 'getLowest':
    case 'getVariable':
      if (!effect.output && effect.effectType === 'getVariable') errors.push(`${pathName}: getVariable 缺少 output`);
      break;
    case 'drawEvent':
      checkVariable(effect.num ?? effect.input, `${pathName}.num`, true, localVariables);
      break;
    case 'randomExamSymbol':
    case 'doublePermanentEffects':
      break;
    case 'addAchievementIf':
      if (Array.isArray(effect.conditionAll)) effect.conditionAll.forEach((item, itemIndex) => checkVariable(item, `${pathName}.conditionAll[${itemIndex}]`, true, localVariables));
      else checkVariable(effect.condition || effect.input, `${pathName}.condition`, true, localVariables);
      checkNumber(effect.amount ?? effect.multi, `${pathName}.amount`);
      break;
    default:
      break;
  }
}

function checkEffects(effects, pathName, refs) {
  if (effects == null) return;
  if (!Array.isArray(effects)) {
    errors.push(`${pathName}: effects 必须是数组`);
    return;
  }
  const localVariables = new Set();
  effects.forEach((effect, index) => {
    checkEffect(effect, `${pathName}.effects[${index}]`, refs, localVariables);
    if (effect && effect.output) localVariables.add(effect.output);
  });
}

function checkCosts(costs, pathName) {
  if (costs == null) return;
  if (!Array.isArray(costs)) {
    errors.push(`${pathName}: cost 必须是数组`);
    return;
  }
  costs.forEach((cost, index) => {
    const costPath = `${pathName}.cost[${index}]`;
    if (!allowedCosts.has(cost.type)) errors.push(`${costPath}: 未支持的 cost.type ${cost.type}`);
    checkNumber(cost.amount ?? cost.num ?? 1, `${costPath}.amount`, { nonNegative: true });
    if ((cost.type === 'symbolCost' || cost.type === 'discardEvent') && cost.symbol && !allowedSymbols.has(cost.symbol)) {
      errors.push(`${costPath}: symbol 不合法 ${cost.symbol}`);
    }
  });
}

const courses = asList(readJson('courses'));
const adcourses = asList(readJson('adcourses'));
const events = asList(readJson('events'));
const projects = asList(readJson('projects'));
const permanents = asList(readJson('permanents'));
const tests = asList(readJson('tests'));

const refs = {
  courses: new Set([...courses, ...adcourses].map((item) => item.id).filter(Boolean)),
  projects: new Set(projects.map((item) => item.id).filter(Boolean)),
  permanents: new Set(permanents.map((item) => item.id).filter(Boolean)),
};

[
  ['courses', courses],
  ['adcourses', adcourses],
  ['events', events],
  ['projects', projects],
  ['permanents', permanents],
  ['tests', tests],
].forEach(([scope, items]) => checkUniqueId(scope, items));

courses.forEach((course, index) => checkEffects(course.effects, label('courses', course, index), refs));
adcourses.forEach((course, index) => checkEffects(course.effects, label('adcourses', course, index), refs));
permanents.forEach((permanent, index) => checkEffects(permanent.effects, label('permanents', permanent, index), refs));
tests.forEach((test, index) => {
  checkNumber(test.drawnum, `${label('tests', test, index)}.drawnum`, { nonNegative: true });
  checkNumber(test.scorescaling, `${label('tests', test, index)}.scorescaling`, { nonNegative: true });
  if (test.achievementMode && !allowedAchievementModes.has(test.achievementMode)) errors.push(`${label('tests', test, index)}.achievementMode: invalid ${test.achievementMode}`);
  checkEffects(test.start, `${label('tests', test, index)}.start`, refs);
  checkEffects(test.effect, `${label('tests', test, index)}.effect`, refs);
  checkEffects(test.result, `${label('tests', test, index)}.result`, refs);
});
projects.forEach((project, index) => {
  const projectPath = label('projects', project, index);
  if (!Array.isArray(project.options)) errors.push(`${projectPath}: 缺少 options 数组`);
  (project.options || []).forEach((option, optionIndex) => {
    const optionPath = `${projectPath}.options[${optionIndex}]`;
    checkNumber(option.require, `${optionPath}.require`, { nonNegative: true });
    const type = option.type || 'remove';
    if (!allowedProjectOptionTypes.has(type)) errors.push(`${optionPath}: type 不合法 ${type}`);
    checkEffects(option.effects, optionPath, refs);
  });
});
events.forEach((event, index) => {
  const eventPath = label('events', event, index);
  if (event.symbol && !allowedSymbols.has(event.symbol)) errors.push(`${eventPath}: symbol 不合法 ${event.symbol}`);
  checkNumber(event.weight, `${eventPath}.weight`, { nonNegative: true });
  if (!Array.isArray(event.options)) errors.push(`${eventPath}: 缺少 options 数组`);
  (event.options || []).forEach((option, optionIndex) => {
    const optionPath = `${eventPath}.options[${optionIndex}]`;
    checkCosts(option.cost, optionPath);
    checkEffects(option.effects, optionPath, refs);
  });
});

if (errors.length > 0) {
  console.error(`Deckgame data validation failed: ${errors.length} error(s)`);
  errors.forEach((item) => console.error(`- ${item}`));
  if (warnings.length > 0) {
    console.warn(`Warnings: ${warnings.length}`);
    warnings.forEach((item) => console.warn(`- ${item}`));
  }
  process.exit(1);
}

console.log(`Deckgame data validation passed. ${courses.length} courses, ${adcourses.length} advanced courses, ${events.length} events, ${projects.length} projects, ${permanents.length} permanents, ${tests.length} tests.`);
if (warnings.length > 0) {
  console.warn(`Warnings: ${warnings.length}`);
  warnings.forEach((item) => console.warn(`- ${item}`));
}
