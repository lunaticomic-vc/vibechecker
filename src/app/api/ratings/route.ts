import { NextResponse } from 'next/server';
import { getRating, setRating, removeRating, getAllRatings } from '@/lib/ratings';
import { log } from '@/lib/logger';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const favoriteId = url.searchParams.get('favorite_id');
  log.api('GET', '/api/ratings', favoriteId ? `favorite_id=${favoriteId}` : 'all');

  if (favoriteId) {
    const rating = await getRating(Number(favoriteId));
    return NextResponse.json(rating ?? null);
  }

  const ratings = await getAllRatings();
  log.success(`Fetched ${ratings.length} ratings`);
  return NextResponse.json(ratings);
}

export async function POST(req: Request) {
  log.api('POST', '/api/ratings');
  const body = await req.json();
  const { favorite_id, rating, reasoning } = body;
  log.db('SET rating', `favorite_id=${favorite_id} rating=${rating}${reasoning ? ` reason="${reasoning}"` : ''}`);

  if (!favorite_id || !rating) {
    log.warn('Missing fields', `favorite_id=${favorite_id} rating=${rating}`);
    return NextResponse.json({ error: 'favorite_id and rating are required' }, { status: 400 });
  }

  const valid = ['felt_things', 'enjoyed', 'watched', 'not_my_thing'];
  if (!valid.includes(rating)) {
    log.warn('Invalid rating value', rating);
    return NextResponse.json({ error: `Invalid rating. Must be one of: ${valid.join(', ')}` }, { status: 400 });
  }

  const result = await setRating(Number(favorite_id), rating, reasoning);
  log.success(`Rated favorite #${favorite_id}`, rating);
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const favoriteId = url.searchParams.get('favorite_id');
  log.api('DELETE', '/api/ratings', `favorite_id=${favoriteId}`);

  if (!favoriteId) {
    return NextResponse.json({ error: 'favorite_id is required' }, { status: 400 });
  }

  await removeRating(Number(favoriteId));
  log.success(`Removed rating for favorite #${favoriteId}`);
  return NextResponse.json({ success: true });
}
