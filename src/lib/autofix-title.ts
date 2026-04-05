import { log } from '@/lib/logger';

/**
 * Auto-fix a title by searching Brave and using the corrected/canonical title from results.
 */
export async function autofixTitle(title: string, type: string): Promise<string> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return title;

  const typeHint: Record<string, string> = {
    movie: 'movie',
    tv: 'tv show',
    anime: 'anime',
    youtube: 'youtube channel',
    substack: 'substack article',
  };

  const query = `${title} ${typeHint[type] ?? ''}`;

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) return title;

    const data = await res.json();

    // Check if Brave suggests a correction
    const altered = data?.query?.altered;
    if (altered) {
      log.success('Title autocorrected', `"${title}" -> "${altered}"`);
    }

    // Try to extract the canonical title from the first result
    const firstResult = data?.web?.results?.[0];
    if (!firstResult) return title;

    const resultTitle = (firstResult.title as string) ?? '';

    // Extract the actual name from the search result title
    // e.g. "Breaking Bad (TV Series 2008–2013) - IMDb" -> "Breaking Bad"
    // e.g. "Spirited Away (2001) - IMDb" -> "Spirited Away"
    const cleaned = resultTitle
      .replace(/\s*[\(\[].*?[\)\]]\s*/g, ' ')  // Remove parentheticals
      .replace(/\s*[-–—|:].*(imdb|wiki|rotten|tmdb|mal|anilist|youtube|substack).*/i, '')  // Remove site suffixes
      .replace(/\s*[-–—|].*$/i, '')  // Remove any remaining suffix after dash
      .trim();

    // Skip if the result is just a generic term
    const genericTerms = ['youtube', 'movie', 'tv show', 'anime', 'substack', 'imdb', 'wikipedia', 'watch', 'search'];
    const isGeneric = genericTerms.some(t => cleaned.toLowerCase() === t);

    if (cleaned && cleaned.length > 1 && cleaned.length < 200 && !isGeneric) {
      if (cleaned.toLowerCase() !== title.toLowerCase()) {
        log.success('Title fixed', `"${title}" -> "${cleaned}"`);
      }
      return cleaned;
    }

    return title;
  } catch {
    return title;
  }
}
