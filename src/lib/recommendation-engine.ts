import { getOpenAI } from '@/lib/openai';
import { getAllFavorites } from '@/lib/favorites';
import { getAllProgress } from '@/lib/progress';
import { getAllRatings } from '@/lib/ratings';
import { searchRedditForTitle } from '@/lib/reddit';
import { searchTMDB } from '@/lib/tmdb';
import type { ContentType, DiscoveryMode, Favorite, WatchProgress, Rating, Recommendation } from '@/types/index';

type AIResponse = {
  title: string;
  description: string;
  reasoning: string;
  year?: string;
  searchQuery?: string;
  episodeInfo?: string;
  actors?: string[];
  imageSearchTerms?: string[];
  interests?: string[];
};

const RATING_LABELS: Record<string, string> = {
  felt_things: 'LOVED (made them feel things)',
  enjoyed: 'ENJOYED',
  watched: 'WATCHED (neutral)',
  not_my_thing: 'DISLIKED (not their thing)',
};

export function buildRecommendationPrompt(
  vibe: string,
  contentType: ContentType,
  favorites: Favorite[],
  watchProgress: WatchProgress[],
  ratings: Rating[],
  discoveryMode: DiscoveryMode = 'something_new',
  interests: string[] = []
): string {
  const ratingsMap = new Map<number, Rating>();
  for (const r of ratings) ratingsMap.set(r.favorite_id, r);

  const byType: Record<string, string[]> = {};
  for (const fav of favorites) {
    if (!byType[fav.type]) byType[fav.type] = [];
    const rating = ratingsMap.get(fav.id);
    let entry = fav.title;
    if (rating) {
      entry += ` [${RATING_LABELS[rating.rating]}]`;
      if (rating.reasoning) entry += ` (reason: "${rating.reasoning}")`;
    }
    byType[fav.type].push(entry);
  }

  const favoritesSection = Object.entries(byType)
    .map(([type, titles]) => `  ${type}: ${titles.join(', ')}`)
    .join('\n');

  const disliked = favorites
    .filter(f => ratingsMap.get(f.id)?.rating === 'not_my_thing')
    .map(f => {
      const r = ratingsMap.get(f.id);
      return `  "${f.title}"${r?.reasoning ? ` — reason: "${r.reasoning}"` : ''}`;
    });

  const loved = favorites
    .filter(f => ratingsMap.get(f.id)?.rating === 'felt_things')
    .map(f => {
      const r = ratingsMap.get(f.id);
      return `  "${f.title}"${r?.reasoning ? ` — what made it special: "${r.reasoning}"` : ''}`;
    });

  const progressSection = watchProgress
    .slice(0, 5)
    .map((p) => {
      const fav = favorites.find((f) => f.id === p.favorite_id);
      if (!fav) return null;
      if (p.status === 'watching') {
        return `  "${fav.title}" (currently on S${p.current_season}E${p.current_episode}, status: watching)`;
      }
      return `  "${fav.title}" (${p.status})`;
    })
    .filter(Boolean)
    .join('\n');

  const instructions: Record<ContentType, string> = {
    youtube: 'Think creatively about the user\'s interests, humor, taste profile, and vibe. Don\'t suggest the most obvious mainstream video — dig deeper. Think about niche creators, essay channels, video essays, obscure gems, underrated creators that match their sensibility. Include a searchQuery field with a specific, targeted search string. Include an "interests" array of 3-5 interest tags that explain WHY this video matches them (e.g., ["dark humor", "philosophy", "visual storytelling"]). Estimate duration in the description.',
    movie: 'Suggest a specific movie with its release year. Include enough detail (title + year) so it can be found on streaming sites.',
    tv: 'Suggest a specific TV show. Include season recommendation if relevant (e.g., "start at Season 2"). Add episodeInfo if applicable.',
    anime: 'Suggest a specific anime. Include episode count or arc recommendation in episodeInfo if helpful.',
  };

  return [
    `The user's current vibe: "${vibe}"`,
    `They want a recommendation for: ${contentType}`,
    interests.length > 0 ? `\nThe user's interests/passions: ${interests.join(', ')}. Use these to find content that aligns with what they care about deeply.` : '',
    '',
    favorites.length > 0
      ? `The user's library (with ratings):\n${favoritesSection}`
      : 'The user has no saved favorites yet.',
    '',
    loved.length > 0 ? `Content that deeply resonated with the user ("made me feel things"):\n${loved.join('\n')}\n\nANALYZE the above carefully. The reasons they gave reveal their taste — what themes, humor, emotions, storytelling styles they connect with. Your recommendation MUST match this sensibility. If they loved something for dark humor, recommend something with similar wit. If they loved something for emotional depth, match that intensity. Their "felt things" list IS their personality profile.` : '',
    '',
    disliked.length > 0 ? `Content the user DISLIKED (AVOID recommending similar things):\n${disliked.join('\n')}\n\nThe reasons above reveal what turns them off. Actively avoid these qualities.` : '',
    '',
    progressSection
      ? `What they're currently watching:\n${progressSection}`
      : 'Nothing in their watch queue right now.',
    '',
    discoveryMode === 'from_library'
      ? `IMPORTANT: You MUST recommend something from the user's existing library/favorites listed above. Pick one that best fits the vibe. For YouTube, pick from their saved channels/videos.`
      : `IMPORTANT: Recommend something NEW that the user has NOT seen/watched yet. Do NOT suggest anything already in their library above. For YouTube, suggest channels or creators they are NOT subscribed to.`,
    '',
    `Your task: ${instructions[contentType]}`,
    '',
    'IMPORTANT: The recommendation MUST match the vibe — consider duration, intensity, genre, and mood.',
    'IMPORTANT: Prioritize content similar to what the user LOVED. AVOID anything similar to what they DISLIKED, paying attention to their stated reasons.',
    'Always explain WHY this specific recommendation fits the vibe.',
    '',
    'For movies/tv/anime: include an "actors" array with 2-4 notable actors/voice actors in it.',
    'Include an "imageSearchTerms" array with 3-4 search terms to find images that capture the vibe/aesthetic of this recommendation (e.g., "Inception cityscape scene", "Inception spinning top", "Inception zero gravity hallway").',
    '',
    'Respond with ONLY a JSON object (no markdown, no extra text):',
    '{',
    '  "title": "...",',
    '  "description": "brief plot/description",',
    '  "reasoning": "why this fits the vibe perfectly",',
    '  "year": "YYYY (for movies/tv/anime, omit for youtube)",',
    '  "searchQuery": "search string (youtube only)",',
    '  "episodeInfo": "e.g. Start at Season 2 (tv/anime only, optional)",',
    '  "actors": ["Actor 1", "Actor 2"] (omit for youtube),',
    '  "imageSearchTerms": ["scene description 1", "scene description 2", "scene description 3"]',
    '}',
  ].join('\n');
}

