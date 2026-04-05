import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';
import { verifyAuthCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'q query param is required' }, { status: 400 });
  }

  try {
    const results = await searchYouTube(q);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'YouTube search failed' }, { status: 500 });
  }
}
