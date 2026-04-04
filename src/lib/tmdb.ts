import { log } from '@/lib/logger';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export async function searchTMDB(
  title: string,
  type: 'movie' | 'tv'
): Promise<{ posterUrl: string; backdropUrls: string[] } | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const searchType = type === 'tv' ? 'tv' : 'movie';
    const res = await fetch(
      `${TMDB_BASE}/search/${searchType}?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1&api_key=${apiKey}`
    );

    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) return null;

    const top = results[0];
    const tmdbId = top.id;
    const posterPath = top.poster_path;

    // Fetch additional images (backdrops/stills)
    const imagesRes = await fetch(
      `${TMDB_BASE}/${searchType}/${tmdbId}/images?api_key=${apiKey}`
    );

    let backdropUrls: string[] = [];
    if (imagesRes.ok) {
      const imagesData = await imagesRes.json();
      const backdrops = imagesData.backdrops ?? [];
      backdropUrls = backdrops
        .slice(0, 4)
        .map((b: { file_path: string }) => `${IMG_BASE}/w780${b.file_path}`);
    }

    const posterUrl = posterPath ? `${IMG_BASE}/w500${posterPath}` : '';

    log.success(`TMDB: found "${top.title ?? top.name}"`, `poster + ${backdropUrls.length} backdrops`);

    return {
      posterUrl,
      backdropUrls,
    };
  } catch (err) {
    log.warn('TMDB search failed', String(err));
    return null;
  }
}
