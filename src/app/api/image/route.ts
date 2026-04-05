import { NextRequest, NextResponse } from 'next/server';
import { searchTMDB } from '@/lib/tmdb';
import { log } from '@/lib/logger';

// GET /api/image?title=Inception&type=movie
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  const type = req.nextUrl.searchParams.get('type') as 'movie' | 'tv' | null;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  log.api('GET', '/api/image', `"${title}" (${type ?? 'movie'})`);

  const result = await searchTMDB(title, type ?? 'movie');
  if (!result?.posterUrl) {
    return NextResponse.json({ image_url: null });
  }

  log.success('Found image for', `"${title}"`);
  return NextResponse.json({ image_url: result.posterUrl });
}
