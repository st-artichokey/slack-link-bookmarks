const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.event('app_mention', async ({ event, say }) => {
  await say(`Hey <@${event.user}>! Link Bookmarks is ready. In upcoming stages, you'll be able to save links from any message.`);
});

(async () => {
  await app.start();
  console.log('Link Bookmarks is running!');
})();
