import { log } from '@/lib/logger';

export interface RedditInsight {
  subreddit: string;
  comment: string;
  score: number;
}

export async function searchRedditForTitle(title: string, type: string): Promise<RedditInsight[]> {
  const subredditMap: Record<string, string[]> = {
    movie: ['movies', 'MovieSuggestions', 'flicks'],
    tv: ['television', 'TVSuggestions'],
    anime: ['anime', 'Animesuggest'],
    youtube: ['youtube', 'mealtimevideos'],
  };

  const subreddits = subredditMap[type] ?? ['movies'];
  const insights: RedditInsight[] = [];

  for (const sub of subreddits.slice(0, 2)) {
    try {
      const query = encodeURIComponent(title);
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/search.json?q=${query}&restrict_sr=on&sort=relevance&limit=3`,
        { headers: { 'User-Agent': 'VibeChecker/1.0' } }
      );

      if (!res.ok) continue;

      const data = await res.json();
      const posts = data?.data?.children ?? [];

      for (const post of posts.slice(0, 2)) {
        const postData = post.data;
        if (!postData?.permalink) continue;

        // Fetch top comments from the post
        try {
          const commentsRes = await fetch(
            `https://www.reddit.com${postData.permalink}.json?sort=top&limit=5`,
            { headers: { 'User-Agent': 'VibeChecker/1.0' } }
          );

          if (!commentsRes.ok) continue;

          const commentsData = await commentsRes.json();
          const comments = commentsData?.[1]?.data?.children ?? [];

          for (const c of comments.slice(0, 8)) {
            const body = c.data?.body;
            const score = c.data?.score ?? 0;
            if (!body || body === '[deleted]' || body === '[removed]') continue;
            if (body.length < 30 || score < 3) continue;

            // Filter for quality: comments about the show's quality, worth watching, etc.
            const lower = body.toLowerCase();
            const isRelevant =
              lower.includes('worth') || lower.includes('recommend') || lower.includes('loved') ||
              lower.includes('amazing') || lower.includes('great') || lower.includes('best') ||
              lower.includes('terrible') || lower.includes('boring') || lower.includes('masterpiece') ||
              lower.includes('underrated') || lower.includes('overrated') || lower.includes('must watch') ||
              lower.includes('waste') || lower.includes('beautiful') || lower.includes('emotional') ||
              lower.includes('ending') || lower.includes('season') || lower.includes('episode') ||
              lower.includes('acting') || lower.includes('story') || lower.includes('plot') ||
              lower.includes('character') || lower.includes('enjoy') || lower.includes('watch') ||
              score >= 10; // High-score comments are likely quality

            if (!isRelevant) continue;

            const trimmed = body.length > 300 ? body.substring(0, 300) + '...' : body;

            insights.push({
              subreddit: sub,
              comment: trimmed,
              score,
            });
          }
        } catch {
          // skip failed comment fetch
        }
      }
    } catch {
      // skip failed subreddit search
    }
  }

  // Sort by score, return top insights
  insights.sort((a, b) => b.score - a.score);
  const result = insights.slice(0, 4);
  log.success(`Reddit: found ${result.length} insights for "${title}"`);
  return result;
}
