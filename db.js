const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_PREFERENCES = { sortOrder: 'newest', notifications: true };

const db = new Database(path.join(__dirname, 'bookmarks.sqlite3'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS preferences (
    user_id TEXT PRIMARY KEY,
    sort_order TEXT NOT NULL DEFAULT 'newest',
    notifications INTEGER NOT NULL DEFAULT 1
  );
`);

// Single seam for all database access: reads return { rows },
// writes return change metadata.
function query(text, params = []) {
  const stmt = db.prepare(text);
  if (stmt.reader) {
    return { rows: stmt.all(...params) };
  }
  const info = stmt.run(...params);
  return { rows: [], changes: info.changes, lastInsertRowid: info.lastInsertRowid };
}

function getUserBookmarks(userId) {
  return query(
    'SELECT id, url, title, updated_at AS updatedAt FROM bookmarks WHERE user_id = ? ORDER BY id',
    [userId]
  ).rows;
}

function addBookmark(userId, url, title) {
  query('INSERT INTO bookmarks (user_id, url, title, updated_at) VALUES (?, ?, ?, ?)', [
    userId, url, title, Date.now()
  ]);
}

function updateBookmark(id, title, url) {
  query('UPDATE bookmarks SET title = ?, url = ?, updated_at = ? WHERE id = ?', [
    title, url, Date.now(), id
  ]);
}

function deleteBookmark(id) {
  query('DELETE FROM bookmarks WHERE id = ?', [id]);
}

function getLastUpdateTime(userId) {
  const { rows } = query('SELECT MAX(updated_at) AS latest FROM bookmarks WHERE user_id = ?', [userId]);
  return rows[0].latest || 0;
}

function getPreferences(userId) {
  const { rows } = query(
    'SELECT sort_order AS sortOrder, notifications FROM preferences WHERE user_id = ?',
    [userId]
  );
  if (rows.length === 0) return { ...DEFAULT_PREFERENCES };
  return { sortOrder: rows[0].sortOrder, notifications: !!rows[0].notifications };
}

function savePreferences(userId, prefs) {
  const merged = { ...getPreferences(userId), ...prefs };
  query(
    `INSERT INTO preferences (user_id, sort_order, notifications) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET sort_order = excluded.sort_order, notifications = excluded.notifications`,
    [userId, merged.sortOrder, merged.notifications ? 1 : 0]
  );
}

module.exports = {
  getUserBookmarks,
  addBookmark,
  updateBookmark,
  deleteBookmark,
  getLastUpdateTime,
  getPreferences,
  savePreferences,
};
