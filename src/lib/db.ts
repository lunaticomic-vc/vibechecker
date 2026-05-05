import { createClient, type Client } from '@libsql/client';

const isDev = process.env.NODE_ENV !== 'production';
function dbLog(msg: string) {
  if (isDev) {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`\x1b[2m${ts}\x1b[0m \x1b[36m◆\x1b[0m DB ${msg}`);
  }
}

let _client: Client | null = null;
// Cache the init promise so concurrent cold-start requests share a single migration pass
// instead of racing. Previous behavior could fire DROP TABLE favorites twice.
let _initPromise: Promise<Client> | null = null;

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
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const db = getDb();
    await runInit(db);
    return db;
  })();
  try {
    return await _initPromise;
  } catch (err) {
    // Reset on failure so a retry can try again
    _initPromise = null;
    throw err;
  }
}

async function runInit(db: Client): Promise<void> {
  // RUNTIME INIT IS STRICTLY NON-DESTRUCTIVE.
  // Only `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` are
  // permitted here. Any schema change that requires DROP / ALTER / RENAME /
  // INSERT-SELECT / orphan backfill MUST live in `scripts/migrate.ts` and be
  // run manually (`npm run migrate`). This prevents automated migrations from
  // silently nuking data on cold starts. See previous incident: commit 214dc55.

  const isLocal = !(process.env.TURSO_DATABASE_URL?.startsWith('libsql'));
  if (isLocal) {
    await db.execute('PRAGMA foreign_keys = ON');
    await db.execute('PRAGMA journal_mode=WAL');
  }

  await db.batch([
    `CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('movie', 'tv', 'anime', 'youtube', 'substack', 'kdrama', 'research', 'poetry', 'short_story', 'book', 'essay', 'podcast', 'manga', 'comic', 'game')),
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
  // Note: idx_people_name, idx_interests_name, idx_ip_usage_ip are redundant (UNIQUE/PK columns
  // already have an implicit index) but kept here for compatibility with existing DBs.
  await db.batch([
    'CREATE INDEX IF NOT EXISTS idx_favorites_type ON favorites(type)',
    'CREATE INDEX IF NOT EXISTS idx_favorites_created ON favorites(created_at)',
    'CREATE INDEX IF NOT EXISTS idx_watch_progress_favorite ON watch_progress(favorite_id)',
    'CREATE INDEX IF NOT EXISTS idx_watch_progress_updated ON watch_progress(updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_ratings_favorite ON ratings(favorite_id)',
    'CREATE INDEX IF NOT EXISTS idx_rejected_title_type ON rejected_recommendations(title, type)',
    'CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform)',
    'CREATE INDEX IF NOT EXISTS idx_rec_history_created ON recommendation_history(created_at DESC)',
  ]);

  dbLog('Tables initialized ✓');
}

// Helper: ensure DB is initialized before any query
export async function db() {
  return initDb();
}

export default getDb;
