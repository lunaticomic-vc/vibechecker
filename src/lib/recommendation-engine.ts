import { getOpenAI } from '@/lib/openai';
import { getAllFavorites } from '@/lib/favorites';
import { getAllProgress } from '@/lib/progress';
import { getAllRatings } from '@/lib/ratings';
import { searchRedditForTitle } from '@/lib/reddit';
import { searchTMDB } from '@/lib/tmdb';
import { searchSubstackMulti, verifyUrl } from '@/lib/substack';
// Brave image search removed — TMDB backdrops are more reliable for stills
import type { SubstackSearchResult } from '@/lib/substack';
import { searchYouTube, buildYouTubeWatchUrl } from '@/lib/youtube';
import type { YouTubeResult } from '@/lib/youtube';
import { searchAnimeJikan } from '@/lib/mal';
import type { ContentType, DiscoveryMode, Favorite, WatchProgress, Rating, Recommendation } from '@/types/index';

type AIResponse = {
  title: string;
  description: string;
  reasoning: string;
  year?: string;
  searchQuery?: string;
  substackUrl?: string;
  episodeInfo?: string;
  actors?: string[];
  tropes?: string[];
  imageSearchTerms?: string[];
  interests?: string[];
};

const RATING_LABELS: Record<string, string> = {
  felt_things: 'LOVED (made them feel things)',
  enjoyed: 'ENJOYED',
  watched: 'OKAYISH (neutral)',
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
    youtube: 'Think creatively about the user\'s interests, humor, taste profile, and vibe. Don\'t suggest the most obvious mainstream video — dig deeper. Think about niche creators, essay channels, video essays, obscure gems, underrated creators that match their sensibility. NEVER recommend YouTube Shorts — only full-length videos (at least 3+ minutes). Include a searchQuery field with a specific, targeted search string. Include an "interests" array of 3-5 interest tags that explain WHY this video matches them (e.g., ["dark humor", "philosophy", "visual storytelling"]). Estimate duration in the description.',
    movie: 'Suggest a specific movie with its release year. Include enough detail (title + year) so it can be found on streaming sites.',
    tv: 'Suggest a specific TV show. Include season recommendation if relevant (e.g., "start at Season 2"). Add episodeInfo if applicable.',
    anime: 'Suggest a specific anime. Include episode count or arc recommendation in episodeInfo if helpful.',
    kdrama: 'Suggest a specific Korean drama (K-drama). Include the year and number of episodes. Focus on emotional depth, romance, character dynamics, and the unique storytelling style of Korean dramas.',
    substack: 'Suggest a SPECIFIC Substack article (NOT a newsletter or publication — a single article). Include the exact article title, the author/publication name, and most importantly a "substackUrl" field with the direct URL to the article (e.g. "https://authorname.substack.com/p/article-slug"). Also include a searchQuery as fallback. Focus on the user\'s interests for topic matching.',
  };

  return [
    `The user's current vibe: "${vibe}"`,
    `They want a recommendation for: ${contentType}`,
    interests.length > 0 ? `\nThe user's interests: ${interests.join(', ')}. ONLY use interests that directly relate to the vibe "${vibe}". Ignore any that don't connect to the topic.` : '',
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
      : `IMPORTANT: Recommend something NEW that the user has NOT seen/watched yet. Do NOT suggest anything already in their library above. For YouTube, suggest channels or creators they are NOT subscribed to.
NEVER recommend any of these rejected titles: ${[...favorites.map(f => f.title)].join(', ')}`,
    '',
    `Your task: ${instructions[contentType]}`,
    '',
    'CRITICAL: The user\'s vibe/prompt is your #1 priority. NEVER ignore what they asked for. The vibe IS the assignment — everything else (interests, taste profile, library) exists to ENHANCE your understanding of what they want, not to override it.',
    'If the vibe is specific (e.g. "feminist mythology"), recommend something that is DIRECTLY about that topic. Use their interests to pick the BEST match within that topic, not to change the topic.',
    'IMPORTANT: Prioritize content similar to what the user LOVED. AVOID anything similar to what they DISLIKED, paying attention to their stated reasons.',
    'Always explain WHY this specific recommendation fits the vibe.',
    '',
    'For movies/tv/anime/kdrama: include an "actors" array with 2-4 notable actors/voice actors in it.',
    'For movies/tv/anime/kdrama: include a "tropes" array with 2-4 prevalent narrative tropes (e.g., "found family", "enemies to lovers", "reluctant hero", "slow burn", "redemption arc", "unreliable narrator", "fish out of water"). Pick only tropes that are genuinely central to the story.',
    'Include an "imageSearchTerms" array with 3-4 search terms to find images that capture the vibe/aesthetic of this recommendation (e.g., "Inception cityscape scene", "Inception spinning top", "Inception zero gravity hallway").',
    '',
    'Respond with ONLY a JSON object (no markdown, no extra text):',
    '{',
    '  "title": "...",',
    '  "description": "brief plot/description",',
    '  "reasoning": "why this fits the vibe perfectly",',
    '  "year": "YYYY (for movies/tv/anime, omit for youtube)",',
    '  "searchQuery": "search string (youtube/substack)",',
    '  "substackUrl": "direct URL to the specific article (substack only)",',
    '  "episodeInfo": "e.g. Start at Season 2 (tv/anime only, optional)",',
    '  "actors": ["Actor 1", "Actor 2"] (omit for youtube),',
    '  "tropes": ["trope 1", "trope 2"] (omit for youtube/substack),',
    '  "imageSearchTerms": ["scene description 1", "scene description 2", "scene description 3"]',
    '}',
  ].join('\n');
}

