import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation } from '@/lib/recommendation-engine';
import { getResearchRecommendation } from '@/lib/research-recommendation';
import {
  getPoetryRecommendation,
  getShortStoryRecommendation,
  getBookRecommendation,
  getEssayRecommendation,
  getPodcastRecommendation,
} from '@/lib/reading-recommendation';
import { enrichRecommendation } from '@/lib/enrich';
import { db } from '@/lib/db';
import { verifyAuthCookie } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/logger';
import { CONTENT_TYPES, type ContentType, type Recommendation } from '@/types/index';

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

    const READING_TYPES: Record<string, (vibe: string) => Promise<Recommendation>> = {
      poetry: getPoetryRecommendation,
      short_story: getShortStoryRecommendation,
      book: getBookRecommendation,
      essay: getEssayRecommendation,
      podcast: getPodcastRecommendation,
    };

    let raw: Recommendation;
    let isSimpleType = false;
    if (contentType === 'research') {
      raw = await getResearchRecommendation(vibe.trim());
      isSimpleType = true;
    } else if (contentType in READING_TYPES) {
      raw = await READING_TYPES[contentType](vibe.trim());
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
    console.error('Recommendation failed:', error);
    log.error('Recommendation failed', error);
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
  }
}
