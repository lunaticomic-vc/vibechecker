// MyAnimeList import via official MAL API v2
// Requires MAL_CLIENT_ID from https://myanimelist.net/apiconfig

const MAL_API = 'https://api.myanimelist.net/v2';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchMALAnimeList(
  username: string,
  options?: { limit?: number }
): Promise<{ title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[]> {
  const clientId = process.env.MAL_CLIENT_ID;

  // Fallback to Jikan if no MAL client ID
  if (!clientId) {
    return fetchViaJikan(username, options);
  }

  const limit = options?.limit ?? 1000;
  const results: { title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[] = [];
  let offset = 0;

  const statusMap: Record<string, string> = {
    watching: 'watching',
    completed: 'completed',
    on_hold: 'on_hold',
    dropped: 'dropped',
    plan_to_watch: 'plan_to_watch',
  };

  while (results.length < limit) {
    const params = new URLSearchParams({
      fields: 'list_status,num_episodes,main_picture',
      limit: '100',
      offset: String(offset),
      sort: 'list_score',
    });

    const res = await fetch(`${MAL_API}/users/${encodeURIComponent(username)}/animelist?${params}`, {
      headers: { 'X-MAL-CLIENT-ID': clientId },
    });

    if (!res.ok) {
      if (res.status === 404) throw new Error(`MAL user "${username}" not found`);
      if (res.status === 403) throw new Error('MAL list is private. Set your anime list to public in MAL Settings → Privacy.');
      if (res.status === 429) {
        await delay(2000);
        continue;
      }
      const body = await res.text();
      throw new Error(`MAL API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    const items = json.data ?? [];

    if (items.length === 0) break;

    for (const item of items) {
      if (results.length >= limit) break;
      const node = item.node;
      const listStatus = item.list_status;
      results.push({
        title: node.title,
        mal_id: node.id,
        image_url: node.main_picture?.medium ?? node.main_picture?.large ?? '',
        episodes: node.num_episodes || null,
        score: listStatus?.score ?? 0,
        status: statusMap[listStatus?.status] ?? 'unknown',
      });
    }

    if (!json.paging?.next) break;
    offset += 100;
    await delay(300);
  }

  return results;
}

// Jikan fallback (no API key needed, but requires public list)
async function fetchViaJikan(
  username: string,
  options?: { limit?: number }
): Promise<{ title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[]> {
  const JIKAN_BASE = 'https://api.jikan.moe/v4';
  const limit = options?.limit ?? 100;
  const results: { title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && results.length < limit) {
    const res = await fetch(
      `${JIKAN_BASE}/users/${encodeURIComponent(username)}/animelist?page=${page}&limit=25&order_by=score&sort=desc`
    );

    if (!res.ok) {
      if (res.status === 404) throw new Error(`MAL user "${username}" not found, or anime list is private. Set it to public in MAL Settings → Privacy.`);
      if (res.status === 429) {
        await delay(1500);
        continue;
      }
      throw new Error(`MAL API error: ${res.status}`);
    }

    const json = await res.json();
    const entries = json.data ?? [];

    const statusMap: Record<number, string> = {
      1: 'watching', 2: 'completed', 3: 'on_hold', 4: 'dropped', 6: 'plan_to_watch',
    };

    for (const item of entries) {
      if (results.length >= limit) break;
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
    if (hasMore) await delay(400);
  }

  return results;
}
