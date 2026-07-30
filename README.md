# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-02`)
2. Run `npm install`
3. Rename `.env.sample` to `.env` and fill in your tokens
4. Run `slack run`

To see what changed between stages:

```bash
git diff stage-07..stage-08
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

---

## Stage 08 — Error Handling & Logging

A Marketplace app runs in workspaces you can't observe. Users who hit an error rarely report it — they just stop using the app. This stage makes failures visible to you as the developer and actionable for the user: every user-facing handler acknowledges first, catches its own errors, shows a plain-language message with a reference id, and logs the details as structured JSON. Two new modules keep this out of the Slack wiring, mirroring how stage 07 pulled storage into `db.js`.

### New in this stage

- A new `logger.js` module emits JSON-structured logs (`level`, `message`, `timestamp`, plus context) with a `LOG_LEVEL` filter; it redacts secrets and user content (tokens, message `text`, emails, names) before writing, and provides `newCorrelationId()` for tracing one interaction across log lines
- A new `errors.js` module maps Slack web API error codes (`channel_not_found`, `missing_scope`, `ratelimited`, etc.) to messages a user can act on, classifies which errors are transient, and provides `retryWithBackoff()` (exponential backoff with jitter) for idempotent calls
- `app.error()` registers a global handler as a safety net: it logs any unhandled listener error with team/user context. Because it fires after the listener has already failed, per-listener try/catch remains the primary path for user-facing messages
- The `/save-link`, `/show-links`, DM message router, and "Add Links" modal handlers now acknowledge first, then wrap their work in try/catch — on failure they log full details (with a correlation id) and show the user a friendly message ending in `(ref: <id>)` so support can find the matching logs
- The "Add Links" modal validates its input with `response_action: 'errors'`, so submitting no valid URL returns a field-level error and keeps the user's input instead of silently saving zero links
- `publishHomeView` wraps the idempotent `views.publish` call in `retryWithBackoff`; non-idempotent posts (like `chat.postMessage`) are deliberately not retried to avoid duplicate messages

### From stage 07 — Persistent Storage

- A `db.js` module owns the database connection, schema, and every data-access function; `app.js` pulls them in with a single `require('./db')`, keeping storage concerns out of the Slack handlers
- A SQLite database (via `better-sqlite3`) replaces the earlier JSON file, with `bookmarks` and `preferences` tables created on startup and WAL journaling enabled
- A single `query(text, params)` seam wraps all database access — reads return `{ rows }`, writes return change metadata — so the storage layer stays swappable
- The edit and delete modals key off stable row `id`s instead of array positions, so links can be added or removed between opening a modal and submitting it without corrupting the target
- `app.event('app_uninstalled')` and `app.event('tokens_revoked')` clean up stored data when access ends: uninstalling clears every table via `deleteAllData()`, while a token revocation drops each affected user's data via `deleteUserData(userId)`

### From previous stages

- `app.event('app_home_opened')` publishes a tabbed App Home tab via `buildTabbedHome`, with Overview, Activity, and Settings tabs; it skips the `views.publish` call when nothing has changed since the user last saw the view
- `app.action('open_settings')` and `app.view('settings_modal')` manage the sort order and notifications preference
- `app.action('open_edit_modal')` and `app.view('edit_links_modal')` handle the "Edit Saved Links" modal
- `/save-link` and the "Add Links" modal accept several URLs at once, split on commas or new lines via a shared `parseLinks` helper
- `app.event('message')` is a single DM intent router for the Messages tab: it saves any URLs sent, responds to `share links` via the `shareLinks` helper, and otherwise replies with help; `bot_id`/`subtype` guards keep the app from replying to itself
- `/save-link` command saves one or more URLs and responds with a "View Saved Links" button
- `app.action('view_saved_links')` opens a modal displaying the user's bookmarks
- `/show-links` command lists saved links with optional keyword filtering
- `/delete-links` command opens a modal with checkboxes to select links for removal
- `app.view('delete_links_modal')` handles the modal submission and deletes selected bookmarks
