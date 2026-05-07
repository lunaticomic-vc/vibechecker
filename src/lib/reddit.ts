import { log } from '@/lib/logger';

export interface RedditInsight {
  subreddit: string;
  comment: string;
  score: number;
}

// Reddit cache — 6h TTL since reddit threads evolve slowly
interface CacheEntry<T> { value: T; expires: number }
const _cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 200;
function cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) { _cache.delete(key); return undefined; }
  return entry.value as T;
}
function cacheSet<T>(key: string, value: T): void {
  if (_cache.size >= CACHE_MAX) {
    const first = _cache.keys().next().value;
    if (first !== undefined) _cache.delete(first);
  }
  _cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

const UA = 'VibeChecker/1.0';

function isQualityReview(body: string, score: number): boolean {
  if (body.length < 40) return false;
  const lower = body.toLowerCase();
  // Skip only the most obvious junk / low-effort replies
  if (lower.includes('&gt;!') ||
      lower.startsWith('lol') || lower.startsWith('ikr') ||
      body.split(' ').length < 6) return false;

  // Any comment with a decent score (5+) is worth keeping — the filter was too strict
  // and was returning 0 results for most titles.
  if (score >= 5) return true;

  // Below 5 score, require it to look like an actual opinion
  const reviewSignals = [
    'worth watching', 'worth it', 'must watch', 'must see', 'highly recommend',
    'masterpiece', 'underrated', 'overrated', 'waste of time',
    'the acting', 'the story', 'the plot', 'the writing', 'the cinematography',
    'the ending', 'the characters', 'character development',
    'loved it', 'hated it', 'blown away', 'disappointed',
    'one of the best', 'one of the worst', 'beautiful', 'incredible',
    'made me cry', 'made me think', "couldn't stop watching",
    'slow burn', 'gripping', 'boring', 'predictable', 'surprising',
    'i liked', 'i loved', 'i hated', 'i thought', 'such a',
    'this show', 'this movie', 'this series', 'this anime', 'this book',
  ];
  return reviewSignals.some(sig => lower.includes(sig));
}

async function fetchSubredditInsights(sub: string, title: string): Promise<RedditInsight[]> {
  try {
    const query = encodeURIComponent(`"${title}"`);
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=on&sort=relevance&limit=3`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      log.warn(`Reddit search r/${sub} HTTP ${res.status}`, `title="${title}"`);
      return [];
    }

    const data = await res.json();
    const posts = (data?.data?.children ?? []).slice(0, 2);
    if (posts.length === 0) {
      log.warn(`Reddit r/${sub}: 0 posts for "${title}"`);
      return [];
    }

    let postsRejectedByTitle = 0;
    let commentsHttpFail = 0;
    let commentsConsidered = 0;
    const rejectionCounts = { deleted: 0, tooShortOrLowScore: 0, notQuality: 0, irrelevant: 0 };

    // Fetch each post's comments in PARALLEL instead of sequentially
    const commentBatches = await Promise.all(posts.map(async (post: { data: { permalink?: string; title?: string } }) => {
      const postData = post.data;
      if (!postData?.permalink) return [];
      // Loosened post-title match: look for ANY significant word from the title (3+ chars)
      // rather than requiring the full title prefix. Previously this rejected most posts.
      const postTitle = (postData.title ?? '').toLowerCase();
      const titlePrefix = title.toLowerCase().split(':')[0].trim();
      const titleWords = titlePrefix.split(/\s+/).filter(w => w.length >= 3);
      const hasTitleMatch = postTitle.includes(titlePrefix) ||
        titleWords.length > 0 && titleWords.every(w => postTitle.includes(w));
      if (!hasTitleMatch) { postsRejectedByTitle++; return []; }

      try {
        const commentsRes = await fetch(
          `https://www.reddit.com${postData.permalink}.json?sort=top&limit=5`,
          { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) }
        );
        if (!commentsRes.ok) {
          commentsHttpFail++;
          log.warn(`Reddit comments HTTP ${commentsRes.status}`, `r/${sub} permalink=${postData.permalink}`);
          return [];
        }

        const commentsData = await commentsRes.json();
        const comments = commentsData?.[1]?.data?.children ?? [];

        const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const insights: RedditInsight[] = [];

        for (const c of comments.slice(0, 8)) {
          commentsConsidered++;
          const body = c.data?.body;
          const score = c.data?.score ?? 0;
          if (!body || body === '[deleted]' || body === '[removed]') { rejectionCounts.deleted++; continue; }
          if (body.length < 30 || score < 3) { rejectionCounts.tooShortOrLowScore++; continue; }
          if (!isQualityReview(body, score)) { rejectionCounts.notQuality++; continue; }

          const lower = body.toLowerCase();
          const mentionsTitle = titleWords.some(w => lower.includes(w));
          const isOpinion = ['movie', 'film', 'show', 'series', 'it ', 'this ', 'watch'].some(w => lower.includes(w));
          if (!mentionsTitle && !isOpinion) { rejectionCounts.irrelevant++; continue; }

          const trimmed = body.length > 300 ? body.substring(0, 300) + '...' : body;
          insights.push({ subreddit: sub, comment: trimmed, score });
        }
        return insights;
      } catch (err) {
        commentsHttpFail++;
        log.warn(`Reddit comments fetch threw`, `r/${sub} ${String(err)}`);
        return [];
      }
    }));

    const flat = commentBatches.flat();
    const detail = `posts=${posts.length} rejectedByTitle=${postsRejectedByTitle} commentsHttpFail=${commentsHttpFail} considered=${commentsConsidered} rejections=${JSON.stringify(rejectionCounts)} kept=${flat.length}`;
    if (flat.length === 0) log.warn(`Reddit r/${sub} "${title}": no kept`, detail);
    else log.success(`Reddit r/${sub} "${title}": kept ${flat.length}`, detail);
    return flat;
  } catch (err) {
    log.warn(`Reddit r/${sub} fetch threw`, `title="${title}" ${String(err)}`);
    return [];
  }
}

