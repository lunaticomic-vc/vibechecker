import { getOpenAI } from '@/lib/openai';
import { getAllFavorites } from '@/lib/favorites';
import { getAllProgress } from '@/lib/progress';
import { getAllRatings } from '@/lib/ratings';
import { searchRedditForTitle } from '@/lib/reddit';
import { searchTMDB, searchTMDBMulti } from '@/lib/tmdb';
import type { TMDBSearchResult } from '@/lib/tmdb';
import { searchSubstackMulti } from '@/lib/substack';
import type { SubstackSearchResult } from '@/lib/substack';
import { searchYouTube, buildYouTubeWatchUrl, getVideoDetails, formatDuration } from '@/lib/youtube';
import type { YouTubeResult } from '@/lib/youtube';
import { searchAnimeJikan, searchAnimeJikanMulti } from '@/lib/mal';
import type { JikanSearchResult } from '@/lib/mal';
import type { ContentType, DiscoveryMode, Favorite, WatchProgress, Rating, Recommendation } from '@/types/index';
import { db } from '@/lib/db';
import { searchMangaJikanMulti, searchSteamGamesMulti } from '@/lib/mal';
import { getAllPeople } from '@/lib/people';
import { getUserPreferences } from '@/lib/user-preferences';
import { log } from '@/lib/logger';

async function verifyUrl(url: string): Promise<boolean> {
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

  // Cap the per-type flat list at ~100 items and prioritize loved/enjoyed to avoid
  // token bomb: previously the full library (up to 10k titles) was inlined.
  const RATING_WEIGHT: Record<string, number> = { felt_things: 0, enjoyed: 1, watched: 2, not_my_thing: 3 };
  const prioritizedFavs = [...favorites]
    .sort((a, b) => {
      const ra = ratingsMap.get(a.id)?.rating ?? 'watched';
      const rb = ratingsMap.get(b.id)?.rating ?? 'watched';
      return (RATING_WEIGHT[ra] ?? 2) - (RATING_WEIGHT[rb] ?? 2);
    })
    .slice(0, 100);

  const byType: Record<string, string[]> = {};
  for (const fav of prioritizedFavs) {
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

  // New: treat "enjoyed" as a positive-but-lighter signal so it isn't collapsed with "watched".
  const enjoyed = favorites
    .filter(f => ratingsMap.get(f.id)?.rating === 'enjoyed')
    .map(f => `  "${f.title}"`)
    .slice(0, 40);

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
    research: 'Suggest a focused research topic or learning path. Provide 3-5 curated links (articles, papers, videos) as a knowledge checklist. Include a clear starting point and a suggested order for exploring the topic.',
    poetry: 'Suggest a specific poem or poet. Include the poem title, author, and a brief note on its themes and emotional tone. Provide a link to read it online.',
    short_story: 'Suggest a specific short story. Include the title, author, and collection it appears in if applicable. Describe the mood and themes briefly.',
    book: 'Suggest a specific book. Include the title, author, and year. Focus on why it matches the user\'s current vibe — themes, prose style, emotional resonance.',
    essay: 'Suggest a specific essay. Include the title, author, and where it can be read. Focus on the intellectual or emotional angle that matches the user\'s mood.',
    podcast: 'Suggest a specific podcast episode (NOT just a show). Include the episode title, podcast name, and a searchQuery to find it. Describe what makes this episode match the vibe.',
    manga: 'Suggest a specific manga series. Include the title, author/mangaka, and number of volumes or chapters if relevant. Focus on art style, story depth, and emotional resonance with the user\'s vibe.',
    comic: 'Suggest a specific comic book series or graphic novel. Include the title, writer/artist, and publisher. Focus on art style, narrative tone, and thematic depth that matches the user\'s mood.',
    game: 'Suggest a specific video game. Include the title, developer/studio, platform(s), and year. Focus on gameplay feel, atmosphere, narrative depth, and emotional experience that matches the user\'s vibe.',
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
    enjoyed.length > 0 ? `Content the user ENJOYED (positive signal, lighter weight than "felt things"):\n${enjoyed.join('\n')}\n\nThese represent the user's baseline taste — recommend in a similar vein, but the "felt things" list above takes priority.` : '',
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
    'CRITICAL: The user\'s vibe/prompt is your #1 priority. NEVER ignore what they asked for. The vibe IS the assignment — everything else (interests, taste profile, library) exists to ENHANCE your understanding of what they want, not to override it.',
    'FIGURATIVE vs LITERAL: Users describe vibes using feelings, metaphors, and experiences — NOT literal topics. ALWAYS interpret the FEELING behind the words, not the words themselves. Examples: "rabbit hole I can get lost in" = something deeply absorbing with layers to explore, NOT content about rabbits or holes. "Something that hits like a warm blanket" = cozy, comforting, emotionally safe — NOT content about blankets. "Brain candy" = intellectually stimulating and fun — NOT content about candy or brains. "A slow burn" = gradually building tension/romance — NOT content about fire. Think: what EXPERIENCE is the user asking for? Recommend content that DELIVERS that experience.',
    'CONTEXT vs TOPIC: If the user mentions an activity or situation (eating, having lunch, having dinner, breakfast, cooking, commuting, on the bus, working out, in bed, etc.), that describes their SITUATION — not what they want content about. Format hints by activity: "eating/lunch/dinner/breakfast" → light, engaging, easy to follow without full attention, not emotionally heavy or demanding; "commuting/on the bus/on the train" → works as background or audio-forward, episodic or self-contained; "working out" → high energy, motivating, fast-paced; "in bed/winding down" → calm, low-stakes, nothing anxiety-inducing. Use the REST of the vibe for topic — never recommend food/workout/travel content just because they mentioned an activity.',
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
  // Plain text response — no JSON schema needed here.
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content: `You expand a user's vibe description into a rich, evocative search concept for finding content recommendations.

CRITICAL — VIBE vs LITERAL TOPIC:
Most user inputs describe a MOOD, FEELING, or EXPERIENCE they want — NOT a literal subject to research.
- "a rabbit hole I can get lost in" → they want something FASCINATING and DEEP to explore, not content about rabbit holes
- "something that makes me question everything" → they want mind-bending, perspective-shifting content, not philosophy lectures
- "cozy and warm" → they want content that FEELS comforting, not content about warmth
- "unhinged and chaotic" → they want wild, unpredictable, entertaining content
- "need a good cry" → they want emotionally devastating content
Only interpret as a literal topic if the user clearly names a specific subject (e.g. "ancient Rome", "quantum physics", "feminism in mythology").

Rules:
- MOST IMPORTANT: Interpret the prompt FIGURATIVELY, not literally. Users describe vibes as feelings, metaphors, and desired experiences. "rabbit hole I can get lost in" means something deeply absorbing with layers — NOT content about rabbit holes. "hits like a warm blanket" means cozy and comforting — NOT content about blankets. "brain candy" means intellectually fun — NOT content about candy. Always ask: what EXPERIENCE is the user describing?
- Unpack the prompt's specific emotions (go granular: not just "sad" but "bittersweet nostalgia", "anxious excitement", "quiet melancholy", "restless yearning"), energy level (low/medium/high), sensory qualities (dark/bright, slow/kinetic, sparse/lush), and core ideas
- Identify the emotional state the user is seeking — are they looking to feel comforted, challenged, moved, uplifted, or unsettled?
- ONLY include user interests that DIRECTLY relate to the prompt topic. If an interest doesn't connect, drop it completely.
- If the prompt is specific (e.g. "feminist mythology"), every word of your expansion must be about that exact topic
- Activity words like "eating", "having lunch", "having dinner", "breakfast", "cooking", "commuting", "on the bus", "working out", "in bed" describe what the user is DOING right now — NOT requesting content about that activity. "Eating/lunch/dinner" → light, engaging, easy to follow without full attention. "Commuting/on the bus" → works as audio-forward or without constant visual focus. "Working out" → high energy, motivating. "In bed/winding down" → calm, not too intense. Never drift to food/workout/travel content from these cues.
- Return 2-3 sentences capturing the emotional + sensory essence, no JSON`,
      },
      {
        role: 'user',
        content: `Prompt: "${vibe}"${interests.length > 0 ? `\nUser interests (ONLY include if directly relevant to "${vibe}"): ${interests.join(', ')}` : ''}${tasteProfile ? `\nTaste (for tone only): ${tasteProfile.slice(0, 200)}` : ''}`,
      },
    ],
  });
  return res.choices[0]?.message?.content ?? vibe;
}

