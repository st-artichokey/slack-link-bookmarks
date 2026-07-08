const { App } = require('@slack/bolt');
const fs = require('fs');
const path = require('path');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const DB_PATH = path.join(__dirname, 'bookmarks.db');

const DEFAULT_PREFERENCES = { sortOrder: 'newest' };

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify({ bookmarks, preferences }, null, 2));
}

const db = loadDb();
const bookmarks = db.bookmarks || [];
const preferences = db.preferences || {};

function getPreferences(userId) {
  return { ...DEFAULT_PREFERENCES, ...preferences[userId] };
}

function savePreferences(userId, prefs) {
  preferences[userId] = { ...getPreferences(userId), ...prefs };
  saveDb();
}

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

app.message('share links', async ({ message, client }) => {
  const userBookmarks = bookmarks.filter(b => b.userId === message.user);

  if (userBookmarks.length === 0) {
    await client.chat.postEphemeral({
      channel: message.channel,
      user: message.user,
      text: 'You have no saved links to share. Use /save-link <url> to add one.'
    });
    return;
  }

  const count = userBookmarks.length;
  const linkList = userBookmarks.map(b => `• <${b.url}|${b.title}>`).join('\n');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: ':link: Shared Links' }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Shared by <@${message.user}> · ${count} link${count === 1 ? '' : 's'}`
        }
      ]
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: linkList }
    }
  ];

  await client.chat.postMessage({
    channel: message.channel,
    blocks,
    text: `<@${message.user}> shared ${count} link${count === 1 ? '' : 's'}`
  });
});

function sortBookmarks(userBookmarks, sortOrder) {
  if (sortOrder === 'alphabetical') {
    return [...userBookmarks].sort((a, b) => a.title.localeCompare(b.title));
  }
  return [...userBookmarks].reverse();
}

function buildHomeView(userId) {
  const { sortOrder } = getPreferences(userId);
  const userBookmarks = bookmarks.filter(b => b.userId === userId);
  const sortLabel = sortOrder === 'alphabetical' ? 'A–Z' : 'Newest first';
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: ':link: Your Saved Links' }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${userBookmarks.length} saved link${userBookmarks.length === 1 ? '' : 's'} · Sorted by ${sortLabel}`
        }
      ]
    },
    { type: 'divider' }
  ];

  const actionElements = [];
  if (userBookmarks.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: 'You have no saved links yet. Save your first with `/save-link <url>`.' }
    });
  } else {
    sortBookmarks(userBookmarks, sortOrder).forEach(b => {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `• <${b.url}|${b.title}>` }
      });
    });
    actionElements.push(
      { type: 'button', text: { type: 'plain_text', text: 'View Saved Links' }, action_id: 'view_saved_links' },
      { type: 'button', text: { type: 'plain_text', text: 'Delete Links' }, style: 'danger', action_id: 'open_delete_modal' }
    );
  }
  actionElements.push({ type: 'button', text: { type: 'plain_text', text: 'Settings' }, action_id: 'open_settings' });

  blocks.push({ type: 'actions', elements: actionElements });

  return { type: 'home', blocks };
}

async function publishHomeView(client, userId) {
  await client.views.publish({
    user_id: userId,
    view: buildHomeView(userId)
  });
}

app.event('app_home_opened', async ({ event, client }) => {
  if (event.tab !== 'home') return;
  await publishHomeView(client, event.user);
});

const SORT_OPTIONS = [
  { text: { type: 'plain_text', text: 'Newest first' }, value: 'newest' },
  { text: { type: 'plain_text', text: 'Alphabetical (A–Z)' }, value: 'alphabetical' }
];

app.action('open_settings', async ({ body, ack, client }) => {
  await ack();
  const { sortOrder } = getPreferences(body.user.id);
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'settings_modal',
      title: { type: 'plain_text', text: 'Settings' },
      blocks: [
        {
          type: 'input',
          block_id: 'sort_order',
          element: {
            type: 'static_select',
            action_id: 'sort_select',
            initial_option: SORT_OPTIONS.find(o => o.value === sortOrder),
            options: SORT_OPTIONS
          },
          label: { type: 'plain_text', text: 'Sort links by' }
        }
      ],
      submit: { type: 'plain_text', text: 'Save' }
    }
  });
});

