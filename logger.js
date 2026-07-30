const { randomUUID } = require('crypto');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const ACTIVE_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

// Keys whose values must never reach the logs: tokens/secrets and the kinds of
// user content the app has no business persisting (message text, emails, names).
const REDACT_KEYS = new Set([
  'token', 'tokens', 'authorization', 'secret', 'password',
  'signing_secret', 'text', 'email', 'name', 'value',
]);

function redact(context) {
  if (!context || typeof context !== 'object') return context;
  const clean = {};
  for (const [key, val] of Object.entries(context)) {
    if (REDACT_KEYS.has(key)) {
      clean[key] = '[redacted]';
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      clean[key] = redact(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function emit(level, message, context = {}) {
  if (LEVELS[level] > ACTIVE_LEVEL) return;
  const line = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redact(context),
  });
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

const logger = {
  error: (message, context) => emit('error', message, context),
  warn: (message, context) => emit('warn', message, context),
  info: (message, context) => emit('info', message, context),
  debug: (message, context) => emit('debug', message, context),
};

// A short id threaded through one user interaction so its log lines can be
// grouped, and surfaced to the user so support can search for it.
function newCorrelationId() {
  return randomUUID().slice(0, 8);
}

module.exports = { logger, redact, newCorrelationId };
