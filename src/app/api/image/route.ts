import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { consumeRateLimit } from '@/lib/rate-limit';
import { verifyAuthCookie } from '@/lib/auth';

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

// 24h in-memory cache so the same title doesn't re-hit the Brave API quota (2000 req/month free tier)
interface CacheEntry { url: string | null; expires: number }
const _cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
function cacheGet(key: string): string | null | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) { _cache.delete(key); return undefined; }
  return entry.url;
}
function cacheSet(key: string, url: string | null) {
  if (_cache.size >= CACHE_MAX) {
    const first = _cache.keys().next().value;
    if (first !== undefined) _cache.delete(first);
  }
  _cache.set(key, { url, expires: Date.now() + CACHE_TTL_MS });
}

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
    return ((result?.properties as Record<string, unknown>)?.url as string) ?? (result?.url as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  const type = req.nextUrl.searchParams.get('type');

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  // Rate limit guests: guests share the IP budget so anon callers can't burn the Brave quota.
  const isOwner = verifyAuthCookie(req.cookies.get('cc_auth')?.value);
  if (!isOwner) {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed } = await consumeRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }
  }

  log.api('GET', '/api/image', `"${title}" (${type})`);

  try {
    const suffix = TYPE_QUERY[type ?? ''] ?? 'poster';
    const cacheKey = `${type ?? ''}:${title.toLowerCase()}`;
    const cached = cacheGet(cacheKey);

    let image: string | null;
    if (cached !== undefined) {
      image = cached;
    } else {
      image = await searchBraveImage(`${title} ${suffix}`);
      cacheSet(cacheKey, image);
    }

    if (image) {
      log.success('Found image for', `"${title}" (${type})`);
    }
    // Cache-Control so Vercel's edge CDN serves repeat hits without invoking the function
    return NextResponse.json(
      { image_url: image },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (err) {
    log.error('Failed to search image', err);
    return NextResponse.json({ error: 'Failed to search image' }, { status: 500 });
  }
}
