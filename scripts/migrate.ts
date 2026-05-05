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

  console.log('◆ migrate: done ✓');
}

main().catch(err => {
  console.error('✗ migrate failed:', err);
  process.exit(1);
});
