# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-02`)
2. Run `npm install`
3. Copy `.env.sample` to `.env` and fill in your tokens
4. Run `slack run`

To see what changed between stages:

```bash
git diff stage-01..stage-02
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

---

## Stage 03 — Events & Interactivity

The app at the end of stage 03. You've added event listeners, interactive commands, and a modal form submission flow.

### New in this stage

- `app.message('hello bot')` listener responds to a keyword in channel messages
- `/save-link` command saves a URL and responds with a "View Saved Links" button
- `app.action('view_saved_links')` opens a modal displaying the user's bookmarks
- `/show-links` command lists saved links with optional keyword filtering
- `/delete-links` command opens a modal with checkboxes to select links for removal
- `app.view('delete_links_modal')` handles the modal submission and deletes selected bookmarks
- Manifest updated with slash commands, `channels:history` scope, and `message.channels` event

### From previous stages

- `app.event('app_mention')` handler responds to @-mentions
- Manifest declares the app's identity and enables interactivity, with the `commands` scope in place
