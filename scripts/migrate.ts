/**
 * Manual migrations. Run with: npx tsx scripts/migrate.ts
 *
 * Runtime (`src/lib/db.ts`) only creates tables/indexes if missing — it never
 * drops, renames, or backfills. Any schema change that requires those must be
 * executed here, explicitly, by a human.
 */
import { createClient } from '@libsql/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const url = process.env.TURSO_DATABASE_URL ?? 'file:vibechecker.db';
  const isLocal = !url.startsWith('libsql');

  console.log(`◆ migrate: target = ${url}`);

  if (isLocal) {
    const file = url.replace(/^file:/, '');
    if (fs.existsSync(file)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupDir = path.resolve('backups');
      fs.mkdirSync(backupDir, { recursive: true });
      const dst = path.join(backupDir, `${stamp}__pre-migrate__${path.basename(file)}`);
      fs.copyFileSync(file, dst);
      console.log(`◆ pre-migrate backup → ${path.relative(process.cwd(), dst)}`);
    }
  }

  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  if (isLocal) {
    await db.execute('PRAGMA foreign_keys = ON');
  }

  // ── Migration 1: ip_usage.window_start column ───────────────────────────
  const ipCols = await db.execute(`PRAGMA table_info(ip_usage)`);
  const hasWindowStart = ipCols.rows.some((r: any) => r.name === 'window_start');
  if (!hasWindowStart && ipCols.rows.length > 0) {
    console.log('◆ ip_usage: recreating with window_start');
    await db.execute(`DROP TABLE IF EXISTS ip_usage`);
    await db.execute(`CREATE TABLE IF NOT EXISTS ip_usage (
      ip TEXT PRIMARY KEY,
      count INTEGER DEFAULT 0,
      window_start TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
  }

  // ── Migration 2: favorites.type CHECK constraint ────────────────────────
  const tableInfo = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='favorites'");
  const tableSql = (tableInfo.rows[0] as unknown as { sql: string })?.sql ?? '';
  const needed = ["'substack'", "'kdrama'", "'podcast'", "'game'", "'research'"];
  const missing = needed.filter(n => !tableSql.includes(n));

  if (tableSql && missing.length > 0) {
    console.log(`◆ favorites: rebuilding type CHECK (missing: ${missing.join(', ')})`);
    await db.execute('PRAGMA foreign_keys = OFF');
    await db.batch([
      `CREATE TABLE favorites_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('movie', 'tv', 'anime', 'youtube', 'substack', 'kdrama', 'research', 'poetry', 'short_story', 'book', 'essay', 'podcast', 'manga', 'comic', 'game')),
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
    await db.execute('PRAGMA foreign_keys = ON');

    // Backfill watch_progress rows orphaned by the rebuild
    const orphaned = await db.execute(
      `SELECT f.id FROM favorites f LEFT JOIN watch_progress wp ON wp.favorite_id = f.id WHERE wp.id IS NULL`
    );
    if (orphaned.rows.length > 0) {
      console.log(`◆ watch_progress: backfilling ${orphaned.rows.length} orphaned entries`);
      await db.batch(orphaned.rows.map((r: any) => ({
        sql: `INSERT OR IGNORE INTO watch_progress (favorite_id, status) VALUES (?, 'watching')`,
        args: [r.id as number],
      })));
    }
  }

  // ── Migration 3: rejected_recommendations.reason column ─────────────────
  try {
    await db.execute('SELECT reason FROM rejected_recommendations LIMIT 1');
  } catch {
    console.log('◆ rejected_recommendations: adding reason column');
    try { await db.execute('ALTER TABLE rejected_recommendations ADD COLUMN reason TEXT'); } catch { /* already exists */ }
  }

  // ── Migration 4: watch_progress UNIQUE(favorite_id) ─────────────────────
  // The runtime schema declares UNIQUE(favorite_id), but the production
  // table predates that constraint. Without it, `INSERT ... ON CONFLICT
  // (favorite_id) DO UPDATE` in updateProgress fails ("does not match any
  // PRIMARY KEY or UNIQUE constraint"), so PATCH /api/progress was a silent
  // 500 — Drop/Done buttons looked dead and the row stayed at 'watching'.
  const wpSql = await db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='watch_progress'");
  const wpDef = (wpSql.rows[0] as unknown as { sql: string })?.sql ?? '';
  const wpIdx = await db.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='watch_progress' AND sql LIKE '%UNIQUE%'");
  const hasUnique = wpDef.toUpperCase().includes('UNIQUE') || wpIdx.rows.length > 0;

  if (wpDef && !hasUnique) {
    console.log('◆ watch_progress: adding UNIQUE(favorite_id) constraint');

    const dups = await db.execute(
      `SELECT favorite_id, COUNT(*) as n FROM watch_progress GROUP BY favorite_id HAVING n > 1`
    );
    if (dups.rows.length > 0) {
      console.log(`  deduping ${dups.rows.length} favorite_id collisions (keeping lowest id per favorite)`);
      await db.execute(
        `DELETE FROM watch_progress WHERE id NOT IN (SELECT MIN(id) FROM watch_progress GROUP BY favorite_id)`
      );
    }

    // Atomic batch — if any step fails, the whole rebuild rolls back. No
    // other table references watch_progress, so the DROP is safe without
    // disabling foreign keys (PRAGMA inside a transaction is a no-op).
    await db.batch([
      `CREATE TABLE watch_progress_new (
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
      `INSERT INTO watch_progress_new (id, favorite_id, current_season, current_episode, total_seasons, total_episodes, status, stopped_at, updated_at)
       SELECT id, favorite_id, current_season, current_episode, total_seasons, total_episodes, status, stopped_at, updated_at FROM watch_progress`,
      `DROP TABLE watch_progress`,
      `ALTER TABLE watch_progress_new RENAME TO watch_progress`,
      `CREATE INDEX IF NOT EXISTS idx_watch_progress_favorite ON watch_progress(favorite_id)`,
      `CREATE INDEX IF NOT EXISTS idx_watch_progress_updated ON watch_progress(updated_at DESC)`,
    ]);
    console.log('  ✓ watch_progress rebuilt with UNIQUE(favorite_id)');
  }

  console.log('◆ migrate: done ✓');
}

main().catch(err => {
  console.error('✗ migrate failed:', err);
  process.exit(1);
});
