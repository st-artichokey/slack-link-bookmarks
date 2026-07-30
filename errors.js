// Slack web API error codes mapped to messages a user can act on. The raw code
// arrives as error.data.error when a @slack/web-api call fails.
const FRIENDLY_MESSAGES = {
  channel_not_found: "I can't post there. Invite me to the channel with `/invite @Link Bookmarks` and try again.",
  not_in_channel: "I need to join that channel first. Invite me with `/invite @Link Bookmarks` and try again.",
  missing_scope: "This action needs a permission the app doesn't have yet. Ask a workspace admin to reinstall the app.",
  invalid_auth: "The app's access was revoked. A workspace admin will need to reinstall it.",
  account_inactive: "This account is deactivated, so the action can't complete.",
  ratelimited: "Slack is asking me to slow down. Try again in a moment.",
};

const GENERIC_MESSAGE = 'Something went wrong on our end. Please try again in a moment.';

function slackErrorCode(error) {
  return error?.data?.error || error?.code;
}

function friendlyMessage(error) {
  return FRIENDLY_MESSAGES[slackErrorCode(error)] || GENERIC_MESSAGE;
}

// Only transient failures are worth retrying. A bad token or missing scope will
// fail identically on every attempt, so retrying just delays the inevitable.
function isRetryable(error) {
  const code = slackErrorCode(error);
  if (code === 'ratelimited' || code === 'slack_webapi_rate_limited_error') return true;
  if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') return true;
  return false;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with jitter. Only wrap idempotent operations — retrying a
// chat.postMessage would post duplicates on a transient failure.
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryable(error)) throw error;
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000;
      await sleep(baseDelay + jitter);
    }
  }
}

module.exports = { friendlyMessage, isRetryable, retryWithBackoff, slackErrorCode };
