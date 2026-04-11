import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const client = await db();
    const result = await client.execute({ sql: "SELECT username FROM accounts WHERE platform = 'myanimelist' LIMIT 1", args: [] });
    const username = result.rows[0] ? (result.rows[0] as unknown as { username: string }).username : null;
    return NextResponse.json({ username });
  } catch (err) {
    log.error('Failed to fetch MAL account', err);
    return NextResponse.json({ error: 'Failed to fetch MAL account' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { username } = body;
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const client = await db();
    log.db('SAVE MAL account', username);
    // Atomic upsert — previously DELETE + INSERT was two round trips and non-atomic
    await client.execute({
      sql: `INSERT INTO accounts (platform, username, connected_at) VALUES ('myanimelist', ?, datetime('now'))
            ON CONFLICT(platform) DO UPDATE SET username = excluded.username, connected_at = datetime('now')`,
      args: [username],
    });
    return NextResponse.json({ username });
  } catch (err) {
    log.error('Failed to save MAL account', err);
    return NextResponse.json({ error: 'Failed to save MAL account' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await db();
    log.db('REMOVE MAL account + all MAL anime');

    const deleted = await client.execute("DELETE FROM favorites WHERE type = 'anime' AND external_id LIKE 'mal:%'");
    await client.execute("DELETE FROM accounts WHERE platform = 'myanimelist'");

    log.success(`Removed MAL account and ${deleted.rowsAffected} anime`);
    return NextResponse.json({ removed: Number(deleted.rowsAffected) });
  } catch (err) {
    log.error('Failed to remove MAL account', err);
    return NextResponse.json({ error: 'Failed to remove MAL account' }, { status: 500 });
  }
}
