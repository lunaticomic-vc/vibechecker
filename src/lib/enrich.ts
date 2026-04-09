import { getOpenAI } from '@/lib/openai';
import { getUserPreferences } from '@/lib/user-preferences';
import { searchTMDBDetailed } from '@/lib/tmdb';
import { searchAnimeJikan } from '@/lib/mal';
import { searchYouTube, buildYouTubeWatchUrl } from '@/lib/youtube';
import { searchRedditForTitle } from '@/lib/reddit';

import { log } from '@/lib/logger';
import type { ContentType, Recommendation } from '@/types/index';

export interface EnrichResult {
  title: string;
  image_url?: string;
  external_id?: string;
  metadata: Record<string, unknown>;
}

const CONTENT_LABELS: Record<ContentType, string> = {
  movie: 'movie',
  tv: 'TV show',
  anime: 'anime',
  youtube: 'YouTube video/channel',
  substack: 'Substack article',
  kdrama: 'Korean drama',
  research: 'research topic',
  poetry: 'poem',
  short_story: 'short story',
  book: 'book',
  essay: 'essay',
  podcast: 'podcast',
  manga: 'manga',
  comic: 'comic',
};

/** Look up external metadata (poster, year, actors, canonical title) from type-specific APIs */
async function lookupExternal(title: string, type: ContentType) {
  const base = { title: null as string | null, posterUrl: null as string | null, year: null as string | null, description: null as string | null, actors: [] as string[], external_id: undefined as string | undefined };

  if (type === 'anime') {
    const detail = await searchAnimeJikan(title);
    if (detail) return { ...base, ...detail };
  }

  if (type === 'movie' || type === 'tv' || type === 'kdrama') {
    const tmdbType = type === 'movie' ? 'movie' as const : 'tv' as const;
    const detail = await searchTMDBDetailed(title, tmdbType);
    if (detail) return { ...base, ...detail };
  }

  if (type === 'youtube') {
    const results = await searchYouTube(title);
    if (results.length > 0) {
      const top = results[0];
      return {
        ...base,
        title: top.title,
        posterUrl: top.thumbnail,
        description: `By ${top.channelTitle}`,
        external_id: buildYouTubeWatchUrl(top.videoId),
      };
    }
  }

  // Books — pull the actual book cover from Open Library
  if (type === 'book') {
    let posterUrl: string | null = null;
    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (res.ok) {
        const data = await res.json();
        const coverId = data.docs?.[0]?.cover_i;
        if (coverId) posterUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      }
    } catch { /* best effort */ }

    return {
      ...base,
      posterUrl,
      external_id: `https://z-library.bz/s/${encodeURIComponent(title)}`,
    };
  }

  // Other read types — vibe image from Brave
  if (['poetry', 'short_story', 'essay', 'podcast', 'substack', 'research', 'manga', 'comic'].includes(type)) {
    let posterUrl: string | null = null;
    const braveKey = process.env.BRAVE_API_KEY;
    if (braveKey) {
      try {
        const res = await fetch(
          `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(`${title} ${type} aesthetic`)}&count=3&safesearch=moderate`,
          { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey }, signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          const result = data?.results?.[0];
          posterUrl = (result?.properties as Record<string, unknown>)?.url as string ?? result?.url as string ?? null;
        }
      } catch { /* best effort */ }
    }

    const externalIds: Record<string, string> = {
      poetry: `https://www.poetryfoundation.org/search?query=${encodeURIComponent(title)}`,
      podcast: `https://open.spotify.com/search/${encodeURIComponent(title)}/podcasts`,
      research: `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`,
    };

    return {
      ...base,
      posterUrl,
      external_id: externalIds[type],
    };
  }

  return null;
}

/** Generate description + reasoning via GPT using the user's taste profile */
async function gptEnrich(title: string, type: ContentType, context: { year?: string | null; actors?: string[]; externalDesc?: string }) {
  const openai = getOpenAI();
  const tasteProfile = await getUserPreferences();
  const label = CONTENT_LABELS[type];
  const { year, actors, externalDesc } = context;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: `You enrich a manually-added ${label} with metadata. Return ONLY JSON, no markdown.

REQUIRED fields:
- "description": A compelling 2-3 sentence summary of "${title}". ${externalDesc ? `Use your knowledge and this reference: "${externalDesc}". Do NOT just copy — write something engaging.` : 'Use your knowledge to write something engaging.'}
- "reasoning": 2-3 sentences explaining why this ${label} fits the user's taste based on their profile below. Be specific — reference themes, tropes, or titles they love.
- "author": The creator/author/artist name. For books/poems/essays/short stories, the writer. For podcasts, the host. For research, the primary author or institution. Return the most well-known name. If unknown, return null.
- "canonicalTitle": The correct, properly formatted title. Fix any typos, capitalization, or abbreviations. Return the standard title as it would appear in a library catalog or official source.
${tasteProfile ? `\nUser taste profile:\n${tasteProfile.slice(0, 1500)}` : '\nNo taste profile available — write a general appeal instead.'}

Return: {"description": "...", "reasoning": "...", "interests": ["tag1", "tag2", "tag3"], "author": "...", "canonicalTitle": "..."}`,
      },
      {
        role: 'user',
        content: `Title: "${title}"${year ? ` (${year})` : ''}${actors?.length ? `\nStarring: ${actors.join(', ')}` : ''}`,
      },
    ],
  });

  return JSON.parse(res.choices[0]?.message?.content ?? '{}') as {
    description?: string;
    reasoning?: string;
    interests?: string[];
    author?: string;
    canonicalTitle?: string;
  };
}

/**
 * Enrich a manually-added favorite: fix title, look up external metadata,
 * generate GPT description + reasoning. Works for all content types.
 */
