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

The app connects but is inert — it doesn't respond to anything yet.

### 8. Add an event listener

Your app is connected but inert. Now give it something to do — register a handler for the `app_mention` event. Open `app.js` and add this where the comment says "Your event listeners will go here":

```javascript
app.event('app_mention', async ({ event, say }) => {
  await say(`Hello <@${event.user}>`);
});
```

### 9. Update the manifest

The handler needs two manifest changes. Both the scope and the event subscription must be present — the scope grants permission; the subscription tells Slack to deliver the event.

Update `manifest.json`:

```json
{
  "oauth_config": {
    "scopes": {
      "bot": ["app_mentions:read", "chat:write"]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": ["app_mention"]
    },
    "socket_mode_enabled": true
  }
}
```

After saving, reinstall the app (OAuth & Permissions → Reinstall to Workspace) to pick up the new scope. Then restart `slack run`.

> If mentioning the app does nothing: (1) Confirm the app is in the channel — invite it with `/invite @Link Bookmarks`. (2) Check that your manifest includes both the `app_mentions:read` scope AND the `app_mention` event subscription — missing either one causes silent failure. (3) Make sure `slack run` is still active in your terminal.

### 10. Test it

In your workspace, invite the app to a channel (`/invite @Link Bookmarks`), then mention it:

```
@Link Bookmarks hello
```

The app responds with "Hello @yourname".

## Checkpoints

- [ ] `slack login` shows your workspace in `slack auth list`
- [ ] App appears in your workspace's app directory after manifest upload
- [ ] `slack init` creates a `.slack/` directory and links your app
- [ ] `npm install` completes without errors (includes `@slack/cli-hooks` in devDependencies)
- [ ] `slack run` prints "Link Bookmarks is running!" (app is inert at first — that's expected)
- [ ] After adding the event listener, scope, and subscription: mentioning the app produces a response

## Stretch goals

1. **Add a slash command**: Add a `/hello` command that responds with a greeting. You'll need to declare the command in `manifest.json` under `features.slash_commands`, add the `commands` scope to your bot scopes, and register a handler with `app.command('/hello', ...)`. Remember: `ack()` must be called within 3 seconds. See the [companion guide](../../posts/01/companion.md#add-a-slash-command) for the full walkthrough.

2. **Respond with Block Kit**: Replace the plain text response in your `app_mention` handler with a structured Block Kit message using `say({ blocks: [...] })`. The [Block Kit Builder](https://app.slack.com/block-kit-builder) lets you prototype layouts visually.

3. **Listen for a message pattern**: Subscribe to `message` events (requires `channels:history` scope and `message.channels` event subscription) and respond when someone says "bookmark" in a channel. Hint: use `app.message('bookmark', ...)`.

## Resources

- [Slack CLI quickstart](https://docs.slack.dev/quickstart)
- [Socket mode vs HTTP](https://docs.slack.dev/apis/events-api/comparing-http-socket-mode)
- [Bolt for JavaScript getting started](https://docs.slack.dev/tools/bolt-js/getting-started)
