#!/usr/bin/env node
/**
 * Restore the newest backup for each *.db file.
 * Usage:
 *   npm run db:restore                   # restore newest for each
 *   npm run db:restore -- vibechecker.db # restore newest for one
 *   npm run db:restore -- list           # show available backups
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  console.error('✗ no backups/ directory — nothing to restore');
  process.exit(1);
}

const args = process.argv.slice(2);
const backups = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.endsWith('.db'))
  .map(f => ({ f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
  .sort((a, b) => b.mtime - a.mtime);

if (args[0] === 'list') {
  if (backups.length === 0) { console.log('(no backups)'); process.exit(0); }
  for (const { f, mtime } of backups) {
    const size = fs.statSync(path.join(BACKUP_DIR, f)).size;
    console.log(`${new Date(mtime).toISOString()}  ${(size / 1024).toFixed(1).padStart(8)} KB  ${f}`);
  }
  process.exit(0);
}

const targets = args.length > 0 ? args : ['vibechecker.db', 'local.db'];

async function confirm(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(`${msg} [y/N] `, a => { rl.close(); res(a.trim().toLowerCase() === 'y'); }));
}

async function main() {
  for (const name of targets) {
    const newest = backups.find(b => b.f.endsWith(`__${name}`));
    if (!newest) { console.warn(`⚠  no backup found for ${name}`); continue; }
    const src = path.join(BACKUP_DIR, newest.f);
    const dst = path.join(ROOT, name);
    console.log(`◆ restore ${name} ← backups/${newest.f} (${new Date(newest.mtime).toISOString()})`);
    if (fs.existsSync(dst) && fs.statSync(dst).size > 0) {
      const ok = await confirm(`  ${name} already exists (${(fs.statSync(dst).size / 1024).toFixed(1)} KB). Overwrite?`);
      if (!ok) { console.log('  skipped.'); continue; }
      fs.copyFileSync(dst, `${dst}.pre-restore.${Date.now()}`);
    }
    fs.copyFileSync(src, dst);
    console.log(`  restored ✓`);
  }
}

main();
