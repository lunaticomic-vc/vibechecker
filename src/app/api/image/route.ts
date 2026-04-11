import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

const TYPE_QUERY: Record<string, string> = {
  movie: 'movie poster',
  tv: 'tv show poster',
  anime: 'anime poster',
  kdrama: 'korean drama poster',
  youtube: 'youtube thumbnail',
  manga: 'manga cover',
  comic: 'comic book cover',
  game: 'video game cover art',
  book: 'book cover',
  podcast: 'podcast cover art',
  poetry: 'poetry book cover',
  short_story: 'short story collection cover',
  essay: 'essay book cover',
  research: 'research paper',
  substack: 'article',
};

async function searchBraveImage(query: string): Promise<string | null> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=3&safesearch=moderate`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.results?.[0];
    return (result?.properties as Record<string, unknown>)?.url as string ?? result?.url as string ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  const type = req.nextUrl.searchParams.get('type');

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  log.api('GET', '/api/image', `"${title}" (${type})`);

  try {
    const suffix = TYPE_QUERY[type ?? ''] ?? 'poster';
    const image = await searchBraveImage(`${title} ${suffix}`);
    if (image) {
      log.success('Found image for', `"${title}" (${type})`);
      return NextResponse.json({ image_url: image });
    }
    return NextResponse.json({ image_url: null });
  } catch (err) {
    log.error('Failed to search image', err);
    return NextResponse.json({ error: 'Failed to search image' }, { status: 500 });
  }
}
