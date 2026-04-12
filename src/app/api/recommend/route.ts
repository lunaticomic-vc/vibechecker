import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation } from '@/lib/recommendation-engine';
import { getResearchRecommendation } from '@/lib/research-recommendation';
import {
  getPoetryRecommendation,
  getShortStoryRecommendation,
  getBookRecommendation,
  getEssayRecommendation,
  getPodcastRecommendation,
  type ReadingContext,
} from '@/lib/reading-recommendation';
import { enrichRecommendation } from '@/lib/enrich';
import { db } from '@/lib/db';
import { verifyAuthCookie } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/logger';
import { CONTENT_TYPES, type ContentType, type Recommendation } from '@/types/index';
import { getAllFavorites } from '@/lib/favorites';
import { getAllRatings } from '@/lib/ratings';
import { getUserPreferences } from '@/lib/user-preferences';

export async function POST(req: NextRequest) {
  log.api('POST', '/api/recommend');

  if (!process.env.OPENAI_API_KEY) {
    log.error('OpenAI API key not configured');
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
  }

  // Rate limit guests (owner gets unlimited)
  const isOwner = verifyAuthCookie(req.cookies.get('cc_auth')?.value);
  let guestRemaining: number | null = null;
  if (!isOwner) {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed, remaining } = await consumeRateLimit(ip);
    guestRemaining = remaining;
    if (!allowed) {
      return NextResponse.json({ error: 'You\'ve used all 3 free recommendations. Thanks for trying Consumption Corner!' }, { status: 429 });
    }
  }

  let body: { contentType?: string; vibe?: string; discoveryMode?: string; useInterests?: boolean };
  try {
    body = await req.json();
  } catch {
    log.warn('Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contentType, vibe, discoveryMode, useInterests = true } = body;
  log.ai('Recommendation request', `type=${contentType} vibe="${vibe}" mode=${discoveryMode ?? 'something_new'}`);

  if (!contentType || !CONTENT_TYPES.includes(contentType as ContentType)) {
    log.warn('Invalid contentType', String(contentType));
    return NextResponse.json(
      { error: `contentType must be one of: ${CONTENT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (!vibe || typeof vibe !== 'string' || vibe.trim().length === 0) {
    log.warn('Empty vibe');
    return NextResponse.json({ error: 'vibe is required' }, { status: 400 });
  }

  if (vibe.length > 1000) {
    log.warn('Vibe too long', `${vibe.length} chars`);
    return NextResponse.json({ error: 'Vibe is too long (max 1000 characters)' }, { status: 400 });
  }

  try {
    log.ai('Calling OpenAI gpt-4o-mini...');

    const READING_TYPES: Record<string, (vibe: string, ctx?: ReadingContext) => Promise<Recommendation>> = {
      poetry: getPoetryRecommendation,
      short_story: getShortStoryRecommendation,
      book: getBookRecommendation,
      essay: getEssayRecommendation,
      podcast: getPodcastRecommendation,
    };

    let raw: Recommendation;
    let isSimpleType = false;
    if (contentType === 'research') {
      // Load interests for research personalization — research exits before getRecommendation()
      let researchInterests: string[] = [];
      try {
        const client = await db();
        const result = await client.execute('SELECT name FROM interests ORDER BY name LIMIT 50');
        researchInterests = (result.rows as unknown as { name: string }[]).map(r => r.name);
      } catch { /* best effort */ }
      raw = await getResearchRecommendation(vibe.trim(), researchInterests);
      isSimpleType = true;
    } else if (contentType in READING_TYPES) {
      // Build taste context for reading types — previously these had ZERO personalization.
      // We scope to same-type favorites (books get book history, poems get poem history, etc.)
      // to keep token budget tight while still giving the recommender real signal.
      const ctx = await buildReadingContext(contentType as ContentType).catch(err => {
        log.warn('Failed to build reading context', String(err));
        return undefined;
      });
      raw = await READING_TYPES[contentType](vibe.trim(), ctx);
      isSimpleType = true;
    } else {
      raw = await getRecommendation(vibe.trim(), contentType as ContentType, (discoveryMode as 'from_library' | 'something_new') ?? 'something_new', useInterests);
    }
    const recommendation = isSimpleType ? raw : await enrichRecommendation(raw);
    log.success(`Got recommendation: "${recommendation.title}"`, `(${recommendation.type})`);

    // Save to recommendation history for anti-repetition (owner only)
    if (isOwner) {
      try {
        const client = await db();
        await client.execute({
          sql: 'INSERT INTO recommendation_history (title, type, vibe) VALUES (?, ?, ?)',
          args: [recommendation.title, recommendation.type, vibe],
        });
      } catch (error) { log.warn('Failed to save recommendation history', String(error)); }
    }

    // YouTube recommendations already have the correct URL/thumbnail
    // from getYouTubeRecommendation — no second search needed

    return NextResponse.json({ ...recommendation, ...(guestRemaining !== null ? { remaining: guestRemaining } : {}) });
  } catch (error) {
    log.error('Recommendation failed', error);
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
  }
}

/**
 * Build a ReadingContext for reading-type recommendations. Pulls same-type favorites
 * (e.g. only books for a book rec), groups by rating, and caps size for token budget.
 */
async function buildReadingContext(contentType: ContentType): Promise<ReadingContext> {
  const [favs, ratings, tasteProfile] = await Promise.all([
    getAllFavorites(contentType, 300).catch(() => []),
    getAllRatings(contentType).catch(() => []),
    getUserPreferences().catch(() => null),
  ]);

  const ratingsMap = new Map(ratings.map(r => [r.favorite_id, r]));

  const loved: { title: string; reasoning?: string }[] = [];
  const enjoyed: string[] = [];
  const disliked: { title: string; reasoning?: string }[] = [];
  const exclusionList: string[] = [];

  for (const f of favs) {
    exclusionList.push(f.title);
    const r = ratingsMap.get(f.id);
    if (!r) continue;
    if (r.rating === 'felt_things') loved.push({ title: f.title, reasoning: r.reasoning });
    else if (r.rating === 'enjoyed') enjoyed.push(f.title);
    else if (r.rating === 'not_my_thing') disliked.push({ title: f.title, reasoning: r.reasoning });
  }

  // Load interests for reading types — previously missing, leaving a personalization gap
  let interests: string[] = [];
  try {
    const client = await db();
    const interestsResult = await client.execute('SELECT name FROM interests ORDER BY name LIMIT 50');
    interests = (interestsResult.rows as unknown as { name: string }[]).map(r => r.name);
  } catch { /* best effort */ }

  return {
    tasteProfile,
    lovedItems: loved,
    enjoyedItems: enjoyed,
    dislikedItems: disliked,
    exclusionList,
    interests,
  };
}
