const axios = require('axios');

const DEFAULT_MODEL = 'glm-4-flash';
const ALLOWED_MODELS = new Set(['glm-4-flash']);
const MAX_INPUT_CHARS = 12000;
const MAX_MESSAGES = 12;
const MAX_TOKENS_LIMIT = 1500;
const DEFAULT_TIMEOUT_MS = 30000;

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function normalizeMessages({ text, prompt, system, messages }) {
  let normalized = [];
  if (Array.isArray(messages) && messages.length > 0) {
    normalized = messages
      .slice(0, MAX_MESSAGES)
      .filter((message) => message && typeof message.content === 'string')
      .map((message) => ({
        role: ['system', 'assistant', 'user'].includes(message.role) ? message.role : 'user',
        content: message.content,
      }));
  } else {
    const userText = typeof text === 'string' ? text : prompt;
    if (typeof system === 'string' && system.trim()) {
      normalized.push({ role: 'system', content: system.trim() });
    }
    if (typeof userText === 'string' && userText.trim()) {
      normalized.push({ role: 'user', content: userText.trim() });
    }
  }

  const totalLength = normalized.reduce((sum, message) => sum + message.content.length, 0);
  if (totalLength > MAX_INPUT_CHARS) {
    throw new Error(`输入过长，最多 ${MAX_INPUT_CHARS} 字符`);
  }
  return normalized;
}

async function callForAllAI(options = {}) {
  if (process.env.ZHIPU_API_KEY === undefined) {
    throw new Error('AI API Key 未配置');
  }

  const messages = normalizeMessages(options);
  if (messages.length === 0) {
    throw new Error('无输入');
  }

  const requestedModel = typeof options.model === 'string' ? options.model : DEFAULT_MODEL;
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
  const maxTokens = Math.floor(clampNumber(options.max_tokens || options.maxTokens, 800, 1, MAX_TOKENS_LIMIT));
  const temperature = clampNumber(options.temperature, 0.7, 0, 1);

  const response = await axios.post(
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: clampNumber(options.timeout, DEFAULT_TIMEOUT_MS, 1000, 60000),
    }
  );

  const choice = response.data && response.data.choices && response.data.choices[0];
  const text = choice && choice.message && typeof choice.message.content === 'string'
    ? choice.message.content
    : '';
  return {
    text,
    model: response.data && response.data.model ? response.data.model : model,
    usage: response.data ? response.data.usage : undefined,
  };
}

module.exports = { callForAllAI };