export async function enrichManualAdd(
  rawTitle: string,
  type: ContentType,
  existingImageUrl?: string,
): Promise<EnrichResult> {
  const metadata: Record<string, unknown> = { source: 'manual' };
  let imageUrl = existingImageUrl;
  let externalId: string | undefined;

  // Step 1: Type-specific API lookup (also gives us the canonical title)
  const detail = await lookupExternal(rawTitle, type).catch(err => {
    log.warn(`External lookup failed for "${rawTitle}" (${type})`, String(err));
    return null;
  });

  // Use canonical title from API, fall back to user input
  const title = detail?.title || rawTitle;

  if (detail) {
    if (detail.year) metadata.year = detail.year;
    if (detail.actors?.length) metadata.actors = detail.actors;
    if (!imageUrl && detail.posterUrl) imageUrl = detail.posterUrl;
    if (detail.external_id) externalId = detail.external_id;
  }

  // Step 2: GPT enrichment (description, reasoning, interests)
  const gpt = await gptEnrich(title, type, {
    year: detail?.year,
    actors: detail?.actors,
    externalDesc: detail?.description ?? undefined,
  }).catch(err => {
    log.warn(`GPT enrichment failed for "${title}"`, String(err));
    return null;
  });

  if (gpt?.description) metadata.description = gpt.description;
  else if (detail?.description) metadata.description = detail.description;
  if (gpt?.reasoning) metadata.reasoning = gpt.reasoning;
  if (gpt?.interests?.length) metadata.interests = gpt.interests;

  // Use canonical title from GPT if available
  let finalTitle = gpt?.canonicalTitle || title;

  // Store author in metadata; only append to title for written content types
  if (gpt?.author) {
    metadata.author = gpt.author;
    const authorInTitle = ['book', 'poetry', 'short_story', 'essay', 'research'] as const;
    if ((authorInTitle as readonly string[]).includes(type) && !finalTitle.toLowerCase().includes(gpt.author.toLowerCase())) {
      finalTitle = `${finalTitle} - ${gpt.author}`;
    }
  }

  log.success(
    `Enriched "${finalTitle}" (${type})`,
    `year=${metadata.year ?? '?'} actors=${(metadata.actors as string[] | undefined)?.length ?? 0} hasReasoning=${!!metadata.reasoning}`,
  );

  return { title: finalTitle, image_url: imageUrl, external_id: externalId, metadata };
}

/**
 * Post-process a Recommendation to fill in any missing fields.
 * Runs a single GPT call for all missing text fields + fetches Reddit if absent.
 * Safe to call on any content type — skips fields that are already populated.
 */
export async function enrichRecommendation(rec: Recommendation): Promise<Recommendation> {
  const screenTypes: ContentType[] = ['movie', 'tv', 'anime', 'kdrama'];
  const isScreen = screenTypes.includes(rec.type);

  const missingText = isScreen && (!rec.reasoning || !rec.tropes?.length || !rec.interests?.length);
  const missingReddit = isScreen && !rec.redditInsights?.length;

  // Parallel: GPT for missing text fields + Reddit
  const [gptPatch, reddit] = await Promise.all([
    missingText
      ? fillMissingFields(rec).catch(err => {
          log.warn(`Recommendation enrichment GPT failed for "${rec.title}"`, String(err));
          return null;
        })
      : Promise.resolve(null),
    missingReddit
      ? searchRedditForTitle(rec.title, rec.type).catch(err => {
          log.warn(`Reddit fetch failed for "${rec.title}"`, String(err));
          return null;
        })
      : Promise.resolve(null),
  ]);

  const patched = { ...rec };

  if (gptPatch) {
    if (!patched.reasoning && gptPatch.reasoning) patched.reasoning = gptPatch.reasoning;
    if (!patched.tropes?.length && gptPatch.tropes?.length) patched.tropes = gptPatch.tropes;
    if (!patched.interests?.length && gptPatch.interests?.length) patched.interests = gptPatch.interests;
    if (!patched.description && gptPatch.description) patched.description = gptPatch.description;
    if (!patched.actors?.length && gptPatch.actors?.length) patched.actors = gptPatch.actors;
  }

  if (reddit?.length) patched.redditInsights = reddit;

  return patched;
}

/** Single GPT call to fill whichever recommendation fields are empty */
async function fillMissingFields(rec: Recommendation) {
  const openai = getOpenAI();
  const label = CONTENT_LABELS[rec.type];

  const missing: string[] = [];
  if (!rec.description) missing.push('"description": compelling 2-3 sentence plot summary');
  if (!rec.reasoning) missing.push('"reasoning": 2-3 sentences on why this fits the vibe — be specific');
  if (!rec.actors?.length) missing.push('"actors": array of 2-4 real actors/voice actors');
  if (!rec.tropes?.length) missing.push('"tropes": array of 2-4 narrative tropes central to the story (e.g. "found family", "slow burn")');
  if (!rec.interests?.length) missing.push('"interests": array of 3-5 interest tags that describe the appeal');

  if (missing.length === 0) return null;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: `Fill in the missing fields for this ${label}. Return ONLY JSON with these fields:\n${missing.map(m => `- ${m}`).join('\n')}\n\nUse your real knowledge. Be specific and engaging.`,
      },
      {
        role: 'user',
        content: `"${rec.title}"${rec.year ? ` (${rec.year})` : ''}${rec.description ? `\nAbout: ${rec.description}` : ''}`,
      },
    ],
  });

  return JSON.parse(res.choices[0]?.message?.content ?? '{}') as {
    description?: string;
    reasoning?: string;
    actors?: string[];
    tropes?: string[];
    interests?: string[];
  };
}