app.view('settings_modal', async ({ ack, view, body, client }) => {
  await ack();
  const sortOrder = view.state.values.sort_order.sort_select.selected_option.value;
  savePreferences(body.user.id, { sortOrder });
  await publishHomeView(client, body.user.id);
});

app.command('/save-link', async ({ command, ack, respond, client }) => {
  await ack();
  const url = command.text.trim();
  if (!url) {
    await respond({ response_type: 'ephemeral', text: 'Usage: /save-link <url>' });
    return;
  }
  bookmarks.push({ userId: command.user_id, url, title: url });
  saveDb();
  await publishHomeView(client, command.user_id);
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

function buildSavedLinksModal(userId) {
  const userBookmarks = bookmarks.filter(b => b.userId === userId);
  const blocks = userBookmarks.length === 0
    ? [{ type: 'section', text: { type: 'mrkdwn', text: 'No bookmarks saved yet.' } }]
    : userBookmarks.map(b => ({
        type: 'section',
        text: { type: 'mrkdwn', text: `• <${b.url}|${b.title}>` }
      }));
  return {
    type: 'modal',
    title: { type: 'plain_text', text: 'Saved Links' },
    blocks
  };
}

app.action('view_saved_links', async ({ body, ack, client }) => {
  await ack();
  await client.views.open({
    trigger_id: body.trigger_id,
    view: buildSavedLinksModal(body.user.id)
  });
});

app.shortcut('show_saved_links', async ({ shortcut, ack, client }) => {
  await ack();
  await client.views.open({
    trigger_id: shortcut.trigger_id,
    view: buildSavedLinksModal(shortcut.user.id)
  });
});

app.shortcut('add_links', async ({ shortcut, ack, client }) => {
  await ack();
  await client.views.open({
    trigger_id: shortcut.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'add_links_modal',
      title: { type: 'plain_text', text: 'Add Links' },
      blocks: [
        {
          type: 'input',
          block_id: 'links_to_add',
          element: {
            type: 'plain_text_input',
            action_id: 'links_input',
            multiline: true
          },
          label: { type: 'plain_text', text: 'Paste one link per line' }
        }
      ],
      submit: { type: 'plain_text', text: 'Save' }
    }
  });
});

app.view('add_links_modal', async ({ ack, view, body }) => {
  const raw = view.state.values.links_to_add.links_input.value || '';
  const urls = raw.split('\n').map(u => u.trim()).filter(Boolean);
  urls.forEach(url => {
    bookmarks.push({ userId: body.user.id, url, title: url });
  });
  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      title: { type: 'plain_text', text: 'Add Links' },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Saved ${urls.length} link${urls.length === 1 ? '' : 's'}.` }
        }
      ]
    }
  });
});

function buildDeleteModalView(userId) {
  const userBookmarks = bookmarks.filter(b => b.userId === userId);
  const options = userBookmarks.map((b, i) => ({
    text: { type: 'plain_text', text: b.title.slice(0, 75) },
    value: String(i)
  }));
  return {
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
  };
}

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
  await client.views.open({
    trigger_id: body.trigger_id,
    view: buildDeleteModalView(command.user_id)
  });
});

app.action('open_delete_modal', async ({ body, ack, client }) => {
  await ack();
  const userBookmarks = bookmarks.filter(b => b.userId === body.user.id);
  if (userBookmarks.length === 0) return;
  await client.views.open({
    trigger_id: body.trigger_id,
    view: buildDeleteModalView(body.user.id)
  });
});

app.view('delete_links_modal', async ({ ack, view, body, client }) => {
  const selected = view.state.values.links_to_delete.selected_links.selected_options;
  const userBookmarks = bookmarks.filter(b => b.userId === body.user.id);
  const indexesToDelete = selected.map(opt => Number(opt.value));
  const urlsToDelete = indexesToDelete.map(i => userBookmarks[i].url);
  urlsToDelete.forEach(url => {
    const idx = bookmarks.findIndex(b => b.userId === body.user.id && b.url === url);
    if (idx !== -1) bookmarks.splice(idx, 1);
  });
  saveDb();
  await publishHomeView(client, body.user.id);
  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      title: { type: 'plain_text', text: 'Delete Links' },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Deleted ${urlsToDelete.length} link${urlsToDelete.length === 1 ? '' : 's'}.` }
        }
      ]
    }
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
