import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/google-auth';
import { addFavorite, getAllFavorites } from '@/lib/favorites';
import { verifyAuthCookie } from '@/lib/auth';

const YT_API = 'https://www.googleapis.com/youtube/v3';

interface YTItem {
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
    resourceId?: { channelId?: string };
  };
  contentDetails?: { videoId?: string };
}

async function fetchLikedVideos(accessToken: string, maxResults = 50): Promise<YTItem[]> {
  const items: YTItem[] = [];
  let pageToken = '';

  while (items.length < maxResults) {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails',
      myRating: 'like',
      maxResults: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${YT_API}/videos?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch liked videos');
    }

    const data = await res.json();
    items.push(...(data.items ?? []));

    if (!data.nextPageToken || items.length >= maxResults) break;
    pageToken = data.nextPageToken;
  }

  return items.slice(0, maxResults);
}

async function fetchSubscriptions(accessToken: string, maxResults = 50): Promise<{ title: string; channelId: string; thumbnail: string }[]> {
  const subs: { title: string; channelId: string; thumbnail: string }[] = [];
  let pageToken = '';

  while (subs.length < maxResults) {
    const params = new URLSearchParams({
      part: 'snippet',
      mine: 'true',
      maxResults: '50',
      order: 'relevance',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${YT_API}/subscriptions?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch subscriptions');
    }

    const data = await res.json();
    for (const item of data.items ?? []) {
      subs.push({
        title: item.snippet.title,
        channelId: item.snippet.resourceId?.channelId ?? '',
        thumbnail: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '',
      });
    }

    if (!data.nextPageToken || subs.length >= maxResults) break;
    pageToken = data.nextPageToken;
  }

  return subs.slice(0, maxResults);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { mode } = body;
    const accessToken = await getValidAccessToken();

    const existing = await getAllFavorites('youtube');
    const existingTitles = new Set(existing.map(f => f.title.toLowerCase()));

    let imported = 0;
    let skipped = 0;

    if (mode === 'liked' || mode === 'both') {
      const liked = await fetchLikedVideos(accessToken);
      for (const item of liked) {
        const title = item.snippet.title;
        if (existingTitles.has(title.toLowerCase())) { skipped++; continue; }
        const videoId = item.contentDetails?.videoId ?? '';
        await addFavorite({
          type: 'youtube',
          title,
          external_id: videoId ? `yt:${videoId}` : undefined,
          image_url: item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? undefined,
          metadata: JSON.stringify({
            videoId,
            channelTitle: item.snippet.channelTitle,
            source: 'youtube_liked',
          }),
        });
        existingTitles.add(title.toLowerCase());
        imported++;
      }
    }

    if (mode === 'subscriptions' || mode === 'both') {
      const subs = await fetchSubscriptions(accessToken);
      for (const sub of subs) {
        if (existingTitles.has(sub.title.toLowerCase())) { skipped++; continue; }
        await addFavorite({
          type: 'youtube',
          title: sub.title,
          external_id: sub.channelId ? `ytch:${sub.channelId}` : undefined,
          image_url: sub.thumbnail || undefined,
          metadata: JSON.stringify({
            channelId: sub.channelId,
            source: 'youtube_subscription',
          }),
        });
        existingTitles.add(sub.title.toLowerCase());
        imported++;
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      message: `Imported ${imported} item${imported !== 1 ? 's' : ''}${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
