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

  const limit = options?.limit ?? 10000; // fetch all
  const results: { title: string; mal_id: number; image_url: string; episodes: number | null; score: number; status: string }[] = [];
  let offset = 0;

  const statusMap: Record<string, string> = {
    watching: 'watching',
    completed: 'completed',
    on_hold: 'on_hold',
    dropped: 'dropped',
    plan_to_watch: 'plan_to_watch',
  };

  let malRetries = 0;
  const MAL_MAX_RETRIES = 3;
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
        malRetries++;
        if (malRetries >= MAL_MAX_RETRIES) throw new Error('MAL API rate limited after ' + MAL_MAX_RETRIES + ' retries');
        await delay(1000 * malRetries);
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

// Search anime by title via Jikan (for recommendations/enrichment)
export async function searchAnimeJikan(
  title: string
): Promise<{ title: string | null; posterUrl: string | null; backdropUrls: string[]; year: string | null; description: string | null; actors: string[] } | null> {
  const JIKAN_BASE = 'https://api.jikan.moe/v4';

  try {
    const res = await fetch(
      `${JIKAN_BASE}/anime?q=${encodeURIComponent(title)}&limit=1&sfw=true`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const top = json.data?.[0];
    if (!top) return null;

    const posterUrl = top.images?.jpg?.large_image_url ?? top.images?.jpg?.image_url ?? null;
    const year = top.aired?.from ? top.aired.from.slice(0, 4) : (top.year ? String(top.year) : null);
    const description = top.synopsis ?? null;

    // Fetch additional pictures and character VAs in parallel
    let actors: string[] = [];
    let backdropUrls: string[] = [];
    try {
      await delay(350);
      const [picRes, charRes] = await Promise.all([
        fetch(`${JIKAN_BASE}/anime/${top.mal_id}/pictures`),
        fetch(`${JIKAN_BASE}/anime/${top.mal_id}/characters?limit=4`),
      ]);

      if (picRes.ok) {
        const picData = await picRes.json();
        const pics = picData.data ?? [];
        // Skip the first one (usually same as poster), take up to 3
        backdropUrls = pics
          .slice(1, 4)
          .map((p: { jpg?: { large_image_url?: string; image_url?: string } }) =>
            p.jpg?.large_image_url ?? p.jpg?.image_url ?? '')
          .filter(Boolean);
      }

      if (charRes.ok) {
        const charData = await charRes.json();
        const characters = charData.data ?? [];
        for (const char of characters.slice(0, 4)) {
          const va = char.voice_actors?.find((v: { language: string }) => v.language === 'Japanese');
          if (va?.person?.name) actors.push(va.person.name);
        }
      }
    } catch (error) { console.warn('Failed to fetch additional Jikan anime pictures/characters', error); }

    const canonicalTitle = top.title_english ?? top.title ?? null;
    return { title: canonicalTitle, posterUrl, backdropUrls, year, description, actors };
  } catch (error) {
    console.warn('Failed to search anime via Jikan', error);
    return null;
  }
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

  let jikanRetries = 0;
  const JIKAN_MAX_RETRIES = 3;
  while (hasMore && results.length < limit) {
    const res = await fetch(
      `${JIKAN_BASE}/users/${encodeURIComponent(username)}/animelist?page=${page}&limit=25&order_by=score&sort=desc`
    );

    if (!res.ok) {
      if (res.status === 404) throw new Error(`MAL user "${username}" not found, or anime list is private. Set it to public in MAL Settings → Privacy.`);
      if (res.status === 429) {
        jikanRetries++;
        if (jikanRetries >= JIKAN_MAX_RETRIES) throw new Error('MAL API rate limited after ' + JIKAN_MAX_RETRIES + ' retries');
        await delay(1000 * jikanRetries);
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

export interface JikanSearchResult {
  malId: number;
  title: string;
  year: string | null;
  description: string;
  posterUrl: string | null;
  score: number;
  episodes: number | null;
  genres: string[];
}

export async function searchAnimeJikanMulti(queries: string[]): Promise<JikanSearchResult[]> {
  const JIKAN_BASE = 'https://api.jikan.moe/v4';
  const seen = new Set<number>();
  const results: JikanSearchResult[] = [];

  for (const query of queries) {
    try {
      await delay(350);
      const res = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=5&sfw=true`);
      if (!res.ok) continue;
      const json = await res.json();

      for (const item of (json.data ?? []).slice(0, 5)) {
        if (seen.has(item.mal_id)) continue;
        seen.add(item.mal_id);
        results.push({
          malId: item.mal_id,
          title: item.title,
          year: item.aired?.from ? item.aired.from.slice(0, 4) : (item.year ? String(item.year) : null),
          description: item.synopsis ?? '',
          posterUrl: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url ?? null,
          score: item.score ?? 0,
          episodes: item.episodes ?? null,
          genres: (item.genres ?? []).map((g: { name: string }) => g.name),
        });
      }
    } catch (error) { console.warn(`Failed to search anime via Jikan for query: ${query}`, error); continue; }
  }

  return results;
}
