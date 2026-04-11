import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const client = await db();
    const result = await client.execute('SELECT * FROM interests ORDER BY name');
    return NextResponse.json(result.rows);
  } catch (err) {
    log.error('Failed to fetch interests', err);
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let parsed;
  try { parsed = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { name } = parsed;
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }
  const client = await db();
  log.db('ADD interest', name.trim().toLowerCase());
  try {
    // RETURNING * eliminates the follow-up SELECT that previously re-fetched every row
    const result = await client.execute({
      sql: 'INSERT INTO interests (name) VALUES (?) RETURNING *',
      args: [name.trim().toLowerCase()],
    });
    return NextResponse.json({ success: true, interest: result.rows[0] });
  } catch {
    return NextResponse.json({ error: 'Already exists' }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const client = await db();
    log.db('REMOVE interest', `id=${id}`);
    // No re-fetch after delete — the client can optimistically prune via SWR mutate
    await client.execute({ sql: 'DELETE FROM interests WHERE id = ?', args: [Number(id)] });
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Failed to delete interest', err);
    return NextResponse.json({ error: 'Failed to delete interest' }, { status: 500 });
  }
}
