// MyAnimeList import via Jikan API (free, no auth required)
// https://docs.api.jikan.moe/

export interface MALAnime {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  episodes: number | null;
  score: number | null;
  status: string;
}

export interface MALListEntry {
  entry: MALAnime;
  watching_status: number; // 1=watching, 2=completed, 6=plan to watch
  episodes_watched: number;
  score: number;
}

const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Rate limit: Jikan allows ~3 req/s. We add a small delay between pages.
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchMALAnimeList(
  username: string,
  options?: { limit?: number }
): Promise<{ title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[]> {
  const limit = options?.limit ?? 100;
  const results: { title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && results.length < limit) {
    const res = await fetch(
      `${JIKAN_BASE}/users/${encodeURIComponent(username)}/animelist?page=${page}&limit=25&order_by=score&sort=desc`
    );

    if (!res.ok) {
      if (res.status === 404) throw new Error(`MAL user "${username}" not found`);
      if (res.status === 429) {
        await delay(1500);
        continue;
      }
      throw new Error(`MAL API error: ${res.status}`);
    }

    const json = await res.json();
    const entries: MALListEntry[] = json.data ?? [];

    for (const item of entries) {
      if (results.length >= limit) break;
      const statusMap: Record<number, string> = {
        1: 'watching',
        2: 'completed',
        3: 'on_hold',
        4: 'dropped',
        6: 'plan_to_watch',
      };
      results.push({
        title: item.entry.title,
        mal_id: item.entry.mal_id,
        image_url: item.entry.images?.jpg?.image_url ?? '',
        episodes: item.entry.episodes,
        score: item.score,
        status: statusMap[item.watching_status] ?? 'unknown',
      });
    }

    hasMore = json.pagination?.has_next_page ?? false;
    page++;
    if (hasMore) await delay(400); // respect rate limit
  }

  return results;
}
