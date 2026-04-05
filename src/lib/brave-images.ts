import { log } from '@/lib/logger';

/**
 * Search Brave for real screenshots/stills from a movie/show.
 */
export async function searchScreenshots(title: string, year?: string): Promise<string[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  // Explicitly ask for scene stills, exclude posters/covers/art
  const query = `"${title}"${year ? ` ${year}` : ''} scene still film screenshot -poster -cover -dvd -blu-ray -artwork -wallpaper`;

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=12&safesearch=moderate`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      log.warn('Brave image search failed', `${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data?.results ?? [];

    // Filter out posters, covers, and non-screenshot images
    const posterPatterns = [
      'poster', 'cover', 'dvd', 'blu-ray', 'bluray', 'artwork',
      'logo', 'icon', 'banner', 'wallpaper', 'fanart',
      'amazon.com', 'ebay.com', 'walmart.com', 'target.com',
      'themoviedb.org/t/p', 'image.tmdb.org',
    ];

    return results
      .filter((r: Record<string, unknown>) => {
        const url = ((r.properties as Record<string, unknown>)?.url as string ?? r.url as string ?? '').toLowerCase();
        const pageUrl = (r.url as string ?? '').toLowerCase();
        const title = ((r.title as string) ?? '').toLowerCase();

        if (!url) return false;

        // Skip if URL or title contains poster-like terms
        for (const p of posterPatterns) {
          if (url.includes(p) || pageUrl.includes(p) || title.includes(p)) return false;
        }

        // Prefer landscape images (screenshots are usually wide)
        const w = (r.properties as Record<string, unknown>)?.width as number ?? (r.width as number) ?? 0;
        const h = (r.properties as Record<string, unknown>)?.height as number ?? (r.height as number) ?? 0;
        if (w && h && h > w) return false; // Skip portrait (likely posters)

        return true;
      })
      .slice(0, 3)
      .map((r: Record<string, unknown>) => {
        return (r.properties as Record<string, unknown>)?.url as string ?? r.url as string ?? '';
      })
      .filter(Boolean);
  } catch (err) {
    log.warn('Brave image search error', String(err));
    return [];
  }
}
