import { NextRequest, NextResponse } from 'next/server';
import { getRating, setRating, removeRating, getAllRatings } from '@/lib/ratings';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';
import { CONTENT_TYPES, type ContentType } from '@/types/index';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const favoriteId = url.searchParams.get('favorite_id');
  const type = url.searchParams.get('type');
  log.api('GET', '/api/ratings', favoriteId ? `favorite_id=${favoriteId}` : type ? `type=${type}` : 'all');

  try {
    if (favoriteId) {
      const rating = await getRating(Number(favoriteId));
      return NextResponse.json(rating ?? null);
    }

    const typeFilter = type && CONTENT_TYPES.includes(type as ContentType) ? (type as ContentType) : undefined;
    const ratings = await getAllRatings(typeFilter);
    log.success(`Fetched ${ratings.length} ratings`, typeFilter ? `type=${typeFilter}` : 'all');
    return NextResponse.json(ratings);
  } catch (err) {
    log.error('Failed to fetch ratings', err);
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  log.api('POST', '/api/ratings');
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  try {
    const { favorite_id, rating, reasoning } = body;
    log.db('SET rating', `favorite_id=${favorite_id} rating=${rating}${reasoning ? ` reason="${reasoning}"` : ''}`);

    if (!favorite_id || !rating) {
      log.warn('Missing fields', `favorite_id=${favorite_id} rating=${rating}`);
      return NextResponse.json({ error: 'favorite_id and rating are required' }, { status: 400 });
    }

    if (isNaN(Number(favorite_id))) {
      return NextResponse.json({ error: 'Invalid favorite_id' }, { status: 400 });
    }

    const valid = ['felt_things', 'enjoyed', 'watched', 'not_my_thing'];
    if (!valid.includes(rating)) {
      log.warn('Invalid rating value', rating);
      return NextResponse.json({ error: `Invalid rating. Must be one of: ${valid.join(', ')}` }, { status: 400 });
    }

    const result = await setRating(Number(favorite_id), rating, reasoning);
    log.success(`Rated favorite #${favorite_id}`, rating);
    return NextResponse.json(result);
  } catch (err) {
    log.error('Failed to set rating', err);
    return NextResponse.json({ error: 'Failed to set rating' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const favoriteId = url.searchParams.get('favorite_id');
  log.api('DELETE', '/api/ratings', `favorite_id=${favoriteId}`);

  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!favoriteId) {
      return NextResponse.json({ error: 'favorite_id is required' }, { status: 400 });
    }

    await removeRating(Number(favoriteId));
    log.success(`Removed rating for favorite #${favoriteId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Failed to remove rating', err);
    return NextResponse.json({ error: 'Failed to remove rating' }, { status: 500 });
  }
}
