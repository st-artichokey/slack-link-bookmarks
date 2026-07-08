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

## Stage 02 — Your App's Manifest

The app at the end of stage 02. You've expanded the manifest to declare Link Bookmarks' identity, added the `commands` scope for future use, and enabled interactivity.

### New in this stage

- `display_information` now includes `description`, `long_description`, and `background_color`
- `commands` scope added to `oauth_config`
- `interactivity.is_enabled` set to `true` in `settings`

### From previous stages

- `app.event('app_mention')` handler responds to @-mentions
- Minimal manifest with `app_mentions:read` and `chat:write` scopes, running in socket mode
