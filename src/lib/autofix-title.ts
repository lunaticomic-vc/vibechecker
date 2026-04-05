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

    // Only use Brave's explicit spell-correction — don't extract from search result headings
    // which can match completely wrong titles
    const altered = data?.query?.altered;
    if (altered && altered.length > 1 && altered.length < 200) {
      log.success('Title autocorrected', `"${title}" -> "${altered}"`);
      return altered;
    }

    return title;
  } catch {
    return title;
  }
}
