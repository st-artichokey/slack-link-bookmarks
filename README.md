# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-02`)
2. Run `npm install`
3. Rename `.env.sample` to `.env` and fill in your tokens
4. Run `slack run`

To see what changed between stages:

```bash
git diff stage-06..stage-07
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

---

## Stage 07 — Persistent Storage

Through stage 06 the app held bookmarks and preferences in memory, mirrored to a local JSON file. That works for a single-process dev app but doesn't survive as real infrastructure: there's no schema, no concurrent-safe writes, and every read scans the whole file. This stage replaces that interim storage with a real SQLite database, routes every read and write through a single query seam, and moves the whole storage layer into its own `db.js` module so `app.js` is left with just the Slack wiring.

### New in this stage

- A new `db.js` module owns the database connection, schema, and every data-access function; `app.js` pulls them in with a single `require('./db')`, keeping storage concerns out of the Slack handlers
- A SQLite database (via `better-sqlite3`) replaces the JSON file, with `bookmarks` and `preferences` tables created on startup and WAL journaling enabled
- A single `query(text, params)` seam wraps all database access — reads return `{ rows }`, writes return change metadata — so the storage layer stays swappable (for example, moving to Postgres later touches only `query()`)
- `getUserBookmarks`, `addBookmark`, `updateBookmark`, `deleteBookmark`, `getLastUpdateTime`, and the SQLite-backed `getPreferences`/`savePreferences` (an upsert) all go through that seam; the per-user reads and inserts are scoped by `user_id`, while `updateBookmark`/`deleteBookmark` target a stable row `id` (see below)
- The edit and delete modals now key off stable row `id`s instead of array positions, so links can be added or removed between opening a modal and submitting it without corrupting the target

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
