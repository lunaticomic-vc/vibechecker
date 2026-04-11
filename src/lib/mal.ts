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

// Simple in-memory LRU-ish cache for external API responses.
// TTL-based; bounded to avoid unbounded growth.
interface CacheEntry<T> { value: T; expires: number }
const _cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MAX = 500;

function cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) { _cache.delete(key); return undefined; }
  return entry.value as T;
}
function cacheSet<T>(key: string, value: T): void {
  if (_cache.size >= CACHE_MAX) {
    // Evict oldest — Map preserves insertion order
    const first = _cache.keys().next().value;
    if (first !== undefined) _cache.delete(first);
  }
  _cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

// Search anime by title via Jikan (for recommendations/enrichment)
export async function searchAnimeJikan(
  title: string
): Promise<{ title: string | null; posterUrl: string | null; backdropUrls: string[]; year: string | null; description: string | null; actors: string[] } | null> {
  const JIKAN_BASE = 'https://api.jikan.moe/v4';
  const cacheKey = `jikan:anime:${title.toLowerCase()}`;
  const cached = cacheGet<{ title: string | null; posterUrl: string | null; backdropUrls: string[]; year: string | null; description: string | null; actors: string[] } | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `${JIKAN_BASE}/anime?q=${encodeURIComponent(title)}&limit=1&sfw=true`,
      { signal: AbortSignal.timeout(6000) }
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
        fetch(`${JIKAN_BASE}/anime/${top.mal_id}/pictures`, { signal: AbortSignal.timeout(6000) }),
        fetch(`${JIKAN_BASE}/anime/${top.mal_id}/characters?limit=4`, { signal: AbortSignal.timeout(6000) }),
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
    const result = { title: canonicalTitle, posterUrl, backdropUrls, year, description, actors };
    cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('Failed to search anime via Jikan', error);
    return null;
  }
}

export async function searchMangaJikan(
  title: string
): Promise<{ title: string | null; posterUrl: string | null; year: string | null; description: string | null; actors: string[] } | null> {
  const JIKAN_BASE = 'https://api.jikan.moe/v4';
  const cacheKey = `jikan:manga:${title.toLowerCase()}`;
  const cached = cacheGet<{ title: string | null; posterUrl: string | null; year: string | null; description: string | null; actors: string[] } | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `${JIKAN_BASE}/manga?q=${encodeURIComponent(title)}&limit=1&sfw=true`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const top = json.data?.[0];
    if (!top) return null;

    const posterUrl = top.images?.jpg?.large_image_url ?? top.images?.jpg?.image_url ?? null;
    const year = top.published?.from ? top.published.from.slice(0, 4) : null;
    const description = top.synopsis ?? null;
    const authors = (top.authors ?? []).map((a: { name: string }) => a.name).slice(0, 3);
    const canonicalTitle = top.title_english ?? top.title ?? null;

    const result = { title: canonicalTitle, posterUrl, year, description, actors: authors };
    cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('Failed to search manga via Jikan', error);
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

  // Parallel fetches with staggered delays so we still respect Jikan's rate limit
  const batches = await Promise.all(queries.map(async (query, i) => {
    try {
      await delay(i * 350);
      const res = await fetch(
        `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=5&sfw=true`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data ?? []).slice(0, 5);
    } catch (error) {
      console.warn(`Failed to search anime via Jikan for query: ${query}`, error);
      return [];
    }
  }));

  for (const batch of batches) {
    for (const item of batch) {
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
  }

  return results;
}

// Manga search via Jikan — the correct API for manga/comic discovery
export async function searchMangaJikanMulti(queries: string[]): Promise<JikanSearchResult[]> {
  const JIKAN_BASE = 'https://api.jikan.moe/v4';
  const seen = new Set<number>();
  const results: JikanSearchResult[] = [];

  const batches = await Promise.all(queries.map(async (query, i) => {
    try {
      await delay(i * 350);
      const res = await fetch(
        `${JIKAN_BASE}/manga?q=${encodeURIComponent(query)}&limit=5&sfw=true`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data ?? []).slice(0, 5);
    } catch (error) {
      console.warn(`Failed to search manga via Jikan for query: ${query}`, error);
      return [];
    }
  }));

  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.mal_id)) continue;
      seen.add(item.mal_id);
      results.push({
        malId: item.mal_id,
        title: item.title,
        year: item.published?.from ? item.published.from.slice(0, 4) : null,
        description: item.synopsis ?? '',
        posterUrl: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url ?? null,
        score: item.score ?? 0,
        episodes: item.chapters ?? null,
        genres: (item.genres ?? []).map((g: { name: string }) => g.name),
      });
    }
  }

  return results;
}

export interface SteamGameResult {
  title: string;
  year: string | null;
  description: string;
  posterUrl: string | null;
  appId: number | null;
}

// Steam Store search — the correct API for games (not TMDB)
export async function searchSteamGamesMulti(queries: string[]): Promise<SteamGameResult[]> {
  const seen = new Set<number>();
  const results: SteamGameResult[] = [];

  const batches = await Promise.all(queries.map(async (query) => {
    try {
      const res = await fetch(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=en&cc=US`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data?.items ?? []).slice(0, 5);
    } catch (error) {
      console.warn(`Failed to search Steam for query: ${query}`, error);
      return [];
    }
  }));

  for (const batch of batches) {
    for (const item of batch) {
      if (!item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      results.push({
        title: item.name ?? '',
        year: null, // Steam search doesn't return year
        description: item.tagline ?? '',
        posterUrl: item.tiny_image ?? (item.id ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg` : null),
        appId: item.id ?? null,
      });
    }
  }

  return results;
}
