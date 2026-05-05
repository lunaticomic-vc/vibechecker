#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups');
const KEEP = 20;
const DB_FILES = ['vibechecker.db', 'local.db'];

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

for (const name of DB_FILES) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) continue;
  const { size } = fs.statSync(src);
  if (size === 0) continue;
  const dst = path.join(BACKUP_DIR, `${stamp}__${name}`);
  fs.copyFileSync(src, dst);
  console.log(`\x1b[2m◆ backup\x1b[0m ${name} → backups/${path.basename(dst)} (${(size / 1024).toFixed(1)} KB)`);
}

const entries = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.endsWith('.db'))
  .map(f => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

for (const { f } of entries.slice(KEEP)) {
  fs.unlinkSync(path.join(BACKUP_DIR, f));
}
