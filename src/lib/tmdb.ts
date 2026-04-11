import { log } from '@/lib/logger';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';
const FETCH_TIMEOUT_MS = 6000;

// Simple 24h in-memory cache — titles and posters don't change, so the hot-path
// query for the same movie across page loads is effectively free after first hit.
interface CacheEntry<T> { value: T; expires: number }
const _cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

function cacheGet<T>(key: string): T | undefined {
  const entry = _cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) { _cache.delete(key); return undefined; }
  return entry.value as T;
}
function cacheSet<T>(key: string, value: T): void {
  if (_cache.size >= CACHE_MAX) {
    const first = _cache.keys().next().value;
    if (first !== undefined) _cache.delete(first);
  }
  _cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

interface TMDBSearchItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  popularity?: number;
  vote_average?: number;
}

async function fetchTMDBSearch(title: string, type: 'movie' | 'tv', year?: string, apiKey?: string): Promise<TMDBSearchItem | null> {
  const key = apiKey ?? process.env.TMDB_API_KEY;
  if (!key) return null;
  const cacheKey = `tmdb:search:${type}:${title.toLowerCase()}:${year ?? ''}`;
  const cached = cacheGet<TMDBSearchItem | null>(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const yearParam = year ? `&${type === 'movie' ? 'year' : 'first_air_date_year'}=${year}` : '';
    const res = await fetch(
      `${TMDB_BASE}/search/${type}?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1&api_key=${key}${yearParam}`,
      { signal: timeoutSignal() }
    );
    if (!res.ok) { cacheSet(cacheKey, null); return null; }
    const data = await res.json();
    const top = (data.results ?? [])[0] ?? null;
    cacheSet(cacheKey, top);
    return top;
  } catch (err) {
    log.warn('TMDB search failed', String(err));
    return null;
  }
}

/** Shared image-fetching logic that takes the already-looked-up tmdbId (no second search). */
async function fetchTMDBImages(tmdbId: number, type: 'movie' | 'tv', apiKey: string): Promise<string[]> {
  const screencapUrls: string[] = [];

  if (type === 'tv') {
    // For TV: fetch stills from early episodes
    try {
      const stillsRes = await fetch(
        `${TMDB_BASE}/tv/${tmdbId}/season/1/episode/1/images?api_key=${apiKey}`,
        { signal: timeoutSignal() }
      );
      if (stillsRes.ok) {
        const stillsData = await stillsRes.json();
        const stills = stillsData.stills ?? [];
        screencapUrls.push(
          ...stills
            .slice(1, 7)
            .filter((_: unknown, i: number) => i % 2 === 0)
            .slice(0, 3)
            .map((s: { file_path: string }) => `${IMG_BASE}/w780${s.file_path}`)
        );
      }
    } catch (error) { log.warn('Failed to fetch TMDB episode stills, falling back to backdrops', String(error)); }

    if (screencapUrls.length < 3) {
      for (const ep of [2, 3, 5]) {
        if (screencapUrls.length >= 3) break;
        try {
          const epRes = await fetch(
            `${TMDB_BASE}/tv/${tmdbId}/season/1/episode/${ep}/images?api_key=${apiKey}`,
            { signal: timeoutSignal() }
          );
          if (epRes.ok) {
            const epData = await epRes.json();
            const epStills = epData.stills ?? [];
            for (const s of epStills.slice(0, 2)) {
              if (screencapUrls.length >= 3) break;
              const url = `${IMG_BASE}/w780${(s as { file_path: string }).file_path}`;
              if (!screencapUrls.includes(url)) screencapUrls.push(url);
            }
          }
        } catch (error) { log.warn(`Failed to fetch TMDB stills for episode ${ep}`, String(error)); }
      }
    }
  }

  if (screencapUrls.length < 3) {
    try {
      const imagesRes = await fetch(
        `${TMDB_BASE}/${type}/${tmdbId}/images?api_key=${apiKey}`,
        { signal: timeoutSignal() }
      );
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        const backdrops = imagesData.backdrops ?? [];
        const remaining = 3 - screencapUrls.length;
        const newUrls = backdrops
          .slice(1)
          .filter((_: unknown, i: number) => i % 2 === 0)
          .slice(0, remaining)
          .map((b: { file_path: string }) => `${IMG_BASE}/w780${b.file_path}`);
        screencapUrls.push(...newUrls);
      }
    } catch (error) { log.warn('Failed to fetch TMDB backdrops', String(error)); }
  }

  return screencapUrls;
}

