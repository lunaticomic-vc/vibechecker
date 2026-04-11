import { NextRequest, NextResponse } from 'next/server';
import { searchTMDB } from '@/lib/tmdb';
import { log } from '@/lib/logger';

const SCREEN_TYPES = ['movie', 'tv'];
const READ_TYPES = ['book', 'poetry', 'short_story', 'essay', 'podcast', 'substack', 'research', 'game'];

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
    // Screen content — TMDB
    if (type && SCREEN_TYPES.includes(type)) {
      const result = await searchTMDB(title, type as 'movie' | 'tv');
      if (result?.posterUrl) {
        log.success('Found TMDB image for', `"${title}"`);
        return NextResponse.json({ image_url: result.posterUrl });
      }
      return NextResponse.json({ image_url: null });
    }

    // Books — actual cover from Open Library
    if (type === 'book') {
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          const coverId = data.docs?.[0]?.cover_i;
          if (coverId) {
            const cover = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
            log.success('Found book cover for', `"${title}"`);
            return NextResponse.json({ image_url: cover });
          }
        }
      } catch { /* best effort */ }
      return NextResponse.json({ image_url: null });
    }

    // Manga — use Jikan (MyAnimeList) API for cover art
    if (type === 'manga') {
      try {
        const jikanRes = await fetch(
          `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(title)}&limit=1&sfw=true`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (jikanRes.ok) {
          const jikanData = await jikanRes.json();
          const top = jikanData.data?.[0];
          const coverUrl = top?.images?.jpg?.large_image_url ?? top?.images?.jpg?.image_url;
          if (coverUrl) {
            log.success('Found Jikan manga image for', `"${title}"`);
            return NextResponse.json({ image_url: coverUrl });
          }
        }
      } catch { /* fallback to Brave */ }
    }

    // Games — search Steam Store API for cover art
    if (type === 'game') {
      try {
        const steamRes = await fetch(
          `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=en&cc=US`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (steamRes.ok) {
          const steamData = await steamRes.json();
          const appId = steamData?.items?.[0]?.id;
          if (appId) {
            const coverUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
            log.success('Found Steam image for', `"${title}"`);
            return NextResponse.json({ image_url: coverUrl });
          }
        }
      } catch { /* fallback to Brave */ }
      const image = await searchBraveImage(`${title} video game`);
      if (image) {
        log.success('Found Brave image for game', `"${title}"`);
        return NextResponse.json({ image_url: image });
      }
      return NextResponse.json({ image_url: null });
    }

    // Other read content — vibe image from Brave
    if (type && READ_TYPES.includes(type)) {
      const image = await searchBraveImage(`${title} ${type} aesthetic`);
      if (image) {
        log.success('Found vibe image for', `"${title}"`);
        return NextResponse.json({ image_url: image });
      }
      return NextResponse.json({ image_url: null });
    }

    return NextResponse.json({ image_url: null });
  } catch (err) {
    log.error('Failed to search image', err);
    return NextResponse.json({ error: 'Failed to search image' }, { status: 500 });
  }
}
