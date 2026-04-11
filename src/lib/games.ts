// Game lookup via Steam's free store search API (no auth required).
// Returns a canonical title, cover image, and Steam app URL.

import { log } from '@/lib/logger';

interface SteamSearchItem {
  id: number;
  name: string;
  tiny_image?: string;
  release_date?: { date?: string };
}

export interface GameDetail {
  title: string;
  posterUrl: string | null;
  year: string | null;
  description: string | null;
  external_id: string;
}

/**
 * Search Steam for a game and return its canonical title + cover art.
 * Steam's storesearch endpoint is free and unauthenticated.
 */
export async function searchGameSteam(title: string): Promise<GameDetail | null> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&cc=us&l=en`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) {
      log.warn('Steam storesearch failed', `${res.status}`);
      return null;
    }

    const data = await res.json() as { items?: SteamSearchItem[] };
    const top = data.items?.[0];
    if (!top) return null;

    // Steam serves the same artwork from a few CDN hosts. The portrait library
    // image looks most like a "poster" but isn't always present, so fall back
    // to the universally-available header.jpg.
    const portrait = `https://cdn.cloudflare.steamstatic.com/steam/apps/${top.id}/library_600x900_2x.jpg`;
    const header = `https://cdn.cloudflare.steamstatic.com/steam/apps/${top.id}/header.jpg`;
    const posterUrl = (await urlExists(portrait)) ? portrait : header;

    const year = top.release_date?.date?.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;

    return {
      title: top.name,
      posterUrl,
      year,
      description: null,
      external_id: `https://store.steampowered.com/app/${top.id}/`,
    };
  } catch (err) {
    log.warn('Steam storesearch error', String(err));
    return null;
  }
}

/** HEAD-check a URL to confirm the asset exists before using it. */
async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