export async function getRecommendation(
  vibe: string,
  contentType: ContentType,
  discoveryMode: DiscoveryMode = 'something_new'
): Promise<Recommendation> {
  const favorites = await getAllFavorites();
  const allProgress = await getAllProgress();
  const ratings = await getAllRatings();

  // Fetch user interests
  let interests: string[] = [];
  try {
    const { db: getDb } = await import('@/lib/db');
    const client = await getDb();
    const intResult = await client.execute('SELECT name FROM interests ORDER BY name');
    interests = intResult.rows.map((r: unknown) => (r as { name: string }).name);
  } catch { /* ignore */ }

  const watchProgress: WatchProgress[] = allProgress.map((p) => ({
    id: p.id,
    favorite_id: p.favorite_id,
    current_season: p.current_season,
    current_episode: p.current_episode,
    total_seasons: p.total_seasons,
    total_episodes: p.total_episodes,
    status: p.status,
    updated_at: p.updated_at,
  }));

  const userPrompt = buildRecommendationPrompt(vibe, contentType, favorites, watchProgress, ratings, discoveryMode, interests);

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You are a personal entertainment recommendation engine. You know the user\'s taste deeply and recommend content that matches their current vibe perfectly.',
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';

  let ai: AIResponse;
  try {
    ai = JSON.parse(raw) as AIResponse;
  } catch {
    throw new Error(`Failed to parse AI response: ${raw}`);
  }

  const title = ai.title ?? 'Unknown';

  let actionUrl: string;
  let actionLabel: string;

  if (contentType === 'youtube') {
    const query = ai.searchQuery ?? title;
    actionUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    actionLabel = 'Search on YouTube';
  } else {
    actionUrl = `https://sflix.ps/search/${encodeURIComponent(title)}`;
    actionLabel = 'Watch on sflix';
  }

  // Fetch real images from TMDB
  let imageUrls: string[] = [];
  let thumbnailUrl: string | undefined;
  if (contentType !== 'youtube') {
    const tmdbType = contentType === 'movie' ? 'movie' : 'tv';
    const tmdb = await searchTMDB(title, tmdbType);
    if (tmdb) {
      if (tmdb.posterUrl) thumbnailUrl = tmdb.posterUrl;
      imageUrls = tmdb.backdropUrls;
    }
  }
  // Gradient fallbacks if no images found
  if (imageUrls.length === 0) {
    imageUrls = [0, 1, 2].map(i => `gradient:${i}:${encodeURIComponent(title)}`);
  }

  // Fetch Reddit insights for non-YouTube content
  let redditInsights;
  if (contentType !== 'youtube') {
    try {
      redditInsights = await searchRedditForTitle(title, contentType);
    } catch {
      // Reddit search is best-effort
    }
  }

  return {
    title,
    type: contentType,
    description: ai.description ?? '',
    reasoning: ai.reasoning ?? '',
    actionUrl,
    actionLabel,
    thumbnailUrl,
    year: ai.year,
    episodeInfo: ai.episodeInfo,
    actors: ai.actors,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    redditInsights: redditInsights && redditInsights.length > 0 ? redditInsights : undefined,
    interests: ai.interests,
  };
}