interface VibeFacets {
  mood: string;
  genres: string[];
  themes: string[];
  aesthetic: string;
  intensity: string;
  pacing?: string;
  tone?: string;
  surprise_openness?: string;
}

async function decomposeVibe(openai: ReturnType<typeof getOpenAI>, vibe: string): Promise<VibeFacets> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Decompose a user's vibe into structured facets. Return ONLY JSON:
{"mood": "granular emotional tone (e.g. 'bittersweet nostalgia', 'anxious excitement', 'cozy melancholy', 'restless wonder')", "genres": ["genre1", "genre2"], "themes": ["theme1", "theme2"], "aesthetic": "visual/tonal style description", "intensity": "low/medium/high", "pacing": "slow-burn/steady/fast-paced", "tone": "e.g. dry-wit/sincere/darkly-comic/earnest/sardonic", "surprise_openness": "low/medium/high"}
CRITICAL — VIBE vs LITERAL: Most inputs are MOODS, not literal subjects. "a rabbit hole I can get lost in" = fascinating/deep/obsessive, NOT about rabbits. "something that makes me question everything" = mind-bending/perspective-shifting, NOT a philosophy lecture. "need a good cry" = emotionally devastating content. Only treat as literal topic if user names a specific subject (e.g. "ancient Rome", "quantum physics").
IMPORTANT: Activity/situation words like "eating", "having lunch", "having dinner", "breakfast", "cooking", "commuting", "working out", "in bed", "on the bus" describe what the user is DOING — they are NOT the topic. Do NOT include food, meal, or cooking themes. Extract mood and themes from the REST of the vibe. Let activity context influence pacing/intensity only: "eating" → steady/low-medium; "commuting" → steady; "working out" → fast-paced/high; "in bed" → slow-burn/low.`,
        },
        { role: 'user', content: `Vibe: "${vibe}"` },
      ],
    });
    return JSON.parse(res.choices[0]?.message?.content ?? '{}') as VibeFacets;
  } catch (error) {
    log.warn('Failed to decompose vibe into facets', String(error));
    return { mood: vibe, genres: [], themes: [], aesthetic: '', intensity: 'medium' };
  }
}

function analyzeTastePatterns(favorites: Favorite[], ratings: Rating[]): string {
  const ratingsMap = new Map<number, Rating>();
  for (const r of ratings) ratingsMap.set(r.favorite_id, r);

  const loved = favorites.filter(f => ratingsMap.get(f.id)?.rating === 'felt_things');
  if (loved.length < 2) return '';

  const reasons = loved
    .map(f => ratingsMap.get(f.id)?.reasoning)
    .filter(Boolean);
  const titles = loved.map(f => f.title);

  return `TASTE PATTERNS from ${loved.length} loved items (${titles.join(', ')}):