async function expandVibe(openai: ReturnType<typeof getOpenAI>, vibe: string, interests: string[], tasteProfile: string | null): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content: `You expand a user's prompt into a rich search concept. The prompt "${vibe}" is the ONLY topic — never drift from it.

Rules:
- First, unpack what the prompt means: themes, emotions, aesthetics, ideas
- ONLY include user interests that DIRECTLY relate to the prompt topic. If an interest doesn't connect, drop it completely.
- If the prompt is specific (e.g. "feminist mythology"), every word of your expansion must be about that exact topic
- Return 2-3 sentences, no JSON`,
      },
      {
        role: 'user',
        content: `Prompt: "${vibe}"${interests.length > 0 ? `\nUser interests (ONLY include if directly relevant to "${vibe}"): ${interests.join(', ')}` : ''}${tasteProfile ? `\nTaste (for tone only): ${tasteProfile.slice(0, 200)}` : ''}`,
      },
    ],
  });
  return res.choices[0]?.message?.content ?? vibe;
}

async function getYouTubeRecommendation(
  vibe: string,
  userPrompt: string,
  interests: string[],
  tasteProfile: string | null = null,
  existingTitles: string[] = []
): Promise<Recommendation> {
  const openai = getOpenAI();

  // Step 0: Expand the vibe into a rich concept blended with interests
  const expandedVibe = await expandVibe(openai, vibe, interests, tasteProfile);

  // Step 1: GPT generates search queries from the expanded concept
  const queryResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: 'Generate YouTube search queries to find full-length videos (NOT Shorts). Return ONLY a JSON array of 3-4 specific search strings. No markdown.',
      },
      {
        role: 'user',
        content: `The user wants: "${vibe}"\n\nExpanded concept: ${expandedVibe}\n\nGenerate 3-4 YouTube search queries that match this expanded concept. ALL queries must be directly about "${vibe}". Think video essays, deep dives, niche creators. Be specific and creative.`,
      },
    ],
  });

  let queries: string[];
  try { queries = JSON.parse(queryResponse.choices[0]?.message?.content ?? '[]'); } catch { queries = [vibe]; }

  // Step 2: Search YouTube for real videos (excludes Shorts via duration filter)
  const allResults: YouTubeResult[] = [];
  const seen = new Set<string>();
  for (const q of queries) {
    const results = await searchYouTube(q, true);
    for (const r of results) {
      if (!seen.has(r.videoId)) { seen.add(r.videoId); allResults.push(r); }
    }
  }

  if (allResults.length > 0) {
    // Step 3: GPT picks the best video
    const videoList = allResults.slice(0, 12).map((v, i) =>
      `${i + 1}. "${v.title}" by ${v.channelTitle || 'unknown'}`
    ).join('\n');

    const pickResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Pick the best YouTube video from a list. Return ONLY JSON: {"pick": <number>, "description": "brief summary", "reasoning": "why this fits", "interests": ["tag1", "tag2"]}',
        },
        {
          role: 'user',
          content: `Vibe: "${vibe}"${interests.length > 0 ? `\nInterests: ${interests.join(', ')}` : ''}${existingTitles.length > 0 ? `\n\nDO NOT pick any of these (already in library): ${existingTitles.slice(0, 20).join(', ')}` : ''}\n\nPick the video that best matches the vibe "${vibe}":\n\n${videoList}`,
        },
      ],
    });

    let pick = 0, description = '', reasoning = '', videoInterests: string[] = [];
    try {
      const parsed = JSON.parse(pickResponse.choices[0]?.message?.content ?? '{}');
      pick = (parsed.pick ?? 1) - 1;
      description = parsed.description ?? '';
      reasoning = parsed.reasoning ?? '';
      videoInterests = parsed.interests ?? [];
    } catch { pick = 0; }

    const chosen = allResults[Math.min(Math.max(pick, 0), allResults.length - 1)];
    return {
      title: chosen.title,
      type: 'youtube',
      description: description || `By ${chosen.channelTitle}`,
      reasoning,
      actionUrl: buildYouTubeWatchUrl(chosen.videoId),
      actionLabel: 'Watch on YouTube',
      thumbnailUrl: chosen.thumbnail,
      interests: videoInterests,
    };
  }

  // Fallback: use GPT's suggestion as search
  const fallbackQuery = vibe + ' ' + interests.slice(0, 2).join(' ');
  return {
    title: vibe,
    type: 'youtube',
    description: 'Could not find a specific video. Here is a search instead.',
    reasoning: '',
    actionUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(fallbackQuery)}`,
    actionLabel: 'Search YouTube',
    interests: interests.slice(0, 5),
  };
}

async function getSubstackRecommendation(
  vibe: string,
  _userPrompt: string,
  interests: string[],
  tasteProfile: string | null = null,
  existingTitles: string[] = []
): Promise<Recommendation> {
  const openai = getOpenAI();

  // Step 0: Expand the vibe into a rich concept blended with interests
  const expandedVibe = await expandVibe(openai, vibe, interests, tasteProfile);

  // Step 1: GPT generates search queries from the expanded concept
  const queryResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: `You generate creative, diverse search queries to find Substack articles. Think laterally — explore unexpected angles, adjacent topics, and niche intersections, but ALWAYS stay rooted in the user's vibe.

