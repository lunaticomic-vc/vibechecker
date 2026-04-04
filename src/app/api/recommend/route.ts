import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation } from '@/lib/recommendation-engine';
import { searchYouTube, buildYouTubeWatchUrl } from '@/lib/youtube';
import type { ContentType } from '@/types/index';

const VALID_CONTENT_TYPES: ContentType[] = ['movie', 'tv', 'anime', 'youtube'];

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 });
  }

  let body: { contentType?: string; vibe?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contentType, vibe } = body;

  if (!contentType || !VALID_CONTENT_TYPES.includes(contentType as ContentType)) {
    return NextResponse.json(
      { error: `contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (!vibe || typeof vibe !== 'string' || vibe.trim().length === 0) {
    return NextResponse.json({ error: 'vibe is required' }, { status: 400 });
  }

  try {
    const recommendation = await getRecommendation(vibe.trim(), contentType as ContentType);

    if (contentType === 'youtube') {
      const searchQuery = vibe + ' ' + recommendation.title;
      const results = await searchYouTube(searchQuery);
      if (results.length > 0) {
        recommendation.actionUrl = buildYouTubeWatchUrl(results[0].videoId);
        recommendation.actionLabel = 'Watch on YouTube';
        recommendation.thumbnailUrl = results[0].thumbnail;
      }
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Recommendation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
