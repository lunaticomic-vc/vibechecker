import { createClient, type Client } from '@libsql/client';

const isDev = process.env.NODE_ENV !== 'production';
function dbLog(msg: string) {
  if (isDev) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`\x1b[2m${ts}\x1b[0m \x1b[36m◆\x1b[0m DB ${msg}`);
  }
}

let _client: Client | null = null;
let _initialized = false;

export function getDb(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL ?? 'file:vibechecker.db';
    dbLog(`Connecting to ${url.startsWith('libsql') ? 'Turso cloud' : 'local SQLite'} (${url.substring(0, 40)}...)`);
    _client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

export async function initDb(): Promise<Client> {
  const db = getDb();
  if (_initialized) return db;

  const isLocal = !(process.env.TURSO_DATABASE_URL?.startsWith('libsql'));
  if (isLocal) {
    await db.execute('PRAGMA foreign_keys = ON');
    await db.execute('PRAGMA journal_mode=WAL');
  }

  await db.batch([
    `CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('movie', 'tv', 'anime', 'youtube', 'substack', 'kdrama')),
      title TEXT NOT NULL,
      external_id TEXT,
      metadata TEXT,
      image_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS watch_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      favorite_id INTEGER REFERENCES favorites(id) ON DELETE CASCADE,
      current_season INTEGER DEFAULT 1,
      current_episode INTEGER DEFAULT 1,
      total_seasons INTEGER,
      total_episodes INTEGER,
      status TEXT DEFAULT 'watching' CHECK(status IN ('todo', 'watching', 'completed', 'dropped', 'on_hold')),
      stopped_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(favorite_id)
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL CHECK(platform IN ('letterboxd', 'youtube', 'myanimelist')),
      username TEXT NOT NULL,
      connected_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      favorite_id INTEGER NOT NULL REFERENCES favorites(id) ON DELETE CASCADE,
      rating TEXT NOT NULL CHECK(rating IN ('felt_things', 'enjoyed', 'watched', 'not_my_thing')),
      reasoning TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(favorite_id)
    )`,
    `CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS rejected_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(title, type)
    )`,
    `CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      photo_url TEXT,
      role TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TEXT,
      scope TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS ip_usage (
      ip TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      window_start TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS recommendation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      vibe TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY DEFAULT 1,
      content TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
  ]);

  // Create indexes
  await db.batch([
    'CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type)',
    'CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_watch_progress_favorite ON watch_progress(favorite_id)',
    'CREATE INDEX IF NOT EXISTS idx_ratings_favorite ON ratings(favorite_id)',
    'CREATE INDEX IF NOT EXISTS idx_rejected_title_type ON rejected_recommendations(title, type)',
    'CREATE INDEX IF NOT EXISTS idx_ip_usage_ip ON ip_usage(ip)',
    'CREATE INDEX IF NOT EXISTS idx_people_name ON people(name)',
    'CREATE INDEX IF NOT EXISTS idx_interests_name ON interests(name)',
    'CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform)',
  ]);

  // Migration: add window_start column to ip_usage if missing (table may predate the column)
  try {
    await db.execute(`ALTER TABLE ip_usage ADD COLUMN window_start TEXT DEFAULT (datetime('now'))`);
  } catch {
    // Column already exists — ignore
  }

  // Migration: ensure favorites type CHECK constraint includes 'substack' and 'kdrama'
  // Use sqlite_master to inspect the table definition instead of INSERT+DELETE probes
  const tableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='favorites'");
  const tableSql = (tableInfo.rows[0] as unknown as { sql: string })?.sql ?? '';

  if (!tableSql.includes("'substack'") || !tableSql.includes("'kdrama'")) {
    dbLog('Migrating favorites table to update type CHECK constraint...');
    await db.batch([
      `CREATE TABLE favorites_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('movie', 'tv', 'anime', 'youtube', 'substack', 'kdrama')),
        title TEXT NOT NULL,
        external_id TEXT,
        metadata TEXT,
        image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      `INSERT INTO favorites_new SELECT * FROM favorites`,
      `DROP TABLE favorites`,
      `ALTER TABLE favorites_new RENAME TO favorites`,
    ]);
    dbLog('Favorites table migrated ✓');
  }

  // Migration: add reason column to rejected_recommendations
  try {
    await db.execute('SELECT reason FROM rejected_recommendations LIMIT 1');
  } catch {
    try {
      await db.execute('ALTER TABLE rejected_recommendations ADD COLUMN reason TEXT');
      dbLog('Added reason column to rejected_recommendations ✓');
    } catch { /* already exists or other issue */ }
  }

  _initialized = true;
  dbLog('Tables initialized ✓');
  return db;
}

// Helper: ensure DB is initialized before any query
export async function db() {
  return initDb();
}

export default getDb;
