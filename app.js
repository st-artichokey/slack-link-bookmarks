const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const bookmarks = [];

// app.event('app_mention', async ({ event, say }) => {
//   await say({ text: `Hello <@${event.user}>` });
// });

app.event('app_mention', async ({ event, client }) => {
  await client.reactions.add({
    channel: event.channel,
    timestamp: event.ts,
    name: 'wave'
  });
});


app.message('hello bot', async ({ message, say }) => {
  await say(`Hello, <@${message.user}>.`);
});

app.message('boop', async({ message, say }) => {
  await say({
      "type": "header",
      "text": { "type": "plain_text", "text": "Deployment Summary" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Environment:*\nProduction" },
        { "type": "mrkdwn", "text": "*Status:*\nComplete" }
      ]
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "Version `v2.4.1` deployed to all regions." },                                                 
      "accessory": {
        "type": "button",
        "text": { "type": "plain_text", "text": "View Logs" },
        "action_id": "view_deploy_logs",
        "url": "https://logs.example.com/deploys/latest"
      }
    },
    { "type": "divider" },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Rollback" },
          "action_id": "rollback_deploy",
          "style": "danger",
          "confirm": {
            "title": { "type": "plain_text", "text": "Confirm Rollback" },
            "text": { "type": "mrkdwn", "text": "This will revert production to the previous version." },
            "confirm": { "type": "plain_text", "text": "Rollback" },
            "deny": { "type": "plain_text", "text": "Cancel" }
          }
        }
      ]
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "Deployed by <@U123ABC> at 14:32 UTC" }
      ]
    })
})

app.command('/save-link', async ({ command, ack, respond }) => {
  await ack();
  const url = command.text.trim();
  if (!url) {
    await respond({ response_type: 'ephemeral', text: 'Usage: /save-link <url>' });
    return;
  }
  bookmarks.push({ userId: command.user_id, url, title: url });
  await respond({
    response_type: 'ephemeral',
    text: `Saved: <${url}>`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `Saved: <${url}>` } },
      { type: 'actions', elements: [
        { type: 'button', text: { type: 'plain_text', text: 'View Saved Links' }, action_id: 'view_saved_links' }
      ]}
    ]
  });
});

app.action('view_saved_links', async ({ body, ack, client }) => {
  await ack();
  const userBookmarks = bookmarks.filter(b => b.userId === body.user.id);
  const blocks = userBookmarks.length === 0
    ? [{ type: 'section', text: { type: 'mrkdwn', text: 'No bookmarks saved yet.' } }]
    : userBookmarks.map(b => ({
        type: 'section',
        text: { type: 'mrkdwn', text: `• <${b.url}|${b.title}>` }
      }));
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      title: { type: 'plain_text', text: 'Saved Links' },
      blocks
    }
  });
});

app.command('/delete-links', async ({ command, ack, body, client }) => {
  await ack();
  const userBookmarks = bookmarks.filter(b => b.userId === command.user_id);
  if (userBookmarks.length === 0) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'You have no saved links to delete.'
    });
    return;
  }
  const options = userBookmarks.map((b, i) => ({
    text: { type: 'plain_text', text: b.title.slice(0, 75) },
    value: String(i)
  }));
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'delete_links_modal',
      title: { type: 'plain_text', text: 'Delete Links' },
      blocks: [
        {
          type: 'input',
          block_id: 'links_to_delete',
          element: {
            type: 'checkboxes',
            action_id: 'selected_links',
            options
          },
          label: { type: 'plain_text', text: 'Select links to delete' }
        }
      ],
      submit: { type: 'plain_text', text: 'Delete' }
    }
  });
});

app.view('delete_links_modal', async ({ ack, view, body, client }) => {
  await ack();
  const selected = view.state.values.links_to_delete.selected_links.selected_options;
  const userBookmarks = bookmarks.filter(b => b.userId === body.user.id);
  const indexesToDelete = selected.map(opt => Number(opt.value));
  const urlsToDelete = indexesToDelete.map(i => userBookmarks[i].url);
  urlsToDelete.forEach(url => {
    const idx = bookmarks.findIndex(b => b.userId === body.user.id && b.url === url);
    if (idx !== -1) bookmarks.splice(idx, 1);
  });
  await client.chat.postMessage({
    channel: body.user.id,
    text: `Deleted ${urlsToDelete.length} link${urlsToDelete.length === 1 ? '' : 's'}.`
  });
});

app.command('/show-links', async ({ command, ack, respond }) => {
  await ack();
  const keyword = command.text.trim().toLowerCase();
  let userBookmarks = bookmarks.filter(b => b.userId === command.user_id);
  if (keyword) {
    userBookmarks = userBookmarks.filter(b =>
      b.url.toLowerCase().includes(keyword) || b.title.toLowerCase().includes(keyword)
    );
  }
  if (userBookmarks.length === 0) {
    const msg = keyword
      ? `No saved links matching "${keyword}".`
      : 'No saved links yet.';
    await respond({ response_type: 'ephemeral', text: msg });
    return;
  }
  const header = keyword ? `Links matching "${keyword}":` : 'Your saved links:';
  const list = userBookmarks.map(b => `• <${b.url}|${b.title}>`).join('\n');
  await respond({
    response_type: 'ephemeral',
    text: `${header}\n${list}`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `${header}\n${list}` } }
    ]
  });
});

(async () => {
  await app.start();
  console.log('Link Bookmarks is running!');
})();