${reasons.length > 0 ? `Their stated reasons for loving these: ${reasons.join('; ')}` : ''}
Identify DEEP PATTERNS — go beyond surface genre matches:
- EMOTIONAL ARCS: Do they love transformation journeys? Quiet character studies? Cathartic resolutions? Ambiguous endings?
- AESTHETIC PREFERENCES: What visual/tonal qualities recur (atmospheric, minimalist, maximalist, gritty realism, lush stylization)?
- PACING PREFERENCES: Do they gravitate toward slow burns or tight fast-paced narratives?
- TONE SIGNATURES: Recurring tone (dry wit, sincere earnestness, dark humor, lyrical sadness, deadpan)?
- CHARACTER DYNAMICS: Relationship types or archetypes they connect with (found family, morally complex leads, unlikely mentors)?
Prioritize recommendations that match these deep fingerprints, not just surface genre.`;
}

async function getYouTubeRecommendation(
  vibe: string,
  userPrompt: string,
  interests: string[],
  tasteProfile: string | null = null,
  existingTitles: string[] = []
): Promise<Recommendation> {
  const openai = getOpenAI();

  // Step 0: Expand the vibe WITHOUT interests — interests only used for picking later
  const expandedVibe = await expandVibe(openai, vibe, [], tasteProfile);

  // Step 1: GPT generates search queries from VIBE ONLY — no interests pollution
  const queryResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Generate YouTube search queries to find full-length videos (NOT Shorts). Return ONLY a JSON object with a "queries" field: {"queries": ["query1", "query2", ...]}. 4-5 specific search strings.`,
      },
      {
        role: 'user',
        content: `The user wants: "${vibe}"\n\nExpanded concept: ${expandedVibe}\n\nGenerate 4-5 YouTube search queries with this mix:\n- 2 direct queries: literal about "${vibe}" (video essays, deep dives, explainers, niche creators)\n- 1 lateral query: an unexpected angle or tangentially related concept that captures the same FEELING as "${vibe}" but approaches it from a surprising direction\n- 1 format-specific query: combine the topic with a format (e.g. "documentary", "analysis", "essay", "breakdown", "history of", "deep dive")\n- 1 niche creator query: target smaller passionate creators over mainstream channels (think indie, underrated, or niche community spaces)\nThe lateral query should be genuinely surprising — what unexpected topic FEELS exactly like "${vibe}"?`,
      },
    ],
  });

  let queries: string[];
  try {
    const parsedQ = JSON.parse(queryResponse.choices[0]?.message?.content ?? '{}');
    queries = Array.isArray(parsedQ) ? parsedQ : (parsedQ.queries ?? [vibe]);
  } catch { queries = [vibe]; }

  // Step 2: Search YouTube for real videos (excludes Shorts via duration filter)
  const allResults: YouTubeResult[] = [];
  const seen = new Set<string>();
  const searchResults = await Promise.all(queries.map(q => searchYouTube(q, true)));
  for (const results of searchResults) {
    for (const r of results) {
      if (!seen.has(r.videoId)) { seen.add(r.videoId); allResults.push(r); }
    }
  }

  if (allResults.length > 0) {
    // Step 2.5: Fetch duration + view counts for quality signal (#3, #9)
    const candidates = allResults.slice(0, 12);
    const details = await getVideoDetails(candidates.map(v => v.videoId));
    const detailsMap = new Map(details.map(d => [d.videoId, d]));

    // Step 3: GPT picks the best video with validation
    const videoList = candidates.map((v, i) => {
      const d = detailsMap.get(v.videoId);
      const dur = d ? formatDuration(d.durationSeconds) : '?';
      const views = d ? `${Math.round(d.viewCount / 1000)}K views` : '';
      return `${i + 1}. "${v.title}" by ${v.channelTitle || 'unknown'} [${dur}${views ? ', ' + views : ''}]`;
    }).join('\n');

    const pickResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Pick the best YouTube video from a list that GENUINELY matches the user's vibe.

SCORING — rate each candidate on THREE dimensions:
1. VIBE RELEVANCE (1-10): Is this actually about what the user asked for?
2. EMOTIONAL RESONANCE (1-10): Does it capture the specific mood/feeling, not just the topic?
3. NOVELTY (1-10): Is this something the user likely hasn't seen? Niche/indie creators score higher than mega-viral videos.

Only pick videos averaging 7+ across all three. If NONE average 7+, set "pick" to 0.
TIE-BREAKING: Favor novelty over views — the hidden gem over the obvious top result.
Additional rules:
- Interests are SECONDARY — use for tie-breaking only.
- For "interests": ONLY include tags that genuinely describe this video. Do NOT copy user tags unless they truly apply.
- If the user mentions a duration preference (e.g. "long", "1 hour", "quick"), prefer videos matching that length.

Return ONLY JSON: {"pick": <number or 0>, "score": <1-10>, "description": "brief summary", "reasoning": "why this SPECIFICALLY matches the vibe and mood", "interests": ["tag1", "tag2"]}`,
        },
        {
          role: 'user',
          content: `Vibe: "${vibe}"${interests.length > 0 ? `\nUser interests (for tie-breaking only, do NOT force-fit): ${interests.join(', ')}` : ''}${existingTitles.length > 0 ? `\n\nDO NOT pick any of these (already in library): ${existingTitles.slice(0, 20).join(', ')}` : ''}\n\nRate and pick the video that best matches "${vibe}":\n\n${videoList}`,
        },
      ],
    });

    let pick = 0, description = '', reasoning = '', videoInterests: string[] = [];
    try {
      const parsed = JSON.parse(pickResponse.choices[0]?.message?.content ?? '{}');
      pick = (parsed.pick ?? 0) - 1;
      description = parsed.description ?? '';
      reasoning = parsed.reasoning ?? '';
      videoInterests = parsed.interests ?? [];
    } catch { pick = -1; }

    // If GPT said none match (pick=0 → -1 after subtract), retry with more targeted queries
    if (pick < 0 || pick >= candidates.length) {
      const retryResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.9,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `The previous YouTube search for "${vibe}" returned irrelevant results. Generate 3 MORE SPECIFIC search queries that will find videos actually about "${vibe}". Be very literal and precise. Return ONLY a JSON object: {"queries": ["q1","q2","q3"]}.`,
          },
          {
            role: 'user',
            content: `Original vibe: "${vibe}"\nThese titles came back but were wrong:\n${candidates.slice(0, 5).map(v => `- "${v.title}"`).join('\n')}\n\nGenerate better, more specific queries.`,
          },
        ],
      });

      let retryQueries: string[];
      try {
        const parsed = JSON.parse(retryResponse.choices[0]?.message?.content ?? '{}');
        retryQueries = Array.isArray(parsed) ? parsed : (parsed.queries ?? [`${vibe} video essay`]);
      } catch { retryQueries = [`${vibe} video essay`]; }

      const retryResults: YouTubeResult[] = [];
      const retrySeen = new Set(seen);
      const retrySearchResults = await Promise.all(retryQueries.map(q => searchYouTube(q, true)));
      for (const results of retrySearchResults) {
        for (const r of results) {
          if (!retrySeen.has(r.videoId)) { retrySeen.add(r.videoId); retryResults.push(r); }
        }
      }

      if (retryResults.length > 0) {
        const retryList = retryResults.slice(0, 10).map((v, i) =>
          `${i + 1}. "${v.title}" by ${v.channelTitle || 'unknown'}`
        ).join('\n');

        const retryPick = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.7,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `Pick the best YouTube video that GENUINELY matches "${vibe}". If none match, pick the closest one. Return ONLY JSON: {"pick": <number>, "description": "brief summary", "reasoning": "why this fits", "interests": ["tag1", "tag2"]}`,
            },
            {
              role: 'user',
              content: `Vibe: "${vibe}"\n\n${retryList}`,
            },
          ],
        });

        try {
          const parsed = JSON.parse(retryPick.choices[0]?.message?.content ?? '{}');
          pick = (parsed.pick ?? 1) - 1;
          description = parsed.description ?? '';
          reasoning = parsed.reasoning ?? '';
          videoInterests = parsed.interests ?? [];
        } catch { pick = 0; }

        const chosen = retryResults[Math.min(Math.max(pick, 0), retryResults.length - 1)];
        return {
          title: chosen.title,
          type: 'youtube',
          description: description || `By ${chosen.channelTitle}`,
          reasoning,
          actionUrl: buildYouTubeWatchUrl(chosen.videoId),
          actionLabel: 'Watch on YouTube',
          thumbnailUrl: chosen.thumbnail,
          interests: videoInterests,
          channelName: chosen.channelTitle || undefined,
        };
      }
    }

    const chosen = candidates[Math.min(Math.max(pick, 0), candidates.length - 1)];
    return {
      title: chosen.title,
      type: 'youtube',
      description: description || `By ${chosen.channelTitle}`,
      reasoning,
      actionUrl: buildYouTubeWatchUrl(chosen.videoId),
      actionLabel: 'Watch on YouTube',
      thumbnailUrl: chosen.thumbnail,
      interests: videoInterests,
      channelName: chosen.channelTitle || undefined,
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
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You generate search queries to find high-quality, niche Substack articles — not surface-level hits. Target specific intellectual spaces, respected voices, and deep cuts. Return ONLY a JSON object: {"queries": ["q1","q2",...]} with 5-6 search strings.`,
      },
      {
        role: 'user',
        content: `The user wants: "${vibe}"\n\nExpanded concept: ${expandedVibe}

Generate 5-6 search queries to find exceptional Substack articles. "${vibe}" is the #1 priority. Structure:
- 2 direct topic queries: precise about "${vibe}" as a curious reader would search
- 1 intellectual angle query: frame the topic from a specific perspective (critical theory, personal essay, historical, philosophical, or scientific lens)
- 1 author/publication-targeting query: think of the KIND of writer who covers this deeply (e.g. "feminist cultural critic substack", "independent film essayist", "cognitive scientist newsletter") — targets niche respected voices over mainstream
- 1 adjacent intersection query: blend "${vibe}" with a neighboring discipline that creates surprising depth
- 1 format-targeted query: target a specific article form that suits this topic (e.g. "long read", "personal essay", "reported piece", "letter")
ALL queries stay rooted in "${vibe}". Aim for depth and quality over popularity.`,
      },
    ],
  });

  let queries: string[];
  try {
    const parsed = JSON.parse(queryResponse.choices[0]?.message?.content ?? '{}');
    queries = Array.isArray(parsed) ? parsed : (parsed.queries ?? [vibe, ...interests.slice(0, 2)]);
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
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Pick the best article from a list of real Substack articles that GENUINELY matches the user's vibe.

SCORING — rate each article on THREE dimensions:
1. VIBE RELEVANCE (1-10): Is it actually about what the user asked for?
2. DEPTH & QUALITY (1-10): Does it go beyond surface-level? Is it a thoughtful long read, personal essay, or incisive critique — not a listicle or generic overview?
3. NOVELTY (1-10): Is this a non-obvious find? Niche author or unique angle scores higher than top-10 mainstream articles.

Pick the article averaging highest. Return ONLY JSON: {"pick": <number>, "reasoning": "why this fits the vibe and what makes it worth reading", "interests": ["tag1", "tag2", "tag3"]}`,
        },
        {
          role: 'user',
          content: `Vibe: "${vibe}"\n${interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}${tasteProfile ? `\n\nUser taste: ${tasteProfile.slice(0, 400)}` : ''}${existingTitles.length > 0 ? `\n\nDO NOT pick any of these (already in library): ${existingTitles.slice(0, 20).join(', ')}` : ''}\n\nPick the article that best matches "${vibe}" and would genuinely be worth reading:\n\n${articleList}`,
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
      response_format: { type: 'json_object' },
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

// --- SCREEN CONTENT (movie/tv/anime/kdrama): two-pass with real search results ---
async function getScreenRecommendation(
  vibe: string,
  contentType: ContentType,
  interests: string[],
  tasteProfile: string | null,
  existingTitles: string[],
  tastePatterns: string,
  rejectionReasons: string[],
  peopleSection: string,
  discoveryMode: DiscoveryMode,
): Promise<Recommendation> {
  const openai = getOpenAI();

  // Step 1: Decompose vibe into structured facets (#6)
  const facets = await decomposeVibe(openai, vibe);
  const contentLabelMap: Record<string, string> = {
    movie: 'movies', tv: 'TV shows', anime: 'anime', kdrama: 'Korean dramas',
    book: 'books', poetry: 'poems', short_story: 'short stories', essay: 'essays',
    podcast: 'podcasts', research: 'research topics', manga: 'manga', comic: 'comics',
    game: 'games',
  };
  const contentLabel = contentLabelMap[contentType] ?? contentType;

  // Step 2: Generate actual title suggestions from facets (TMDB needs titles, not vibes)
  const queryResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a ${contentLabel} expert with deep knowledge of mainstream hits, cult classics, international gems, and obscure picks. Suggest 10-12 REAL ${contentLabel} TITLES that match the vibe. Return ONLY a JSON object: {"titles": ["title1", "title2", ...]} with 10-12 entries.

CRITICAL: Every suggestion MUST be a ${contentLabel} — not a different content type. For example, if asked for books, do NOT suggest essays, articles, or films. If asked for poems, do NOT suggest song lyrics or novels. If asked for short stories, do NOT suggest novels or novellas. Be precise about the medium.

VIBE INTERPRETATION: The user's vibe describes a MOOD or FEELING they want, not a literal subject. "a rabbit hole I can get lost in" means something fascinating and deep, not content about rabbit holes. "something that makes me question everything" means mind-bending content, not a philosophy textbook. Recommend ${contentLabel} that EVOKE the described feeling. Only treat as a literal topic if the user names a specific subject.

DIVERSITY REQUIREMENTS — your list MUST include a mix of:
- 2-3 well-known titles (crowd-pleasers the user might know but genuinely fit the vibe)
- 3-4 hidden gems or cult classics (critically loved but underseen, non-obvious picks)
- 1-2 titles from a different era than the obvious choice (older films, vintage TV, classic anime arcs)
- 1-2 international picks (non-English or non-American originals) if they genuinely match
- 1-2 recent releases (last 3 years) if any exist
- Different subgenres that all serve the same core mood/theme

DO NOT cluster in one era, one popularity tier, or one subgenre. Diversity maximizes the chance of a perfect match.`,
      },
      {
        role: 'user',
        content: `Vibe: "${vibe}"\nMood: ${facets.mood}\nGenres: ${facets.genres.join(', ') || 'any'}\nThemes: ${facets.themes.join(', ') || 'any'}\nAesthetic: ${facets.aesthetic || 'any'}${facets.pacing ? `\nPacing: ${facets.pacing}` : ''}${facets.tone ? `\nTone: ${facets.tone}` : ''}\n\nSuggest 10-12 real ${contentLabel} titles with the diversity mix described above.${existingTitles.length > 0 ? `\n\nDo NOT suggest any of these (already seen): ${existingTitles.slice(0, 30).join(', ')}` : ''}${rejectionReasons.length > 0 ? `\n\nUser previously rejected similar recs for: ${rejectionReasons.join('; ')}. Avoid those patterns.` : ''}`,
      },
    ],
  });

  let queries: string[];
  try {
    const parsed = JSON.parse(queryResponse.choices[0]?.message?.content ?? '{}');
    queries = Array.isArray(parsed) ? parsed : (parsed.titles ?? [vibe]);
  } catch { queries = [vibe]; }

  // Step 3: Search for real content
  type Candidate = { title: string; year: string | null; description: string; score?: number; genres?: string[] };
  let candidates: Candidate[] = [];

  // In from_library mode, candidates MUST come from the user's library, so skip the
  // "not in existingTitles" filter that would otherwise remove everything.
  const excludeExisting = discoveryMode !== 'from_library';

  if (contentType === 'anime') {
    const results = await searchAnimeJikanMulti(queries);
    candidates = results
      .filter(r => excludeExisting ? !existingTitles.includes(r.title) : true)
      .slice(0, 15)
      .map(r => ({ title: r.title, year: r.year, description: r.description, score: r.score, genres: r.genres }));
  } else if (contentType === 'manga') {
    const results = await searchMangaJikanMulti(queries);
    candidates = results
      .filter(r => excludeExisting ? !existingTitles.includes(r.title) : true)
      .slice(0, 15)
      .map(r => ({ title: r.title, year: r.year, description: r.description, score: r.score }));
  } else if (contentType === 'game') {
    const results = await searchSteamGamesMulti(queries);
    candidates = results
      .filter(r => excludeExisting ? !existingTitles.includes(r.title) : true)
      .slice(0, 15)
      .map(r => ({ title: r.title, year: r.year, description: r.description }));
  } else if (contentType === 'comic') {
    // No public catalog API for comics — let the GPT-direct path handle it
    candidates = [];
  } else {
    const tmdbType = contentType === 'movie' ? 'movie' as const : 'tv' as const;
    const results = await searchTMDBMulti(queries, tmdbType);
    candidates = results
      .filter(r => excludeExisting ? !existingTitles.includes(r.title) : true)
      .slice(0, 15)
      .map(r => ({ title: r.title, year: r.year, description: r.description, score: r.voteAverage }));
  }

  if (candidates.length === 0 && contentType !== 'comic') {
    // Fallback: broader title-based queries
    queries = [
      `best ${contentLabel} ${facets.mood}`,
      `top ${contentLabel} ${facets.genres[0] || ''} ${facets.themes[0] || ''}`.trim(),
      `popular ${contentLabel} ${vibe.split(' ').slice(0, 3).join(' ')}`,
    ];
    if (contentType === 'anime') {
      const results = await searchAnimeJikanMulti(queries);
      candidates = results.slice(0, 10).map(r => ({ title: r.title, year: r.year, description: r.description, score: r.score, genres: r.genres }));
    } else if (contentType === 'manga') {
      const results = await searchMangaJikanMulti(queries);
      candidates = results.slice(0, 10).map(r => ({ title: r.title, year: r.year, description: r.description, score: r.score }));
    } else if (contentType === 'game') {
      const results = await searchSteamGamesMulti(queries);
      candidates = results.slice(0, 10).map(r => ({ title: r.title, year: r.year, description: r.description }));
    } else {
      const tmdbType = contentType === 'movie' ? 'movie' as const : 'tv' as const;
      const results = await searchTMDBMulti(queries, tmdbType);
      candidates = results.slice(0, 10).map(r => ({ title: r.title, year: r.year, description: r.description, score: r.voteAverage }));
    }
  }

  // Step 4: GPT picks the best with confidence scoring (#4) + temperature ladder (#7)
  const candidateList = candidates.map((c, i) =>
    `${i + 1}. "${c.title}" (${c.year ?? '?'})${c.score ? ` [${c.score}/10]` : ''}${c.genres ? ` {${c.genres.join(', ')}}` : ''} — ${c.description.slice(0, 200)}`
  ).join('\n');

  const MAX_PICK_ATTEMPTS = 2;
  let title = '', description = '', reasoning = '', year: string | undefined, episodeInfo: string | undefined;
  let pickedActors: string[] | undefined, pickedTropes: string[] | undefined, pickedInterests: string[] | undefined;

  for (let attempt = 0; attempt < MAX_PICK_ATTEMPTS; attempt++) {
    const temperature = 0.7 + attempt * 0.15; // #7: temperature ladder

    const pickResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Pick the best ${contentLabel} from a list that GENUINELY matches the user's vibe.

CONTENT TYPE VALIDATION — CRITICAL:
The user specifically requested a ${contentLabel}. You MUST verify your pick is actually a ${contentLabel}.
- If a candidate is a different content type (e.g. an essay when they asked for a book, a film when they asked for a short story, a TV show when they asked for a movie), SKIP IT and set "is_correct_type" to false.
- Only pick candidates that are genuinely ${contentLabel}. Set "is_correct_type" to true for valid picks.

SCORING — rate each candidate on THREE dimensions, then average for overall score:
1. VIBE RELEVANCE (1-10): Does it directly match what the user asked for — thematically, tonally, emotionally?
2. EMOTIONAL RESONANCE (1-10): Does it hit the specific emotional register being sought? The exact mood, not just the genre?
3. NOVELTY (1-10): How likely is it the user HASN'T seen this? Obscure gems score higher, blockbusters everyone knows score lower.

Only pick items with an AVERAGE score of 7+ AND "is_correct_type" = true. If NONE qualify, set "pick" to 0.
TIE-BREAKING: ${tastePatterns ? 'Use taste patterns to find what matches their emotional fingerprint.' : 'Favor higher novelty — the hidden gem over the obvious pick when relevance is equal.'}
${peopleSection ? 'BONUS: Prefer content featuring people the user loves.' : ''}

REQUIRED FIELDS — fill ALL with real, detailed content:
- "description": A compelling 2-3 sentence plot summary from YOUR knowledge (do NOT copy the list text). Make it sound enticing.
- "reasoning": 2-3 sentences on WHY this matches "${vibe}" — cite specific tone, pacing, emotional arc, or themes that align.
- "actors": 2-4 real actors/voice actors. REQUIRED.
- "tropes": 2-4 NARRATIVE tropes central to the story (e.g. "found family", "enemies to lovers", "slow burn", "redemption arc") — NOT genres. REQUIRED.
- "interests": 3-5 interest tags explaining the match.
- "surprise_factor": One sentence on what makes this an unexpected but perfect pick (even for obvious choices — find the non-obvious angle).

Return ONLY JSON: {"pick": <number or 0>, "confidence": <1-10>, "title": "exact title", "description": "...", "reasoning": "...", "year": "YYYY", "episodeInfo": "optional", "actors": ["actor1", "actor2"], "tropes": ["trope1", "trope2"], "interests": ["tag1", "tag2"], "surprise_factor": "..."}`,
        },
        {
          role: 'user',
          content: `Vibe: "${vibe}"${interests.length > 0 ? `\nInterests (tie-breaking only): ${interests.join(', ')}` : ''}${tastePatterns ? `\n\n${tastePatterns}` : ''}${peopleSection || ''}\n\nPick the ${contentLabel.slice(0, -1)} that best matches "${vibe}":\n\n${candidateList}`,
        },
      ],
    });

    try {
      const parsed = JSON.parse(pickResponse.choices[0]?.message?.content ?? '{}');
      const pick = (parsed.pick ?? 0) - 1;
      const confidence = parsed.confidence ?? 0;

      if (pick >= 0 && pick < candidates.length && confidence >= 7) {
        title = parsed.title ?? candidates[pick].title;
        description = parsed.description ?? '';
        reasoning = parsed.reasoning ?? '';
        year = parsed.year ?? candidates[pick].year ?? undefined;
        episodeInfo = parsed.episodeInfo;
        pickedActors = parsed.actors;
        pickedTropes = parsed.tropes;
        pickedInterests = parsed.interests;
        break;
      }

      // Confidence too low or no match — retry with higher temperature
      if (attempt === MAX_PICK_ATTEMPTS - 1 && pick >= 0 && pick < candidates.length) {
        // Last attempt: take what we got
        title = parsed.title ?? candidates[pick].title;
        description = parsed.description ?? '';
        reasoning = parsed.reasoning ?? '';
        year = parsed.year ?? candidates[pick].year ?? undefined;
        episodeInfo = parsed.episodeInfo;
        pickedActors = parsed.actors;
        pickedTropes = parsed.tropes;
        pickedInterests = parsed.interests;
      }
    } catch (error) {
      log.warn(`Pick attempt ${attempt + 1} failed to parse response`, String(error));
    }
  }

  // If still no title, take the top candidate
  if (!title && candidates.length > 0) {
    title = candidates[0].title;
    year = candidates[0].year ?? undefined;
    description = candidates[0].description;
  }

  // Last resort: GPT suggests a title directly when search-based approach fails
  if (!title) {
    try {
      const directResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Recommend a single ${contentLabel.slice(0, -1)} that matches the user's vibe. Return ONLY JSON: {"title": "exact title", "year": "YYYY", "description": "brief plot summary", "reasoning": "why this fits", "actors": ["actor1", "actor2"], "tropes": ["trope1", "trope2"], "interests": ["tag1", "tag2"]}
"tropes" means NARRATIVE tropes (e.g. "found family", "enemies to lovers", "reluctant hero", "slow burn"), NOT genres. REQUIRED.`,
          },
          {
            role: 'user',
            content: `Vibe: "${vibe}"${interests.length > 0 ? `\nInterests: ${interests.join(', ')}` : ''}${existingTitles.length > 0 ? `\n\nDo NOT recommend any of these: ${existingTitles.slice(0, 30).join(', ')}` : ''}`,
          },
        ],
      });
      const parsed = JSON.parse(directResponse.choices[0]?.message?.content ?? '{}');
      if (parsed.title) {
        title = parsed.title;
        year = parsed.year;
        description = parsed.description ?? '';
        reasoning = parsed.reasoning ?? '';
        pickedActors = parsed.actors;
        pickedTropes = parsed.tropes;
        pickedInterests = parsed.interests;
      }
    } catch (error) { log.warn('Direct GPT title suggestion failed', String(error)); }
  }

  if (!title) {
    throw new Error('Could not find a good recommendation for this vibe. Try rephrasing or picking a different content type!');
  }

  // Build action URL — verify direct links, fall back to search if dead
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  let actionUrl: string;
  let actionLabel: string;

  if (contentType === 'kdrama') {
    const directUrl = `https://kissasian.cam/series/${slug}/`;
    const isValid = await verifyUrl(directUrl);
    actionUrl = isValid ? directUrl : `https://kissasian.cam/search?keyword=${encodeURIComponent(title)}`;
    actionLabel = 'Watch on KissAsian';
  } else if (contentType === 'anime') {
    actionUrl = `https://gogoanimes.cv/search?keyword=${encodeURIComponent(title)}`;
    actionLabel = 'Watch on GoGoAnime';
  } else if (contentType === 'poetry') {
    actionUrl = `https://www.poetryfoundation.org/search?query=${encodeURIComponent(title)}`;
    actionLabel = 'Find on Poetry Foundation';
  } else if (contentType === 'book') {
    actionUrl = `https://z-library.bz/s/${encodeURIComponent(title)}`;
    actionLabel = 'Find on Z-Library';
  } else if (contentType === 'short_story') {
    actionUrl = `https://www.google.com/search?q=${encodeURIComponent(title + ' short story read online')}`;
    actionLabel = 'Search online';
  } else if (contentType === 'essay') {
    actionUrl = `https://www.google.com/search?q=${encodeURIComponent(title + ' essay read online')}`;
    actionLabel = 'Search online';
  } else if (contentType === 'podcast') {
    actionUrl = `https://open.spotify.com/search/${encodeURIComponent(title)}/podcasts`;
    actionLabel = 'Find on Spotify';
  } else if (contentType === 'research') {
    actionUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;
    actionLabel = 'Search on Google Scholar';
  } else if (contentType === 'manga') {
    // Try the direct Mangago URL first — falls back to search if the slug 404s.
    const slug = title.toLowerCase().replace(/[:\-–—!?.,'"()\[\]]/g, '').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const directUrl = `https://www.mangago.me/read-manga/${slug}/`;
    const isValid = await verifyUrl(directUrl);
    actionUrl = isValid ? directUrl : `https://www.mangago.me/r/l_search/?name=${encodeURIComponent(title)}`;
    actionLabel = 'Read on Mangago';
  } else if (contentType === 'comic') {
    actionUrl = `https://readcomiconline.li/Search/Comic?keyword=${encodeURIComponent(title)}`;
    actionLabel = 'Find on ReadComicOnline';
  } else if (contentType === 'game') {
    actionUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`;
    actionLabel = 'Find on Steam';
  } else {
    actionUrl = `https://sflix.ps/search/${encodeURIComponent(title)}`;
    actionLabel = 'Watch on sflix';
  }

  // Fetch poster/stills and Reddit insights in parallel
  let imageUrls: string[] = [];
  let thumbnailUrl: string | undefined;
  let redditInsights: { subreddit: string; comment: string; score: number }[] | undefined;

  const readTypes: ContentType[] = ['book', 'poetry', 'short_story', 'essay', 'podcast', 'research', 'manga', 'comic', 'game'];
  const imagePromise = (async () => {
    if (contentType === 'anime') {
      const [jikan, tmdb] = await Promise.all([
        searchAnimeJikan(title!),
        searchTMDB(title!, 'tv', year),
      ]);
      thumbnailUrl = jikan?.posterUrl ?? tmdb?.posterUrl ?? undefined;
      imageUrls = tmdb?.backdropUrls?.length ? tmdb.backdropUrls : (jikan?.backdropUrls ?? []);
    } else if (readTypes.includes(contentType)) {
      // Read types — vibe image from Brave
      const braveKey = process.env.BRAVE_API_KEY;
      if (braveKey) {
        try {
          const res = await fetch(
            `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(`${title!} ${contentType} aesthetic`)}&count=3&safesearch=moderate`,
            { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }, signal: AbortSignal.timeout(5000) }
          );
          if (res.ok) {
            const data = await res.json();
            const result = data?.results?.[0];
            const url = (result?.properties as Record<string, unknown>)?.url as string ?? result?.url as string;
            if (url) thumbnailUrl = url;
          }
        } catch { /* best effort */ }
      }
    } else {
      const tmdbType = contentType === 'movie' ? 'movie' : 'tv';
      const tmdb = await searchTMDB(title!, tmdbType, year);
      if (tmdb?.posterUrl) thumbnailUrl = tmdb.posterUrl;
      imageUrls = tmdb?.backdropUrls ?? [];
    }
  })();

  const redditPromise = (async () => {
    try {
      redditInsights = await searchRedditForTitle(title!, contentType);
    } catch (error) { log.warn('Failed to fetch Reddit insights', String(error)); }
  })();

  await Promise.all([imagePromise, redditPromise]);

  if (imageUrls.length === 0 && !thumbnailUrl) {
    imageUrls = [0, 1, 2].map(i => `gradient:${i}:${encodeURIComponent(title!)}`);
  }

  return {
    title,
    type: contentType,
    description,
    reasoning,
    actionUrl,
    actionLabel,
    thumbnailUrl,
    year,
    episodeInfo,
    actors: pickedActors,
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    redditInsights: redditInsights && redditInsights.length > 0 ? redditInsights : undefined,
    interests: pickedInterests,
    tropes: pickedTropes,
  };
}

