import type { ContentType } from '@/types/index';

export function buildSflixUrl(title: string): string {
  return `https://sflix.ps/search/${encodeURIComponent(title)}`;
}

export function buildYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function buildYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildMALSearchUrl(title: string): string {
  return `https://myanimelist.net/search/all?q=${encodeURIComponent(title)}`;
}

export function buildLetterboxdSearchUrl(title: string): string {
  return `https://letterboxd.com/search/${encodeURIComponent(title)}`;
}

/** Build a Mangago slug: lowercase, underscores for spaces, strip punctuation. */
export function mangagoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:\-–—!?.,'"()\[\]]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Build a direct Mangago read URL from a title. */
export function buildMangagoUrl(title: string): string {
  return `https://www.mangago.me/read-manga/${mangagoSlug(title)}/`;
}

/** Build a direct link for a favorite based on its external_id or content type. */
export function buildDirectLink(type: ContentType, title: string, externalId?: string): string {
  if (externalId) return externalId;
  const t = encodeURIComponent(title);
  switch (type) {
    case 'youtube': return `https://www.youtube.com/results?search_query=${t}`;
    case 'substack': return `https://substack.com/search/${t}`;
    case 'anime': return `https://gogoanimes.cv/search?keyword=${t}`;
    case 'kdrama': return `https://kissasian.cam/search?keyword=${t}`;
    case 'movie':
    case 'tv': return `https://sflix.ps/search/${t}`;
    case 'poetry': return `https://www.poetryfoundation.org/search?query=${t}`;
    case 'book': return `https://z-library.bz/s/${t}`;
    case 'short_story': return `https://www.google.com/search?q=${t}+short+story+read+online`;
    case 'essay': return `https://www.google.com/search?q=${t}+essay+read+online`;
    case 'podcast': return `https://open.spotify.com/search/${t}/podcasts`;
    case 'research': return `https://scholar.google.com/scholar?q=${t}`;
    case 'manga': return buildMangagoUrl(title);
    case 'comic': return `https://readcomiconline.li/Search/Comic?keyword=${t}`;
    default: return `https://www.google.com/search?q=${t}`;
  }
}
