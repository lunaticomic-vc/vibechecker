import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { log } from '@/lib/logger';

export async function GET() {
  const client = await db();
  const result = await client.execute('SELECT * FROM interests ORDER BY name');
  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }
  const client = await db();
  log.db('ADD interest', name.trim().toLowerCase());
  try {
    await client.execute({ sql: 'INSERT INTO interests (name) VALUES (?)', args: [name.trim().toLowerCase()] });
  } catch {
    return NextResponse.json({ error: 'Already exists' }, { status: 409 });
  }
  const result = await client.execute('SELECT * FROM interests ORDER BY name');
  return NextResponse.json(result.rows);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const client = await db();
  log.db('REMOVE interest', `id=${id}`);
  await client.execute({ sql: 'DELETE FROM interests WHERE id = ?', args: [Number(id)] });
  const result = await client.execute('SELECT * FROM interests ORDER BY name');
  return NextResponse.json(result.rows);
}
