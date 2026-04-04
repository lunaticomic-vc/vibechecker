import { NextRequest, NextResponse } from 'next/server';
import { getAllFavorites, addFavorite, removeFavorite } from '@/lib/favorites';
import { log } from '@/lib/logger';
import type { ContentType } from '@/types/index';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type') as ContentType | null;
  log.api('GET', '/api/favorites', type ? `type=${type}` : 'all');
  try {
    const favorites = await getAllFavorites(type ?? undefined);
    log.success(`Fetched ${favorites.length} favorites`, type ?? 'all types');
    return NextResponse.json(favorites);
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

    const validTypes: ContentType[] = ['movie', 'tv', 'anime', 'youtube'];
    if (!validTypes.includes(type)) {
      log.warn('Invalid content type', type);
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const favorite = await addFavorite({ type, title, external_id, metadata, image_url });
    log.success(`Added favorite #${favorite.id}`, `"${title}" (${type})`);
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
