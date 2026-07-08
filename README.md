# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-02`)
2. Run `npm install`
3. Rename `.env.sample` to `.env` and fill in your tokens
4. Run `slack run`

To see what changed between stages:

```bash
git diff stage-04..stage-05
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

---

## Stage 05 — Slash Commands vs. Shortcuts

The starting point for stage 05. The app carries over everything through stage 04 (event listeners, interactive commands, modal flows, and the Block Kit share-links message). This stage explores the tradeoffs between entry points — slash commands and shortcuts — and how that choice affects Marketplace review.

### New in this stage

- `app.shortcut('show_saved_links')` global shortcut opens the saved-links modal, sharing a `buildSavedLinksModal` helper with the `view_saved_links` action
- `app.shortcut('add_links')` global shortcut opens a modal with a multiline input to save several links at once
- `app.view('add_links_modal')` parses one link per line and confirms the count in the updated modal
- `delete_links_modal` submission now confirms in the updated modal instead of sending a DM
- Manifest adds a "Save Message" message shortcut plus "Show Saved Links" and "Add Links" global shortcuts

### From previous stages

- `app.message('hello bot')` listener responds to a keyword in channel messages
- `app.message('share links')` posts a Block Kit message listing the user's saved links to the channel
- `/save-link` command saves a URL and responds with a "View Saved Links" button
- `app.action('view_saved_links')` opens a modal displaying the user's bookmarks
- `/show-links` command lists saved links with optional keyword filtering
- `/delete-links` command opens a modal with checkboxes to select links for removal
- `app.view('delete_links_modal')` handles the modal submission and deletes selected bookmarks
