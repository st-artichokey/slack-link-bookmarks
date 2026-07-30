const { App } = require('@slack/bolt');
const {
  getUserBookmarks,
  addBookmark,
  updateBookmark,
  deleteBookmark,
  getLastUpdateTime,
  getPreferences,
  savePreferences,
} = require('./db');
const { retryPolicies } = require('@slack/web-api');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  clientOptions: { retryConfig: retryPolicies.fiveRetriesInFiveMinutes },
});

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


async function shareLinks(client, userId, channel) {
  const userBookmarks = getUserBookmarks(userId);

  if (userBookmarks.length === 0) {
    await client.chat.postEphemeral({
      channel,
      user: userId,
      text: 'You have no saved links to share. Use /save-link <url> to add one.'
    });
    return;
  }

  const count = userBookmarks.length;
  const linkList = userBookmarks.map(b => `• <${b.url}|${b.title}>`).join('\n');

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: ':link: Shared Links' } },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `Shared by <@${userId}> · ${count} link${count === 1 ? '' : 's'}`
      }]
    },
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: linkList } }
  ];

  await client.chat.postMessage({
    channel,
    blocks,
    text: `<@${userId}> shared ${count} link${count === 1 ? '' : 's'}`
  });
}

// A URL here is untrusted DM input, so we only treat http(s) and www. tokens as
// links to save — everything else routes to the help reply rather than being
// stored. Slack auto-links URLs in messages as <url> or <url|label>, so strip
// that markup (keeping the url, dropping the label) before matching. Bare www.
// tokens are prefixed with https:// so the stored link stays clickable.
function extractUrls(text) {
  const unwrapped = (text || '').replace(/<(https?:\/\/[^|>]+)(\|[^>]*)?>/gi, '$1');
  return parseLinks(unwrapped)
    .filter(u => /^(https?:\/\/|www\.)/i.test(u))
    .map(u => (/^www\./i.test(u) ? `https://${u}` : u));
}

// Single router for the Messages tab. bot_id/subtype guards drop the bot's own
// replies (and edits/deletes) so we don't answer ourselves in a loop. Exactly
// one branch responds, avoiding the overlapping-listener double-reply.
app.event('message', async ({ event, client }) => {
  if (event.channel_type !== 'im' || event.bot_id || event.subtype) return;

  const text = (event.text || '').trim();
  const urls = extractUrls(text);

  if (urls.length > 0) {
    urls.forEach(url => addBookmark(event.user, url, url));
    await publishHomeView(client, event.user);
    await client.chat.postMessage({ channel: event.channel, ...savedConfirmationBlocks(urls.length) });
    return;
  }

  if (text.toLowerCase() === 'share links') {
    await shareLinks(client, event.user, event.channel);
    return;
  }

  await client.chat.postMessage({
    channel: event.channel,
    text: 'Send me a URL to save it, or type `share links` to post your collection. You can manage everything from the Home tab.'
  });
});

function parseLinks(raw) {
  return (raw || '').split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
}

function savedConfirmationBlocks(count) {
  const summary = `Saved ${count} link${count === 1 ? '' : 's'}.`;
  return {
    text: summary,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: summary } },
      { type: 'actions', elements: [
        { type: 'button', text: { type: 'plain_text', text: 'View Saved Links' }, action_id: 'view_saved_links' }
      ]}
    ]
  };
}

function sortBookmarks(userBookmarks, sortOrder) {
  if (sortOrder === 'alphabetical') {
    return [...userBookmarks].sort((a, b) => a.title.localeCompare(b.title));
  }
  return [...userBookmarks].reverse();
}

async function publishHomeView(client, userId, activeTab = 'overview') {
  await client.views.publish({
    user_id: userId,
    view: { type: 'home', blocks: buildTabbedHome(activeTab, userId) }
  });
}

app.event('app_home_opened', async ({ event, client }) => {
  if (event.tab !== 'home') return;

  const lastUpdate = await getLastUpdateTime(event.user);
  const stateChanged = await hasStateChanged(event.user, lastUpdate);

  if (!event.view || stateChanged) {
    await publishHomeView(client, event.user);
  }
});

const lastSeenUpdate = {};

function hasStateChanged(userId, lastUpdate) {
  const changed = lastUpdate > (lastSeenUpdate[userId] || 0);
  lastSeenUpdate[userId] = lastUpdate;
  return changed;
}


const SORT_OPTIONS = [
  { text: { type: 'plain_text', text: 'Newest first' }, value: 'newest' },
  { text: { type: 'plain_text', text: 'Alphabetical (A–Z)' }, value: 'alphabetical' }
];

