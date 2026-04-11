import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';
import { CONTENT_TYPES, type ContentType } from '@/types/index';

interface ExtractedItem {
  title: string;
  type: ContentType;
  confidence: 'high' | 'medium' | 'low';
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { images } = body as { images: string[] }; // base64 data URLs

  if (!images?.length) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 });
  }

  if (images.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 images at a time' }, { status: 400 });
  }

  log.api('POST', '/api/imports/images', `${images.length} images`);

  try {
    const openai = getOpenAI();
    const allItems: ExtractedItem[] = [];

    // Process images in parallel (up to 10)
    const results = await Promise.all(
      images.map(async (imageDataUrl, idx) => {
        try {
          const res = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0.2,
            max_tokens: 1500,
            messages: [
              {
                role: 'system',
                content: `You extract media titles from screenshots. Look at the image and identify every piece of media visible — movies, TV shows, anime, K-dramas, books, manga, comics, games, YouTube videos/channels, podcasts, music, etc.

For each item, return:
- "title": the exact title as shown or your best identification
- "type": one of: ${CONTENT_TYPES.join(', ')}
- "confidence": "high" (clearly visible/readable), "medium" (partially visible or you're inferring), "low" (guessing)

Common sources you might see:
- Netflix/streaming app screenshots → movies, tv shows
- Crunchyroll/anime app → anime
- Steam/game library → games
- Bookshelf photos → books
- YouTube screenshots → youtube
- Social media recommendations → various
- Manga/webtoon apps → manga
- Spotify/podcast apps → podcasts

Return ONLY a JSON array. If nothing is identifiable, return [].
Example: [{"title": "Breaking Bad", "type": "tv", "confidence": "high"}]`,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: imageDataUrl, detail: 'high' },
                  },
                  {
                    type: 'text',
                    text: 'What media titles can you see in this image? Return JSON array only.',
                  },
                ],
              },
            ],
          });

          const raw = res.choices[0]?.message?.content ?? '[]';
          // Strip markdown code fences if present
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const items = JSON.parse(cleaned) as ExtractedItem[];
          return items.filter(
            (item) => item.title && CONTENT_TYPES.includes(item.type as ContentType)
          );
        } catch (err) {
          log.warn(`Failed to process image ${idx + 1}`, String(err));
          return [];
        }
      })
    );

    for (const items of results) {
      allItems.push(...items);
    }

    // Deduplicate by title (case-insensitive)
    const seen = new Set<string>();
    const unique = allItems.filter((item) => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    log.success('Image import', `extracted ${unique.length} items from ${images.length} images`);
    return NextResponse.json({ items: unique });
  } catch (err) {
    log.error('Image import failed', err);
    return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
  }
}
