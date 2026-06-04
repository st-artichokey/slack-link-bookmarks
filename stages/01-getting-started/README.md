# Stage 01 — Getting Started

> Corresponds to: Post 01 — Getting Started

## What you're building

A minimal Slack app that connects to your workspace and responds when mentioned. This is the foundation everything else builds on — by the end, you'll have a running app connected via socket mode.

## Prerequisites

- Node.js (LTS)
- Slack CLI installed ([docs.slack.dev/quickstart](https://docs.slack.dev/quickstart)) — use the JavaScript version
- A development workspace ([developer program](https://api.slack.com/developer-program))

## Walkthrough

### 1. Authenticate the CLI

```bash
slack login
```

Approve the OAuth flow in your browser.

### 2. Register your app with Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest**
2. Select your dev workspace
3. Paste the contents of `manifest.json` from this directory
4. Click through to create

### 3. Initialize the project for the Slack CLI

```bash
slack init
```

This creates a `.slack/` directory containing `hooks.json` and `config.json`. The hooks file tells the Slack CLI how to communicate with your app (reading the manifest, starting the dev server, etc.). It also adds `@slack/cli-hooks` as a dev dependency — the package that implements those hooks for Bolt JS.

When prompted to link an existing app, select the app you just registered in step 2.

### 4. Install dependencies

```bash
npm install
```

### 5. Generate tokens

From your app's dashboard:

1. **Bot token** — OAuth & Permissions → Install to Workspace → copy the `xoxb-...` token
2. **App-level token** — Basic Information → App-Level Tokens → Generate Token (add `connections:write` scope) → copy the `xapp-...` token
3. **Signing secret** — Basic Information → App Credentials → copy

### 6. Configure environment

```bash
cp .env.sample .env
```

Fill in your three values.

### 7. Run the app

```bash
slack run
```

### 8. Test it

In your workspace, invite the app to a channel (`/invite @Link Bookmarks`), then mention it:

```
@Link Bookmarks hello
```

## Checkpoints

- [ ] `slack login` shows your workspace in `slack auth list`
- [ ] App appears in your workspace's app directory after manifest upload
- [ ] `slack init` creates a `.slack/` directory and links your app
- [ ] `npm install` completes without errors (includes `@slack/cli-hooks` in devDependencies)
- [ ] `slack run` prints "Link Bookmarks is running!"
- [ ] Mentioning the app in a channel produces a response

## Stretch goals

1. **Add a second event**: Subscribe to `message` events (requires `channels:history` scope) and have the app respond when someone says "bookmark" in a channel. Hint: use `app.message('bookmark', ...)`.

2. **Customize the response**: Use Block Kit to format the reply with a section block and a button (preview of post 04). The [Block Kit Builder](https://app.slack.com/block-kit-builder) can help you prototype.

## Resources

- [Slack CLI quickstart](https://docs.slack.dev/quickstart)
- [Socket mode vs HTTP](https://docs.slack.dev/apis/events-api/comparing-http-socket-mode)
- [Bolt for JavaScript getting started](https://docs.slack.dev/tools/bolt-js/getting-started)