const NOTIFICATION_OPTIONS = [
  { text: { type: 'plain_text', text: 'On' }, value: 'on' },
  { text: { type: 'plain_text', text: 'Off' }, value: 'off' }
];

app.action('open_settings', async ({ body, ack, client }) => {
  await ack();
  const { sortOrder, notifications } = getPreferences(body.user.id);
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
        },
        {
          type: 'input',
          block_id: 'notifications',
          element: {
            type: 'static_select',
            action_id: 'notifications_select',
            initial_option: NOTIFICATION_OPTIONS.find(o => o.value === (notifications ? 'on' : 'off')),
            options: NOTIFICATION_OPTIONS
          },
          label: { type: 'plain_text', text: 'Notifications' }
        }
      ],
      submit: { type: 'plain_text', text: 'Save' }
    }
  });
});

app.view('settings_modal', async ({ ack, view, body, client }) => {
  await ack();
  const sortOrder = view.state.values.sort_order.sort_select.selected_option.value;
  const notifications = view.state.values.notifications.notifications_select.selected_option.value === 'on';
  savePreferences(body.user.id, { sortOrder, notifications });
  await publishHomeView(client, body.user.id);
});

app.command('/save-link', async ({ command, ack, respond, client }) => {
  await ack();
  const urls = parseLinks(command.text);
  if (urls.length === 0) {
    await respond({ response_type: 'ephemeral', text: 'Usage: /save-link <url>[, <url>, ...]' });
    return;
  }
  urls.forEach(url => addBookmark(command.user_id, url, url));
  await publishHomeView(client, command.user_id);
  await respond({ response_type: 'ephemeral', ...savedConfirmationBlocks(urls.length) });
});

function buildSavedLinksModal(userId) {
  const userBookmarks = getUserBookmarks(userId);
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
          label: { type: 'plain_text', text: 'Paste links separated by commas or new lines' }
        }
      ],
      submit: { type: 'plain_text', text: 'Save' }
    }
  });
});

app.view('add_links_modal', async ({ ack, view, body, client }) => {
  const urls = parseLinks(view.state.values.links_to_add.links_input.value);
  urls.forEach(url => addBookmark(body.user.id, url, url));
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
  await publishHomeView(client, body.user.id);
});

function buildEditModalView(userId) {
  const userBookmarks = getUserBookmarks(userId);
  if (userBookmarks.length === 0) {
    return {
      type: 'modal',
      title: { type: 'plain_text', text: 'Edit Saved Links' },
      blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'No saved links to edit yet.' } }]
    };
  }
  const blocks = [];
  userBookmarks.forEach((b, i) => {
    if (i > 0) blocks.push({ type: 'divider' });
    blocks.push(
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `*${b.title}* · <${b.url}>` }]
      },
      {
        type: 'input',
        block_id: `title_${b.id}`,
        element: {
          type: 'plain_text_input',
          action_id: 'title_input',
          initial_value: b.title
        },
        label: { type: 'plain_text', text: 'Title' }
      },
      {
        type: 'input',
        block_id: `url_${b.id}`,
        element: {
          type: 'plain_text_input',
          action_id: 'url_input',
          initial_value: b.url
        },
        label: { type: 'plain_text', text: 'URL' }
      }
    );
  });
  return {
    type: 'modal',
    callback_id: 'edit_links_modal',
    title: { type: 'plain_text', text: 'Edit Saved Links' },
    blocks,
    submit: { type: 'plain_text', text: 'Save' }
  };
}

