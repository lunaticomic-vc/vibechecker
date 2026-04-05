import { NextRequest, NextResponse } from 'next/server';
import { getAllFavorites, addFavorite, removeFavorite, countFavorites, getFavoritesByStatus, countFavoritesByStatus, updateFavorite } from '@/lib/favorites';
import { autofixTitle } from '@/lib/autofix-title';
import { searchTMDBDetailed } from '@/lib/tmdb';
import { searchAnimeJikan } from '@/lib/mal';
import { log } from '@/lib/logger';
import type { ContentType } from '@/types/index';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as ContentType | null;
  const status = request.nextUrl.searchParams.get('status');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '25');
  const offset = parseInt(request.nextUrl.searchParams.get('offset') ?? '0');
  log.api('GET', '/api/favorites', `type=${type ?? 'all'} status=${status ?? 'all'} limit=${limit} offset=${offset}`);
  try {
    let favorites, total;
    if (type && status) {
      [favorites, total] = await Promise.all([
        getFavoritesByStatus(type, status, limit, offset),
        countFavoritesByStatus(type, status),
      ]);
    } else {
      [favorites, total] = await Promise.all([
        getAllFavorites(type ?? undefined, limit, offset),
        countFavorites(type ?? undefined),
      ]);
    }
    log.success(`Fetched ${favorites.length}/${total} favorites`, `${type ?? 'all'} ${status ?? ''}`);
    return NextResponse.json({ favorites, total, hasMore: offset + limit < total });
  } catch (err) {
    log.error('Failed to fetch favorites', err);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  log.api('POST', '/api/favorites');
  try {
    const body = await request.json();
    const { type, title, external_id, metadata, image_url } = body;
    log.db('INSERT favorite', `"${title}" (${type})`);

    if (!type || !title) {
      log.warn('Missing required fields', `type=${type} title=${title}`);
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
    }

    const validTypes: ContentType[] = ['movie', 'tv', 'anime', 'youtube', 'substack', 'kdrama'];
    if (!validTypes.includes(type)) {
      log.warn('Invalid content type', type);
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const fixedTitle = await autofixTitle(title, type);
    const favorite = await addFavorite({ type, title: fixedTitle, external_id, metadata, image_url });
    log.success(`Added favorite #${favorite.id}`, `"${title}" (${type})`);

    // Auto-enrich manually added records (no metadata yet) for movie/tv/anime/kdrama
    const enrichableTypes: ContentType[] = ['movie', 'tv', 'anime', 'kdrama'];
    if (!metadata && !image_url && enrichableTypes.includes(type)) {
      (async () => {
        try {
          let detail: { posterUrl: string | null; year: string | null; description: string | null; actors: string[] } | null = null;

          if (type === 'anime') {
            detail = await searchAnimeJikan(fixedTitle);
          }
          if (!detail) {
            const tmdbType = type === 'movie' ? 'movie' : 'tv';
            detail = await searchTMDBDetailed(fixedTitle, tmdbType);
          }
          if (!detail) return;

          const enriched: Record<string, unknown> = {};
          if (detail.year) enriched.year = detail.year;
          if (detail.description) enriched.description = detail.description;
          if (detail.actors?.length) enriched.actors = detail.actors;
          enriched.source = 'manual';

          await updateFavorite(favorite.id, {
            image_url: detail.posterUrl ?? undefined,
            metadata: JSON.stringify(enriched),
          });
          log.success(`Enriched favorite #${favorite.id}`, `"${fixedTitle}" — year=${detail.year} actors=${detail.actors?.length ?? 0}`);
        } catch (err) {
          log.warn('Failed to enrich favorite', String(err));
        }
      })();
    }

    return NextResponse.json(favorite, { status: 201 });
  } catch (err) {
    log.error('Failed to add favorite', err);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  log.api('DELETE', '/api/favorites', `id=${id}`);
  try {
    if (!id) {
      log.warn('Missing id param');
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await removeFavorite(Number(id));
    log.success(`Deleted favorite #${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Failed to delete favorite', err);
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 });
  }
}
