# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-02`)
2. Run `npm install`
3. Rename `.env.sample` to `.env` and fill in your tokens
4. Run `slack run`

To see what changed between stages:

```bash
git diff stage-05..stage-06
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

---

## Stage 06 — App Home

The app carries over everything through stage 05 (event listeners, interactive commands, modal flows, and the Block Kit share-links message) and adds an App Home tab as a persistent, in-app entry point. Bookmarks are held in memory and mirrored to a local JSON file as interim storage; a real datastore comes in the next stage.

### New in this stage

- `app.event('message')` consolidates the previous per-keyword `app.message(...)` listeners into a single DM intent router for the Messages tab: it saves any URLs sent, responds to `share links`, and otherwise replies with help. `bot_id`/`subtype` guards keep the app from replying to itself, and exactly one branch responds so there is no double-reply from overlapping listeners
- `app.event('app_home_opened')` publishes a tabbed App Home tab via `buildTabbedHome`, with Overview (saved links plus edit/delete actions), Activity (a recent-activity feed), and Settings (sort order and notification preference) tabs; it skips the `views.publish` call when nothing has changed since the user last saw the view
- `app.action('open_settings')` opens a settings modal for the sort order and notifications preference; `app.view('settings_modal')` persists it through `savePreferences`
- `app.action('open_edit_modal')` opens an "Edit Saved Links" modal with a title and URL input per bookmark; `app.view('edit_links_modal')` writes the edits back
- `/save-link` and the "Add Links" modal now accept several URLs at once, split on commas or new lines via a shared `parseLinks` helper
- `loadDb()` / `saveDb()` mirror bookmarks and preferences to a local `bookmarks.db` JSON file so they survive a restart during development

### From previous stages

> Note: the standalone `app.message('hello bot')` and channel-based `app.message('share links')` listeners from earlier stages are removed in this stage. The `share links` keyword now lives in the DM intent router above; posting a saved-links Block Kit message is still available via the router's `shareLinks` helper.

- `/save-link` command saves one or more URLs and responds with a "View Saved Links" button
- `app.action('view_saved_links')` opens a modal displaying the user's bookmarks
- `/show-links` command lists saved links with optional keyword filtering
- `/delete-links` command opens a modal with checkboxes to select links for removal
- `app.view('delete_links_modal')` handles the modal submission and deletes selected bookmarks
