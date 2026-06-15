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

## What this project is

This repo walks through every stage of building a Slack app that's ready for the Slack Marketplace. Each stage introduces the same decisions, patterns, and requirements that ship in production-quality apps: multi-tenant data isolation, OAuth distribution, structured error handling, security review preparation, and marketplace submission.

When you're done, you'll have a working reference app and a clear picture of what Slack's review expects at each layer.

## The app

Link Bookmarks lets users save links from Slack messages into a personal collection, browse and search them, and share them back to channels without leaving Slack.

## Stages

| Branch | Post | Topic | What's added |
|--------|------|-------|-------------|
| `stage-01` | 01 | Getting Started | Bolt app with socket mode, responds to @-mentions |
| `stage-02` | 02 | Your App's Manifest | Expanded display info, scopes, interactivity enabled |
| `stage-03` | 03 | Events & Interactivity | Message shortcut saves a link, modal confirmation |
| `stage-04` | 04 | Block Kit | Bookmarks render as rich structured cards |
| `stage-05` | 05 | Entry Points | `/bookmarks` command, global shortcut, message shortcut |
| `stage-06` | 06 | App Home | Per-user bookmark dashboard with settings |
| `stage-07` | 07 | Datastores | SQLite persistence, rate limit handling |
| `stage-08` | 08 | Error Handling | Structured logging, graceful degradation, retries |
| `stage-09` | 09 | Testing | Unit tests, integration tests, CI pipeline |
| `stage-10` | 10 | Security | Request verification, token encryption, data isolation |
| `stage-11` | 11 | Compliance | Enterprise readiness, privacy model, uninstall cleanup |
| `stage-12` | 12 | Distribution | OAuth install flow, multi-workspace token management |
| `stage-13` | 13 | Marketplace Prep | Listing content, scope justification, pre-submission checklist |
| `stage-14` | 14 | Submission | Review process, post-launch monitoring, maintenance |
