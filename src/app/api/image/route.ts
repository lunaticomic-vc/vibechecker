import { NextRequest, NextResponse } from 'next/server';
import { searchTMDB } from '@/lib/tmdb';
import { log } from '@/lib/logger';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  const type = req.nextUrl.searchParams.get('type');

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  if (type !== 'movie' && type !== 'tv') {
    return NextResponse.json({ error: 'type must be movie or tv' }, { status: 400 });
  }

  log.api('GET', '/api/image', `"${title}" (${type})`);

  try {
    const result = await searchTMDB(title, type);
    if (!result?.posterUrl) {
      return NextResponse.json({ image_url: null });
    }

    log.success('Found image for', `"${title}"`);
    return NextResponse.json({ image_url: result.posterUrl });
  } catch (err) {
    log.error('Failed to search image', err);
    return NextResponse.json({ error: 'Failed to search image' }, { status: 500 });
  }
}
