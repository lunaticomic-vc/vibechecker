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
      const query = encodeURIComponent(`"${title}"`);
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
        // Verify the post is actually about this title
        const postTitle = (postData.title ?? '').toLowerCase();
        if (!postTitle.includes(title.toLowerCase().split(':')[0].trim())) continue;

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
            // Skip spoilers and context-dependent comments
            if (lower.includes('spoiler') || lower.includes('spoilers') || lower.includes('&gt;!') ||
                lower.includes('spoiler alert') || lower.includes('major spoiler') ||
                lower.includes('dies') || lower.includes('killed off') || lower.includes('plot twist') ||
                lower.includes('the ending is') || lower.includes('turns out') ||
                lower.includes('did you see when') || lower.includes('that scene where') ||
                lower.includes('remember when') || lower.includes('lmao') || lower.includes('same') ||
                lower.includes('this') === (body.trim().length < 15) ||
                lower.startsWith('i mean') || lower.startsWith('right?') ||
                lower.startsWith('lol') || lower.startsWith('ikr') ||
                lower.includes('replied to') || lower.includes('username') ||
                body.split(' ').length < 8) continue;

            // Only include genuine reviews — opinions on quality, worth watching, acting, story
            const reviewSignals = [
              'worth watching', 'worth it', 'must watch', 'must see', 'highly recommend',
              'masterpiece', 'underrated', 'overrated', 'waste of time',
              'the acting', 'the story', 'the plot', 'the writing', 'the cinematography',
              'the ending', 'the characters', 'character development',
              'loved it', 'hated it', 'blown away', 'disappointed',
              'one of the best', 'one of the worst', 'beautiful', 'incredible',
              'made me cry', 'made me think', 'couldn\'t stop watching',
              'slow burn', 'gripping', 'boring', 'predictable', 'surprising',
            ];
            const isReview = reviewSignals.some(sig => lower.includes(sig)) || score >= 15;
            // Skip short quips, jokes, and off-topic comments
            if (!isReview || body.length < 50) continue;

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
