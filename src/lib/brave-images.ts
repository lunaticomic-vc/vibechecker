import { log } from '@/lib/logger';

/**
 * Search Brave for real screenshots/stills from a movie/show.
 */
export async function searchScreenshots(title: string, year?: string): Promise<string[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  const query = `${title}${year ? ` ${year}` : ''} movie scene screenshot still cinematography`;

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=6&safesearch=moderate`,
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

    return results
      .filter((r: Record<string, unknown>) => {
        const url = (r.properties as Record<string, unknown>)?.url as string ?? r.url as string ?? '';
        // Skip tiny images and icons
        return url && !url.includes('icon') && !url.includes('logo');
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
