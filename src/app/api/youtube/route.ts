import { NextRequest, NextResponse } from 'next/server';
import { searchYouTube } from '@/lib/youtube';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'q query param is required' }, { status: 400 });
  }

  try {
    const results = await searchYouTube(q);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'YouTube search failed' }, { status: 500 });
  }
}
