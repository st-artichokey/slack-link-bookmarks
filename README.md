# Slack Link Bookmarks — Workshop

A self-paced code-along companion to the "Building a Marketplace-Ready Slack App from Scratch" series.

## The app

Link Bookmarks lets users save links from Slack messages into a personal collection, browse and search them, and share them back to channels — all without leaving Slack.

## How this repo works

The `stages/` directory contains 13 folders, one per series post. Each stage is a **fully runnable, standalone app** — you can jump to any stage, install dependencies, and run it.

To see what changed between stages, diff adjacent folders:

```bash
diff -r stages/01-getting-started stages/02-manifest
```

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)

## Quick start (any stage)

```bash
cd stages/01-getting-started
npm install
cp .env.sample .env
# Fill in your tokens (see the stage README for details)
slack run
```

## Stages

| # | Title | What's added |
|---|-------|-------------|
| 01 | Getting Started | Hello world — app responds to mentions |
| 02 | Manifest | Scopes and configuration explained |
| 03 | Events & Interactivity | Message shortcut saves a link |
| 04 | Block Kit | Bookmarks render as rich cards |
| 05 | Entry Points | Slash command + global shortcut + message shortcut |
| 06 | App Home | Per-user bookmark dashboard |
| 07 | Datastores | SQLite persistence |
| 08 | Error Handling | Structured logging and graceful failures |
| 09 | Testing | Unit and integration tests |
| 10 | Security | Multi-tenant audit and hardening |
| 11 | Distribution | OAuth multi-workspace install |
| 12 | Marketplace Prep | Listing, privacy policy, landing page |
| 13 | Submission | Review checklist and maintenance |
