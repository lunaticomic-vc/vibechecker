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

  await db.batch([
    `CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('movie', 'tv', 'anime', 'youtube', 'substack')),
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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
    `CREATE TABLE IF NOT EXISTS oauth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TEXT,
      scope TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
  ]);

  // Migration: ensure 'substack' is in the favorites type CHECK constraint
  // SQLite can't ALTER CHECK constraints, so recreate the table if needed
  try {
    await db.execute("INSERT INTO favorites (type, title) VALUES ('substack', '__migration_test__')");
    await db.execute("DELETE FROM favorites WHERE title = '__migration_test__'");
  } catch {
    // CHECK constraint failed — need to recreate table
    dbLog('Migrating favorites table to add substack type...');
    await db.batch([
      `CREATE TABLE favorites_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('movie', 'tv', 'anime', 'youtube', 'substack')),
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

  _initialized = true;
  dbLog('Tables initialized ✓');
  return db;
}

// Helper: ensure DB is initialized before any query
export async function db() {
  return initDb();
}

export default getDb();
