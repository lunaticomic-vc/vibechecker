import { log } from '@/lib/logger';

export interface SubstackSearchResult {
  title: string;
  url: string;
  publishedByline: string;
  description: string;
}

/**
 * Search for Substack articles using Brave Search API.
 */
async function braveSearch(query: string): Promise<SubstackSearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      log.warn('Brave search failed', `${res.status}`);
      return [];
    }

    const data = await res.json();
    const results = data?.web?.results ?? [];

    return results
      .filter((r: Record<string, unknown>) => {
        const url = r.url as string;
        return url && /substack\.com\/p\//.test(url);
      })
      .map((r: Record<string, unknown>) => ({
        title: (r.title as string) ?? '',
        url: (r.url as string) ?? '',
        publishedByline: '',
        description: ((r.description as string) ?? '').slice(0, 300),
      }));
  } catch (err) {
    log.warn('Brave search error', String(err));
    return [];
  }
}

/**
 * Search for real Substack articles with multiple queries via Brave.
 */
export async function searchSubstackMulti(queries: string[]): Promise<SubstackSearchResult[]> {
  const braveQueries = queries.map(q => `site:substack.com ${q}`);
  const results = await Promise.all(braveQueries.map(q => braveSearch(q)));

  // Dedupe by URL
  const seen = new Set<string>();
  const merged: SubstackSearchResult[] = [];
  for (const batch of results) {
    for (const r of batch) {
      if (!seen.has(r.url)) {
        seen.add(r.url);
        merged.push(r);
      }
    }
  }
  return merged;
}

/**
 * Verify a URL actually exists (returns 200).
 */
export async function verifyUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VibeChecker/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status === 301 || res.status === 302;
  } catch {
    return false;
  }
}
