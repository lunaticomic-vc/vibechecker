import { log } from '@/lib/logger';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export async function searchTMDB(
  title: string,
  type: 'movie' | 'tv',
  year?: string
): Promise<{ posterUrl: string; backdropUrls: string[] } | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const searchType = type === 'tv' ? 'tv' : 'movie';
    const yearParam = year ? `&${type === 'movie' ? 'year' : 'first_air_date_year'}=${year}` : '';
    const res = await fetch(
      `${TMDB_BASE}/search/${searchType}?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1&api_key=${apiKey}${yearParam}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;

    const top = results[0];
    const tmdbId = top.id;
    const posterPath = top.poster_path;
    const posterUrl = posterPath ? `${IMG_BASE}/w500${posterPath}` : '';

    let screencapUrls: string[] = [];

    if (searchType === 'tv') {
      // For TV: fetch stills from season 1 episode 1, then backdrops as fallback
      try {
        const stillsRes = await fetch(
          `${TMDB_BASE}/tv/${tmdbId}/season/1/episode/1/images?api_key=${apiKey}`
        );
        if (stillsRes.ok) {
          const stillsData = await stillsRes.json();
          const stills = stillsData.stills ?? [];
          // Skip first still (often a title card), pick diverse ones
          screencapUrls = stills
            .slice(1, 7)
            .filter((_: unknown, i: number) => i % 2 === 0) // every other for variety
            .slice(0, 3)
            .map((s: { file_path: string }) => `${IMG_BASE}/w780${s.file_path}`);
        }
      } catch { /* fallback to backdrops */ }

      // If not enough stills, try more episodes
      if (screencapUrls.length < 3) {
        for (const ep of [2, 3, 5]) {
          if (screencapUrls.length >= 3) break;
          try {
            const epRes = await fetch(
              `${TMDB_BASE}/tv/${tmdbId}/season/1/episode/${ep}/images?api_key=${apiKey}`
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
          } catch { /* skip */ }
        }
      }
    }

    // For movies or if TV stills weren't enough: use backdrops, skip the first one
    if (screencapUrls.length < 3) {
      try {
        const imagesRes = await fetch(
          `${TMDB_BASE}/${searchType}/${tmdbId}/images?api_key=${apiKey}`
        );
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const backdrops = imagesData.backdrops ?? [];
          // Skip first backdrop (main promotional), take diverse ones
          const remaining = 3 - screencapUrls.length;
          const newUrls = backdrops
            .slice(1) // skip main backdrop
            .filter((_: unknown, i: number) => i % 2 === 0) // every other for variety
            .slice(0, remaining)
            .map((b: { file_path: string }) => `${IMG_BASE}/w780${b.file_path}`);
          screencapUrls.push(...newUrls);
        }
      } catch { /* ignore */ }
    }

    log.success(`TMDB: found "${top.title ?? top.name}"`, `poster + ${screencapUrls.length} screencaps`);

    return {
      posterUrl,
      backdropUrls: screencapUrls,
    };
  } catch (err) {
    log.warn('TMDB search failed', String(err));
    return null;
  }
}

export interface TMDBDetail {
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

  try {
    const searchType = type === 'tv' ? 'tv' : 'movie';
    const yearParam = year ? `&${type === 'movie' ? 'year' : 'first_air_date_year'}=${year}` : '';
    const res = await fetch(
      `${TMDB_BASE}/search/${searchType}?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1&api_key=${apiKey}${yearParam}`
    );
    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;

    const top = results[0];
    const tmdbId = top.id;
    const posterPath = top.poster_path;
    const posterUrl = posterPath ? `${IMG_BASE}/w500${posterPath}` : null;
    const description = top.overview ?? null;
    const dateStr = type === 'movie' ? top.release_date : top.first_air_date;
    const resultYear = dateStr ? dateStr.slice(0, 4) : null;

    // Fetch cast
    let actors: string[] = [];
    try {
      const creditsRes = await fetch(
        `${TMDB_BASE}/${searchType}/${tmdbId}/credits?api_key=${apiKey}`
      );
      if (creditsRes.ok) {
        const creditsData = await creditsRes.json();
        actors = (creditsData.cast ?? [])
          .slice(0, 4)
          .map((c: { name: string }) => c.name);
      }
    } catch { /* best effort */ }

    // Reuse existing image logic
    const images = await searchTMDB(title, type);

    log.success(`TMDB detail: "${top.title ?? top.name}"`, `year=${resultYear} actors=${actors.length}`);
    return {
      posterUrl,
      backdropUrls: images?.backdropUrls ?? [],
      year: resultYear,
      description,
      actors,
    };
  } catch (err) {
    log.warn('TMDB detailed search failed', String(err));
    return null;
  }
}
