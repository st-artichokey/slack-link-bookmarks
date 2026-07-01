# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-02`)
2. Run `npm install`
3. Rename `.env.sample` to `.env` and fill in your tokens
4. Run `slack run`

To see what changed between stages:

```bash
git diff stage-03..stage-04
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

---

## Stage 04 — Building with Block Kit

The app at the end of stage 04. Building on the event listeners, interactive commands, and modal flows from stage 03, this stage introduces a Block Kit message that shares your saved links to the channel.

### What changed from stage-03

- `app.message('share links')` posts a structured Block Kit message (header, context, divider, section) listing the user's saved links to the channel, with an ephemeral prompt when there's nothing to share
- Manifest listing copy corrected to match the app: the "hello bot" trigger and the `/save-link` command

### Features carried over from stage-03

- `app.message('hello bot')` listener responds to a keyword in channel messages
- `/save-link` command saves a URL and responds with a "View Saved Links" button
- `app.action('view_saved_links')` opens a modal displaying the user's bookmarks
- `/show-links` command lists saved links with optional keyword filtering
- `/delete-links` command opens a modal with checkboxes to select links for removal
- `app.view('delete_links_modal')` handles the modal submission and deletes selected bookmarks
