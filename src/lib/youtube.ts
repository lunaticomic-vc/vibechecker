export interface YouTubeResult {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchYouTube(query: string): Promise<YouTubeResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=5`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();

  return (data.items ?? []).map((item: {
    id: { videoId: string };
    snippet: { title: string; thumbnails: { medium: { url: string } }; channelTitle: string };
  }) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.medium?.url ?? '',
    channelTitle: item.snippet.channelTitle,
  }));
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