export async function getRecommendation(
  vibe: string,
  contentType: ContentType,
  discoveryMode: DiscoveryMode = 'something_new',
  useInterests: boolean = true
): Promise<Recommendation> {
  vibe = vibe.replace(/[\r\n]+/g, ' ').trim().slice(0, 1000);

  const client = await db();

  const [
    favorites,
    allProgress,
    ratings,
    rejectedResult,
    historyResult,
    interestsResult,
    people,
    tasteProfile,
  ] = await Promise.all([
    getAllFavorites(),
    getAllProgress(),
    getAllRatings(),
    client.execute('SELECT title, reason FROM rejected_recommendations').catch((error: unknown) => {
      log.warn('Failed to load rejected recommendations', String(error));
      return { rows: [] };
    }),
    client.execute('SELECT title FROM recommendation_history ORDER BY created_at DESC LIMIT 50').catch((error: unknown) => {
      log.warn('Failed to load recommendation history', String(error));
      return { rows: [] };
    }),
    useInterests
      ? client.execute('SELECT name FROM interests ORDER BY name').catch((error: unknown) => {
          log.warn('Failed to load user interests', String(error));
          return { rows: [] };
        })
      : Promise.resolve({ rows: [] }),
    getAllPeople().catch((error: unknown) => {
      log.warn('Failed to load people', String(error));
      return [];
    }),
    getUserPreferences().catch((error: unknown) => {
      log.warn('Failed to load user preferences', String(error));
      return null;
    }),
  ]);

  // Extract rejected titles WITH reasons (#2)
  const rejectedTitles: string[] = rejectedResult.rows.map((r: unknown) => (r as { title: string }).title);
  const rejectionReasons: string[] = rejectedResult.rows
    .filter((r: unknown) => (r as { reason?: string }).reason)
    .map((r: unknown) => `"${(r as { title: string }).title}": ${(r as { reason: string }).reason}`)
    .slice(-5);

  // Extract recommendation history for anti-repetition (#5)
  const historyTitles: string[] = historyResult.rows.map((r: unknown) => (r as { title: string }).title);

  // Extract user interests
  const interests: string[] = interestsResult.rows.map((r: unknown) => (r as { name: string }).name);

  // Build people section
  let peopleSection = '';
  if (people.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const p of people) {
      const role = p.role ?? 'creator';
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(p.name);
    }
    peopleSection = '\n\nPeople the user loves:\n' + Object.entries(grouped).map(([role, names]) => `  ${role}s: ${names.join(', ')}`).join('\n') + '\n\nPrioritize content featuring or created by these people.';
  }

  // Analyze taste patterns from loved content (#8)
  const tastePatterns = analyzeTastePatterns(favorites, ratings);

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

  // Build user prompt for YouTube/Substack
  let userPrompt: string;
  if (tasteProfile) {
    userPrompt = [
      `The user's current vibe: "${vibe}"`,
      `They want a recommendation for: ${contentType}`,
      interests.length > 0 ? `\nInterests: ${interests.join(', ')}` : '',
      peopleSection,
      `\n--- USER TASTE PROFILE ---\n${tasteProfile}\n--- END PROFILE ---`,
      tastePatterns ? `\n${tastePatterns}` : '',
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

  // Combine all titles to exclude (#5)
  const allTitles = [...favorites.map(f => f.title), ...rejectedTitles, ...historyTitles];
  const existingTitles = Array.from(new Set(allTitles));

  // --- YOUTUBE: two-pass approach with real videos ---
  if (contentType === 'youtube') {
    return getYouTubeRecommendation(vibe, userPrompt, interests, tasteProfile, existingTitles);
  }

  // --- SUBSTACK: two-pass approach with real articles ---
  if (contentType === 'substack') {
    return getSubstackRecommendation(vibe, userPrompt, interests, tasteProfile, existingTitles);
  }

  // --- MOVIE/TV/ANIME/KDRAMA: two-pass with TMDB/Jikan verification (#1) ---
  return getScreenRecommendation(
    vibe, contentType, interests, tasteProfile, existingTitles,
    tastePatterns, rejectionReasons, peopleSection, discoveryMode,
  );
}