export async function searchRedditForTitle(title: string, type: string): Promise<RedditInsight[]> {
  const cacheKey = `reddit:${type}:${title.toLowerCase()}`;
  const cached = cacheGet<RedditInsight[]>(cacheKey);
  if (cached !== undefined) return cached;

  const subredditMap: Record<string, string[]> = {
    movie: ['movies', 'MovieSuggestions', 'flicks'],
    tv: ['television', 'TVSuggestions'],
    anime: ['anime', 'Animesuggest'],
    kdrama: ['KDRAMA', 'kdramarecommends'],
    youtube: ['youtube', 'mealtimevideos'],
    manga: ['manga', 'MangaCollectors'],
    comic: ['comicbooks', 'DCcomics'],
    game: ['games', 'gamingsuggestions'],
    book: ['books', 'suggestmeabook'],
    podcast: ['podcasts'],
  };

  const subreddits = (subredditMap[type] ?? ['movies']).slice(0, 2);

  // Global wall-clock cap of 10s for the whole Reddit lookup so it can't dominate the response
  const TIMEOUT_SENTINEL = Symbol('reddit-timeout');
  const start = Date.now();
  const lookupPromise = Promise.all(subreddits.map(sub => fetchSubredditInsights(sub, title)));
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) => setTimeout(() => resolve(TIMEOUT_SENTINEL), 10_000));
  const raced = await Promise.race([lookupPromise, timeoutPromise]);

  if (raced === TIMEOUT_SENTINEL) {
    log.warn(`Reddit lookup TIMED OUT after 10s`, `title="${title}" subs=${subreddits.join(',')}`);
    cacheSet(cacheKey, [] as RedditInsight[]);
    return [];
  }

  const insights: RedditInsight[] = raced.flat();
  insights.sort((a, b) => b.score - a.score);
  const result = insights.slice(0, 4);
  log.success(`Reddit: found ${result.length} insights for "${title}" in ${Date.now() - start}ms (subs=${subreddits.join(',')})`);
  cacheSet(cacheKey, result);
  return result;
}
