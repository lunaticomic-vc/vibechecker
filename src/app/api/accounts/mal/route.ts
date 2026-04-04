import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { log } from '@/lib/logger';

// GET - check if MAL account is linked
export async function GET() {
  const client = await db();
  const result = await client.execute({ sql: "SELECT username FROM accounts WHERE platform = 'myanimelist' LIMIT 1", args: [] });
  const username = result.rows[0] ? (result.rows[0] as unknown as { username: string }).username : null;
  return NextResponse.json({ username });
}

// POST - save MAL username
export async function POST(req: Request) {
  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  const client = await db();
  log.db('SAVE MAL account', username);
  await client.execute({ sql: "DELETE FROM accounts WHERE platform = 'myanimelist'", args: [] });
  await client.execute({ sql: "INSERT INTO accounts (platform, username) VALUES ('myanimelist', ?)", args: [username] });
  return NextResponse.json({ username });
}

// DELETE - remove MAL account and all MAL-imported anime
export async function DELETE() {
  const client = await db();
  log.db('REMOVE MAL account + all MAL anime');

  // Delete all anime that came from MAL (have mal: external_id)
  const deleted = await client.execute("DELETE FROM favorites WHERE type = 'anime' AND external_id LIKE 'mal:%'");
  await client.execute("DELETE FROM accounts WHERE platform = 'myanimelist'");

  log.success(`Removed MAL account and ${deleted.rowsAffected} anime`);
  return NextResponse.json({ removed: Number(deleted.rowsAffected) });
}
