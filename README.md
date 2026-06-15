# Slack Link Bookmarks

A code-along companion to the "Building a Marketplace-Ready Slack App" series. Each branch represents the app at the end of that stage.

## How to use this repo

1. Check out the branch for the stage you're on (e.g. `git checkout stage-01`)
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

## Stage 01 — Getting Started

The app at the end of stage 01. A minimal Slack app running in socket mode that responds to @-mentions with a hello message.

### What's here

- Bolt for JavaScript app with socket mode
- `app_mention` event handler
- Minimal manifest with `app_mentions:read` and `chat:write` scopes