export async function searchTMDB(
  title: string,
  type: 'movie' | 'tv',
  year?: string
): Promise<{ posterUrl: string; backdropUrls: string[] } | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const top = await fetchTMDBSearch(title, type, year, apiKey);
  if (!top) return null;

  const posterPath = top.poster_path;
  const posterUrl = posterPath ? `${IMG_BASE}/w500${posterPath}` : '';
  const screencapUrls = await fetchTMDBImages(top.id, type, apiKey);

  log.success(`TMDB: found "${top.title ?? top.name}"`, `poster + ${screencapUrls.length} screencaps`);
  return { posterUrl, backdropUrls: screencapUrls };
}

export interface TMDBDetail {
  title: string | null;
  posterUrl: string | null;
  backdropUrls: string[];
  year: string | null;
  description: string | null;
  actors: string[];
}

export async function searchTMDBDetailed(
  title: string,
  type: 'movie' | 'tv',
  year?: string
): Promise<TMDBDetail | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const top = await fetchTMDBSearch(title, type, year, apiKey);
  if (!top) return null;

  const posterPath = top.poster_path;
  const posterUrl = posterPath ? `${IMG_BASE}/w500${posterPath}` : null;
  const description = top.overview ?? null;
  const dateStr = type === 'movie' ? top.release_date : top.first_air_date;
  const resultYear = dateStr ? dateStr.slice(0, 4) : null;

  // Fetch cast + images in parallel — NO second /search call (fixes double-search bug)
  const [creditsResult, backdropUrls] = await Promise.all([
    (async () => {
      try {
        const creditsRes = await fetch(
          `${TMDB_BASE}/${type}/${top.id}/credits?api_key=${apiKey}`,
          { signal: timeoutSignal() }
        );
        if (!creditsRes.ok) return [];
        const creditsData = await creditsRes.json();
        return ((creditsData.cast ?? []) as { name: string }[]).slice(0, 4).map(c => c.name);
      } catch (error) { log.warn('Failed to fetch TMDB credits', String(error)); return []; }
    })(),
    fetchTMDBImages(top.id, type, apiKey),
  ]);

  const canonicalTitle = (type === 'movie' ? top.title : top.name) ?? null;
  log.success(`TMDB detail: "${canonicalTitle}"`, `year=${resultYear} actors=${creditsResult.length}`);
  return {
    title: canonicalTitle,
    posterUrl,
    backdropUrls,
    year: resultYear,
    description,
    actors: creditsResult,
  };
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  year: string | null;
  description: string;
  posterPath: string | null;
  popularity: number;
  voteAverage: number;
}

export async function searchTMDBMulti(
  queries: string[],
  type: 'movie' | 'tv'
): Promise<TMDBSearchResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  // Parallel fetches — previously serial, multiplied latency by queries.length
  const batches = await Promise.all(queries.map(async (query) => {
    const cacheKey = `tmdb:multi:${type}:${query.toLowerCase()}`;
    const cached = cacheGet<TMDBSearchItem[]>(cacheKey);
    if (cached !== undefined) return cached;
    try {
      const res = await fetch(
        `${TMDB_BASE}/search/${type}?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1&api_key=${apiKey}`,
        { signal: timeoutSignal() }
      );
      if (!res.ok) { cacheSet(cacheKey, []); return []; }
      const data = await res.json();
      const items: TMDBSearchItem[] = (data.results ?? []).slice(0, 5);
      cacheSet(cacheKey, items);
      return items;
    } catch (error) { log.warn(`Failed to search TMDB for query: ${query}`, String(error)); return []; }
  }));

  const seen = new Set<number>();
  const results: TMDBSearchResult[] = [];
  for (const batch of batches) {
    for (const item of batch) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const titleField = type === 'movie' ? item.title : item.name;
      const dateField = type === 'movie' ? item.release_date : item.first_air_date;
      results.push({
        id: item.id,
        title: titleField ?? '',
        year: dateField ? dateField.slice(0, 4) : null,
        description: item.overview ?? '',
        posterPath: item.poster_path ?? null,
        popularity: item.popularity ?? 0,
        voteAverage: item.vote_average ?? 0,
      });
    }
  }
  return results;
}