Return ONLY a JSON array of 4-5 search strings. No markdown.`,
      },
      {
        role: 'user',
        content: `The user wants: "${vibe}"\n\nExpanded concept: ${expandedVibe}

Generate 4-5 search queries to find Substack articles. The vibe/prompt "${vibe}" is the ABSOLUTE #1 priority — never drift from it. Rules:
- 3 queries should directly match the vibe (highest priority — the vibe IS the topic)
- 1 query should creatively blend the vibe with their interests (e.g. if vibe is "feminist mythology" and they like philosophy, try "feminist mythology philosophy ancient goddesses essay")
- 1 query should be a creative angle ON THE SAME TOPIC that could surprise them
- ALL queries must be directly about "${vibe}". Interests refine, never replace.`,
      },
    ],
  });

  let queries: string[];
  try {
    queries = JSON.parse(queryResponse.choices[0]?.message?.content ?? '[]');
  } catch {
    queries = [vibe, ...interests.slice(0, 2)];
  }

  // Step 2: Search for real articles via Brave
  const realArticles: SubstackSearchResult[] = await searchSubstackMulti(queries);

  if (realArticles.length > 0) {
    // Step 3: GPT picks the best from real results
    const articleList = realArticles.slice(0, 15).map((a, i) =>
      `${i + 1}. "${a.title}"\n   ${a.url}\n   ${a.description}`
    ).join('\n');

    const pickResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Pick the best article from a list of real Substack articles. Return ONLY JSON: {"pick": <number>, "reasoning": "why this fits", "interests": ["tag1", "tag2", "tag3"]}',
        },
        {
          role: 'user',
          content: `Vibe: "${vibe}"\n${interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}${tasteProfile ? `\n\nUser taste: ${tasteProfile.slice(0, 400)}` : ''}${existingTitles.length > 0 ? `\n\nDO NOT pick any of these (already in library): ${existingTitles.slice(0, 20).join(', ')}` : ''}\n\nPick the article that best matches the vibe "${vibe}" AND resonates with their personality:\n\n${articleList}`,
        },
      ],
    });

    let pick = 0;
    let reasoning = '';
    let articleInterests: string[] = [];
    try {
      const parsed = JSON.parse(pickResponse.choices[0]?.message?.content ?? '{}');
      pick = (parsed.pick ?? 1) - 1;
      reasoning = parsed.reasoning ?? '';
      articleInterests = parsed.interests ?? [];
    } catch { pick = 0; }

    const chosen = realArticles[Math.min(Math.max(pick, 0), realArticles.length - 1)];
    return {
      title: chosen.title,
      type: 'substack',
      description: chosen.description || 'A Substack article matching your vibe.',
      reasoning,
      actionUrl: chosen.url,
      actionLabel: 'Read on Substack',
      interests: articleInterests,
    };
  }

  // Fallback: GPT hallucinate-and-verify loop (no Brave key or no results)
  const MAX_ATTEMPTS = 5;
  const tried: string[] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.9 + attempt * 0.02,
      messages: [
        {
          role: 'system',
          content: `Recommend a REAL Substack article from a well-known publication. Include the exact URL. Respond with ONLY JSON:
{"title": "...", "author": "...", "substackUrl": "https://author.substack.com/p/slug", "description": "...", "reasoning": "...", "interests": ["tag1", "tag2"]}`,
        },
        {
          role: 'user',
          content: `Vibe: "${vibe}"\n${interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}\n${tried.length > 0 ? `These didn't work, try different ones:\n${tried.map(t => `- ${t}`).join('\n')}` : ''}`,
        },
      ],
    });

    let ai: { title?: string; author?: string; substackUrl?: string; description?: string; reasoning?: string; interests?: string[] };
    try { ai = JSON.parse(response.choices[0]?.message?.content ?? '{}'); } catch { continue; }

    const url = ai.substackUrl;
    const title = ai.title ?? 'Unknown';
    if (!url || tried.includes(title)) continue;
    tried.push(title);

    if (await verifyUrl(url)) {
      return {
        title,
        type: 'substack',
        description: ai.description ?? `By ${ai.author ?? 'unknown'}`,
        reasoning: ai.reasoning ?? '',
        actionUrl: url,
        actionLabel: 'Read on Substack',
        interests: ai.interests,
      };
    }
  }

  const query = `${vibe} ${interests.slice(0, 2).join(' ')}`.trim();
  return {
    title: tried[0] ?? vibe,
    type: 'substack',
    description: `Couldn't find a verified article. Here's a search instead.`,
    reasoning: '',
    actionUrl: `https://substack.com/search/${encodeURIComponent(query)}`,
    actionLabel: 'Search Substack',
    interests: interests.slice(0, 5),
  };
}

