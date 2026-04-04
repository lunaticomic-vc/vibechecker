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
