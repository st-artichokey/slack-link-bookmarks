# Stage 02 — Your App's Manifest

> Corresponds to: Post 02 — Your App's Manifest

## What this branch represents

The app at the end of stage 02. You've expanded the manifest to declare Link Bookmarks' identity, added the `commands` scope for future use, and enabled interactivity.

## What changed from stage-01

- `display_information` now includes `description`, `long_description`, and `background_color`
- `commands` scope added to `oauth_config`
- `interactivity.is_enabled` set to `true` in `settings`

## Running

```bash
npm install
cp .env.sample .env
# Fill in your tokens (see post 01 for details)
slack run
```

The app responds to @-mentions with a hello message. The manifest is now ready for interactive features in upcoming stages.

## Prerequisites

- Node.js (LTS)
- [Slack CLI](https://docs.slack.dev/quickstart) (JavaScript version)
- A [developer sandbox workspace](https://api.slack.com/developer-program)
- App registered and tokens configured (see stage-01 branch)