export async function getRecommendation(
  vibe: string,
  contentType: ContentType,
  discoveryMode: DiscoveryMode = 'something_new',
  useInterests: boolean = true
): Promise<Recommendation> {
  const favorites = await getAllFavorites();
  const allProgress = await getAllProgress();

  // Fetch rejected titles
  let rejectedTitles: string[] = [];
  try {
    const { db: getDb } = await import('@/lib/db');
    const client = await getDb();
    const rejResult = await client.execute('SELECT title FROM rejected_recommendations');
    rejectedTitles = rejResult.rows.map((r: unknown) => (r as { title: string }).title);
  } catch { /* ignore */ }
  const ratings = await getAllRatings();

  // Fetch user interests
  let interests: string[] = [];
  if (useInterests) {
    try {
      const { db: getDb } = await import('@/lib/db');
      const client = await getDb();
      const intResult = await client.execute('SELECT name FROM interests ORDER BY name');
      interests = intResult.rows.map((r: unknown) => (r as { name: string }).name);
    } catch { /* ignore */ }
  }

  // Fetch people the user loves
  let peopleSection = '';
  try {
    const { getAllPeople } = await import('@/lib/people');
    const people = await getAllPeople();
    if (people.length > 0) {
      const grouped: Record<string, string[]> = {};
      for (const p of people) {
        const role = p.role ?? 'creator';
        if (!grouped[role]) grouped[role] = [];
        grouped[role].push(p.name);
      }
      peopleSection = '\n\nPeople the user loves:\n' + Object.entries(grouped).map(([role, names]) => `  ${role}s: ${names.join(', ')}`).join('\n') + '\n\nPrioritize content featuring or created by these people. If recommending something new, look for works by the same people or similar creators.';
    }
  } catch { /* ignore */ }

  // Load user preferences (condensed taste profile)
  let tasteProfile: string | null = null;
  try {
    const { getUserPreferences } = await import('@/lib/user-preferences');
    tasteProfile = await getUserPreferences();
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

  // If we have a taste profile, use it instead of the full library for efficiency
  let userPrompt: string;
  if (tasteProfile) {
    userPrompt = [
      `The user's current vibe: "${vibe}"`,
      `They want a recommendation for: ${contentType}`,
      interests.length > 0 ? `\nInterests: ${interests.join(', ')}` : '',
      peopleSection,
      `\n--- USER TASTE PROFILE ---\n${tasteProfile}\n--- END PROFILE ---`,
      '',
      discoveryMode === 'from_library'
        ? `Recommend something from their existing library.`
        : `Recommend something NEW they haven't seen.`,
      '',
      buildRecommendationPrompt(vibe, contentType, favorites, watchProgress, ratings, discoveryMode, interests).split('Your task:').pop() ?? '',
    ].join('\n');
  } else {
    userPrompt = buildRecommendationPrompt(vibe, contentType, favorites, watchProgress, ratings, discoveryMode, interests);
  }

  const existingTitles = [...favorites.map(f => f.title), ...rejectedTitles];

  // --- YOUTUBE: two-pass approach with real videos ---
  if (contentType === 'youtube') {
    return getYouTubeRecommendation(vibe, userPrompt, interests, tasteProfile, existingTitles);
  }

  // --- SUBSTACK: two-pass approach with real articles ---
  if (contentType === 'substack') {
    return getSubstackRecommendation(vibe, userPrompt, interests, tasteProfile, existingTitles);
  }

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content:
          'You are a personal entertainment recommendation engine. The user\'s vibe/prompt is your ABSOLUTE #1 priority — never ignore or drift from what they asked for. Their interests and taste profile help you find the BEST match within their requested topic, but they never override the vibe. If they say "feminist mythology", every recommendation must be directly about feminist mythology.',
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

  // At this point contentType is movie/tv/anime/kdrama
  const actionUrl = contentType === 'kdrama'
    ? `https://kissasian.cam/series/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}/`
    : `https://sflix.ps/search/${encodeURIComponent(title)}`;
  const actionLabel = contentType === 'kdrama' ? 'Watch on KissAsian' : 'Watch on sflix';

  // Fetch poster and stills
  let imageUrls: string[] = [];
  let thumbnailUrl: string | undefined;

  if (contentType === 'anime') {
    // Jikan for poster, TMDB for episode stills/backdrops, Jikan art as last resort
    const [jikan, tmdb] = await Promise.all([
      searchAnimeJikan(title),
      searchTMDB(title, 'tv'),
    ]);
    thumbnailUrl = jikan?.posterUrl ?? tmdb?.posterUrl ?? undefined;
    imageUrls = tmdb?.backdropUrls?.length ? tmdb.backdropUrls : (jikan?.backdropUrls ?? []);
  } else {
    const tmdbType = contentType === 'movie' ? 'movie' : 'tv';
    const tmdb = await searchTMDB(title, tmdbType);
    if (tmdb?.posterUrl) thumbnailUrl = tmdb.posterUrl;
    imageUrls = tmdb?.backdropUrls ?? [];
  }

  // Gradient fallbacks if no images found
  if (imageUrls.length === 0 && !thumbnailUrl) {
    imageUrls = [0, 1, 2].map(i => `gradient:${i}:${encodeURIComponent(title)}`);
  }

  // Fetch Reddit insights
  let redditInsights;
  try {
    redditInsights = await searchRedditForTitle(title, contentType);
  } catch {
    // Reddit search is best-effort
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
    tropes: ai.tropes,
  };
}