function buildDeleteModalView(userId) {
  const userBookmarks = getUserBookmarks(userId);
  const options = userBookmarks.map(b => ({
    text: { type: 'plain_text', text: b.title.slice(0, 75) },
    value: String(b.id)
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
  const userBookmarks = getUserBookmarks(command.user_id);
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
  const userBookmarks = getUserBookmarks(body.user.id);
  if (userBookmarks.length === 0) return;
  await client.views.open({
    trigger_id: body.trigger_id,
    view: buildDeleteModalView(body.user.id)
  });
});

app.view('delete_links_modal', async ({ ack, view, body, client }) => {
  const selected = view.state.values.links_to_delete.selected_links.selected_options;
  selected.forEach(opt => deleteBookmark(Number(opt.value)));
  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      title: { type: 'plain_text', text: 'Delete Links' },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Deleted ${selected.length} link${selected.length === 1 ? '' : 's'}.` }
        }
      ]
    }
  });
  await publishHomeView(client, body.user.id);
});

app.action('open_edit_modal', async ({ body, ack, client }) => {
  await ack();
  const userBookmarks = getUserBookmarks(body.user.id);
  if (userBookmarks.length === 0) return;
  await client.views.open({
    trigger_id: body.trigger_id,
    view: buildEditModalView(body.user.id)
  });
});

app.view('edit_links_modal', async ({ ack, view, body, client }) => {
  const userBookmarks = getUserBookmarks(body.user.id);
  userBookmarks.forEach(b => {
    const title = view.state.values[`title_${b.id}`].title_input.value.trim();
    const url = view.state.values[`url_${b.id}`].url_input.value.trim();
    updateBookmark(b.id, title, url);
  });
  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      title: { type: 'plain_text', text: 'Edit Saved Links' },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `Updated ${userBookmarks.length} link${userBookmarks.length === 1 ? '' : 's'}.` }
        }
      ]
    }
  });
  await publishHomeView(client, body.user.id);
});

app.command('/show-links', async ({ command, ack, respond }) => {
  await ack();
  const keyword = command.text.trim().toLowerCase();
  let userBookmarks = getUserBookmarks(command.user_id);
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

function buildOverviewBlocks(userId) {
  const { sortOrder } = getPreferences(userId);
  const userBookmarks = getUserBookmarks(userId);
  const sortLabel = sortOrder === 'alphabetical' ? 'A–Z' : 'Newest first';
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: ':link: Your Saved Links' } },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `${userBookmarks.length} saved link${userBookmarks.length === 1 ? '' : 's'} · Sorted by ${sortLabel}`
      }]
    }
  ];
  if (userBookmarks.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: 'You have no saved links yet. Save your first with `/save-link <url>`.' }
    });
  } else {
    sortBookmarks(userBookmarks, sortOrder).forEach(b => {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `• <${b.url}|${b.title}>` } });
    });
    blocks.push({
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: 'Edit Saved Links' }, action_id: 'open_edit_modal' },
        { type: 'button', text: { type: 'plain_text', text: 'Delete Links' }, style: 'danger', action_id: 'open_delete_modal' }
      ]
    });
  }
  return blocks;
}

function buildActivityBlocks(userId) {
  const userBookmarks = getUserBookmarks(userId);
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: 'Recent Activity' } }
  ];
  const recentActivity = [...userBookmarks].reverse().slice(0, 10);
  if (recentActivity.length === 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: 'No activity yet. Save a link with `/save-link <url>` to see it here.' }
    });
  } else {
    recentActivity.forEach(b => {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `• Saved <${b.url}|${b.title}>` } });
    });
  }
  return blocks;
}

function buildSettingsBlocks(userId) {
  const { sortOrder, notifications } = getPreferences(userId);
  const sortLabel = sortOrder === 'alphabetical' ? 'A–Z' : 'Newest first';
  return [
    { type: 'header', text: { type: 'plain_text', text: 'Settings' } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Sort links by:* ${sortLabel}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Notifications:* ${notifications ? 'On' : 'Off'}` } },
    {
      type: 'actions',
      elements: [
        { type: 'button', text: { type: 'plain_text', text: 'Edit Settings' }, action_id: 'open_settings' }
      ]
    }
  ];
}

function buildTabbedHome(activeTab, userId) {
  const tabs = ['overview', 'activity', 'settings'];
  const tabButtons = tabs.map(tab => ({
    type: 'button',
    text: { type: 'plain_text', text: tab.charAt(0).toUpperCase() + tab.slice(1) },
    action_id: `home_tab_${tab}`,
    ...(tab === activeTab ? { style: 'primary' } : {})
  }));

  const blocks = [
    { type: 'actions', elements: tabButtons },
    { type: 'divider' }
  ];

  switch (activeTab) {
    case 'overview':
      blocks.push(...buildOverviewBlocks(userId));
      break;
    case 'activity':
      blocks.push(...buildActivityBlocks(userId));
      break;
    case 'settings':
      blocks.push(...buildSettingsBlocks(userId));
      break;
  }

  return blocks;
}

// Handle tab switching
app.action(/^home_tab_/, async ({ action, body, ack, client }) => {
  await ack();
  const tab = action.action_id.replace('home_tab_', '');
  await client.views.publish({
    user_id: body.user.id,
    view: { type: 'home', blocks: buildTabbedHome(tab, body.user.id) }
  });
});

(async () => {
  await app.start();
  console.log('Link Bookmarks is running!');
})();
