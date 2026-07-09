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

- `app.event('app_home_opened')` publishes an App Home tab via `buildHomeView`, showing the user's saved links, their notification preference, and a recent-activity feed derived from their bookmarks
- `app.action('open_settings')` opens a settings modal for the sort order and notifications preference; `app.view('settings_modal')` persists it through `savePreferences`
- `app.action('open_edit_modal')` opens an "Edit Saved Links" modal with a title and URL input per bookmark; `app.view('edit_links_modal')` writes the edits back
- `/save-link` and the "Add Links" modal now accept several URLs at once, split on commas or new lines via a shared `parseLinks` helper
- `loadDb()` / `saveDb()` mirror bookmarks and preferences to a local `bookmarks.db` JSON file so they survive a restart during development

### From previous stages

- `app.message('hello bot')` listener responds to a keyword in channel messages
- `app.message('share links')` posts a Block Kit message listing the user's saved links to the channel
- `/save-link` command saves one or more URLs and responds with a "View Saved Links" button
- `app.action('view_saved_links')` opens a modal displaying the user's bookmarks
- `/show-links` command lists saved links with optional keyword filtering
- `/delete-links` command opens a modal with checkboxes to select links for removal
- `app.view('delete_links_modal')` handles the modal submission and deletes selected bookmarks
