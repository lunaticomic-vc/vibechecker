function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

export interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchYouTube(query: string, excludeShorts = true): Promise<YouTubeResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return searchYouTubeBrave(query);

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=10${excludeShorts ? '&videoDuration=medium' : ''}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return searchYouTubeBrave(query);

  const data = await res.json();

  return (data.items ?? []).map((item: {
    id: { videoId: string };
    snippet: { title: string; thumbnails: { medium: { url: string } }; channelTitle: string };
  }) => ({
    videoId: item.id.videoId,
    title: decodeHtml(item.snippet.title),
    thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
    channelTitle: item.snippet.channelTitle,
  }));
}

/** Fallback: search YouTube via Brave when no YouTube API key */
async function searchYouTubeBrave(query: string): Promise<YouTubeResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent('site:youtube.com/watch ' + query)}&count=8`,
      { headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.web?.results ?? [])
      .filter((r: Record<string, unknown>) => ((r.url as string) ?? '').includes('youtube.com/watch'))
      .map((r: Record<string, unknown>) => {
        const url = r.url as string;
        const videoId = new URL(url).searchParams.get('v') ?? '';
        return { videoId, title: decodeHtml((r.title as string) ?? ''), thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, channelTitle: '' };
      })
      .filter((r: YouTubeResult) => r.videoId);
  } catch (error) { console.warn('Failed to search YouTube via Brave fallback', error); return []; }
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export interface YouTubeVideoDetails {
  videoId: string;
  durationSeconds: number;
  viewCount: number;
}

function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return parseInt(match[1] ?? '0') * 3600 + parseInt(match[2] ?? '0') * 60 + parseInt(match[3] ?? '0');
}

export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || videoIds.length === 0) return [];
  try {
    const ids = videoIds.slice(0, 50).join(',');
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item: { id: string; contentDetails?: { duration?: string }; statistics?: { viewCount?: string } }) => ({
      videoId: item.id,
      durationSeconds: parseISO8601Duration(item.contentDetails?.duration ?? ''),
      viewCount: parseInt(item.statistics?.viewCount ?? '0'),
    }));
  } catch (error) { console.warn('Failed to fetch YouTube video details', error); return []; }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
