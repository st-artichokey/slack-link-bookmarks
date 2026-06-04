# Stage 02 — Your App's Manifest

> Corresponds to: Post 02 — Your App's Manifest

## What you're building

No new runtime behavior in this stage — the app still responds to mentions the same way. You'll expand the manifest to flesh out Link Bookmarks' identity and understand the four sections that make up every Slack app manifest.

## What changed from the previous stage

Nothing yet — the manifest starts as you left it at the end of stage 01. You'll modify it as you go through the walkthrough.

## Prerequisites

- Stage 01 complete (app registered, tokens working, `slack run` succeeds)

## Walkthrough

### 1. Understand the four manifest sections

Open `manifest.json`. It has four top-level sections:

| Section | What it controls |
|---------|-----------------|
| `display_information` | App name, descriptions, branding — what users and reviewers see |
| `features` | Bot user, shortcuts, slash commands, App Home — interactive capabilities |
| `oauth_config` | Scopes — permissions your app requests |
| `settings` | Event subscriptions, interactivity, socket mode — runtime config |

Right now yours is minimal. As you work through this stage, you'll expand each section.

### 2. Update `display_information`

This is your app's identity — what users and marketplace reviewers see. Update your manifest's `display_information` section:

```json
{
  "display_information": {
    "name": "Link Bookmarks",
    "description": "Save and organize links from Slack messages",
    "long_description": "Link Bookmarks lets you save links from any Slack message into a personal collection. Browse, search, and share your saved links without leaving Slack.",
    "background_color": "#4A154B"
  }
}
```

| Field | Purpose |
|-------|---------|
| `name` | App name shown in Slack |
| `description` | Short description for the app directory |
| `long_description` | Extended description for marketplace listings |
| `background_color` | Hex color for branding |

### 3. Add a new scope

The article walks through adding `reactions:write` as an example. For Link Bookmarks, add the `commands` scope — you'll need it for the `/bookmarks` slash command in stage 05.

Update your `oauth_config`:

```json
{
  "oauth_config": {
    "scopes": {
      "bot": ["app_mentions:read", "chat:write", "commands"]
    }
  }
}
```

After updating, reinstall the app so Slack picks up the new permission: OAuth & Permissions → **Reinstall to Workspace**.

### 4. Enable interactivity

For buttons, shortcuts, and modals to work (stages 03–06), interactivity must be enabled. Add it to your `settings`:

```json
{
  "settings": {
    "event_subscriptions": {
      "bot_events": ["app_mention"]
    },
    "interactivity": {
      "is_enabled": true
    },
    "socket_mode_enabled": true
  }
}
```

### 5. Upload the updated manifest

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → select your app
2. Navigate to **App Manifest** in the sidebar
3. Replace the manifest contents with your updated version
4. Save changes

### 6. Verify

```bash
slack run
```

The app still responds to mentions. The manifest now declares your app's identity and has the foundation for features you'll add in upcoming stages.

**Check the dashboard:** Open your app's Basic Information page — you should see the description and background color reflected there.

## Checkpoints

- [ ] `display_information` includes name, description, long_description, and background_color
- [ ] `oauth_config` has three scopes: `app_mentions:read`, `chat:write`, `commands`
- [ ] `settings` includes `interactivity.is_enabled: true`
- [ ] Dashboard Basic Information page reflects your display info
- [ ] `slack run` still works — mentioning the app produces a response

## Stretch goals

1. **Add a scope you'll need later**: When the app shares a bookmark to a channel, it'll need to know which channels exist. Which scope would that require? (Hint: check the [conversations.list docs](https://docs.slack.dev/reference/methods/conversations.list).) Add it to the manifest and reinstall.

2. **Try manifest validation**: Run `slack manifest validate` from your project directory. Does it report any issues? Intentionally break the manifest (remove a required field) and run it again to see what validation catches.

## Resources

- [App manifest reference](https://docs.slack.dev/reference/app-manifest)
- [Scopes reference](https://docs.slack.dev/reference/scopes)
- [Configuring apps with manifests](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests)
