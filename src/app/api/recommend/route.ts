import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation } from '@/lib/recommendation-engine';
import { searchYouTube, buildYouTubeWatchUrl } from '@/lib/youtube';
import { log } from '@/lib/logger';
import type { ContentType } from '@/types/index';

const VALID_CONTENT_TYPES: ContentType[] = ['movie', 'tv', 'anime', 'youtube'];

export async function POST(req: NextRequest) {
  log.api('POST', '/api/recommend');

  if (!process.env.OPENAI_API_KEY) {
    log.error('OpenAI API key not configured');
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
  }

  let body: { contentType?: string; vibe?: string; discoveryMode?: string };
  try {
    body = await req.json();
  } catch {
    log.warn('Invalid JSON body');
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contentType, vibe, discoveryMode } = body;
  log.ai('Recommendation request', `type=${contentType} vibe="${vibe}" mode=${discoveryMode ?? 'something_new'}`);

  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
    log.warn('Invalid contentType', String(contentType));
    return NextResponse.json(
      { error: `contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (!vibe || typeof vibe !== 'string' || vibe.trim().length === 0) {
    log.warn('Empty vibe');
    return NextResponse.json({ error: 'vibe is required' }, { status: 400 });
  }

  try {
    log.ai('Calling OpenAI gpt-4o-mini...');
    const recommendation = await getRecommendation(vibe.trim(), contentType as ContentType, (discoveryMode as 'from_library' | 'something_new') ?? 'something_new');
    log.success(`Got recommendation: "${recommendation.title}"`, `(${recommendation.type})`);

    if (contentType === 'youtube') {
      const searchQuery = vibe + ' ' + recommendation.title;
      log.ai('Searching YouTube', `"${searchQuery}"`);
      const results = await searchYouTube(searchQuery);
      if (results.length > 0) {
        recommendation.actionUrl = buildYouTubeWatchUrl(results[0].videoId);
        recommendation.actionLabel = 'Watch on YouTube';
        recommendation.thumbnailUrl = results[0].thumbnail;
        log.success('Found YouTube video', results[0].videoId);
      } else {
        log.warn('No YouTube results found');
      }
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recommendation failed';
    log.error('Recommendation failed', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
