import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthCookie } from '@/lib/auth';

export async function GET() {
  const client = await db();
  const result = await client.execute('SELECT title, type, reason FROM rejected_recommendations ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, type, reason } = body;
  if (!title || !type) return NextResponse.json({ error: 'title and type required' }, { status: 400 });
  const client = await db();
  await client.execute({ sql: 'INSERT OR IGNORE INTO rejected_recommendations (title, type, reason) VALUES (?, ?, ?)', args: [title, type, reason ?? null] });
  return NextResponse.json({ success: true });
}
