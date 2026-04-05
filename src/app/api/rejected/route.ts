import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const client = await db();
  const result = await client.execute('SELECT title, type FROM rejected_recommendations ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const { title, type } = await req.json();
  if (!title || !type) return NextResponse.json({ error: 'title and type required' }, { status: 400 });
  const client = await db();
  await client.execute({ sql: 'INSERT OR IGNORE INTO rejected_recommendations (title, type) VALUES (?, ?)', args: [title, type] });
  return NextResponse.json({ success: true });
}
