# Stage 02 — Your App's Manifest

> Corresponds to: Post 02 — Your App's Manifest

## What you're building

No new runtime behavior in this stage — the app still responds to mentions the same way. What changes is the manifest: you'll expand it to declare all the scopes, features, and event subscriptions that Link Bookmarks will use throughout the series. This is the planning phase for your app's contract with Slack.

## What changed from the previous stage

- `manifest.json` — expanded from 2 scopes to the full set; added shortcuts, slash command, App Home, interactivity, and display information
- `package.json` — version bump only

## Prerequisites

- Stage 01 complete (app registered, tokens working, `slack run` succeeds)

## Walkthrough

### 1. Review the expanded manifest

Open `manifest.json` and compare it to stage 01's version. The four top-level sections are:

| Section | What it controls |
|---------|-----------------|
| `display_information` | App name, descriptions, branding — what users and reviewers see |
| `features` | Bot user, shortcuts, slash commands, App Home — interactive capabilities |
| `oauth_config` | Scopes — permissions your app requests |
| `settings` | Event subscriptions, interactivity, socket mode — runtime config |

### 2. Understand each scope

| Scope | Why Link Bookmarks needs it |
|-------|----------------------------|
| `app_mentions:read` | Respond when users @-mention the app |
| `chat:write` | Post messages (confirmations, shared bookmarks) |
| `commands` | Register and respond to `/bookmarks` |
| `links:read` | Extract and unfurl link metadata from messages |

Every scope maps to a feature. Marketplace reviewers verify this — unused scopes cause rejection.

### 3. Understand each feature declaration

| Feature | Purpose in Link Bookmarks |
|---------|--------------------------|
| Message shortcut ("Save Links") | Primary save action — right-click a message to bookmark its links |
| Global shortcut ("Browse Bookmarks") | Quick access to browse/search from anywhere |
| `/bookmarks` command | Inline search without leaving the channel |
| App Home | Full bookmark dashboard with manage/delete/share |

### 4. Update your app's manifest in the dashboard

Copy the contents of this stage's `manifest.json` and update your app:

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → select your app
2. Navigate to **App Manifest** in the sidebar
3. Replace the manifest contents with this stage's version
4. Save changes

### 5. Reinstall the app

Adding scopes requires reinstallation:

1. Go to **OAuth & Permissions**
2. Click **Reinstall to Workspace**
3. Approve the updated permissions

### 6. Verify

```bash
slack run
```

The app still responds to mentions. The new features (shortcuts, command, App Home) are registered but have no handlers yet — that's stages 03–06.

## Checkpoints

- [ ] `manifest.json` has all four scopes (`app_mentions:read`, `chat:write`, `commands`, `links:read`)
- [ ] Dashboard shows the slash command `/bookmarks` under Features → Slash Commands
- [ ] Dashboard shows both shortcuts under Features → Interactivity & Shortcuts
- [ ] App Home tab is visible when you click the app in the sidebar (empty for now)
- [ ] `slack run` still works — mentioning the app produces a response

## Stretch goals

1. **Add a scope you'll need later**: When the app shares a bookmark to a channel, it'll need to know which channels exist. Which scope would that require? (Hint: check the [conversations.list docs](https://docs.slack.dev/reference/methods/conversations.list).) Add it to the manifest and reinstall.

2. **Try manifest validation**: Run `slack manifest validate` from your project directory. Does it report any issues? Intentionally break the manifest (remove a required field) and run it again to see what validation catches.

## Resources

- [App manifest reference](https://docs.slack.dev/reference/app-manifest)
- [Scopes reference](https://docs.slack.dev/reference/scopes)
- [Configuring apps with manifests](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests)
