import { NextResponse } from 'next/server';
import { getRating, setRating, removeRating, getAllRatings } from '@/lib/ratings';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const favoriteId = url.searchParams.get('favorite_id');

  if (favoriteId) {
    const rating = await getRating(Number(favoriteId));
    return NextResponse.json(rating ?? null);
  }

  return NextResponse.json(await getAllRatings());
}

export async function POST(req: Request) {
  const body = await req.json();
  const { favorite_id, rating, reasoning } = body;

  if (!favorite_id || !rating) {
    return NextResponse.json({ error: 'favorite_id and rating are required' }, { status: 400 });
  }

  const valid = ['felt_things', 'enjoyed', 'watched', 'not_my_thing'];
  if (!valid.includes(rating)) {
    return NextResponse.json({ error: `Invalid rating. Must be one of: ${valid.join(', ')}` }, { status: 400 });
  }

  const result = await setRating(Number(favorite_id), rating, reasoning);
  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const favoriteId = url.searchParams.get('favorite_id');

  if (!favoriteId) {
    return NextResponse.json({ error: 'favorite_id is required' }, { status: 400 });
  }

  await removeRating(Number(favoriteId));
  return NextResponse.json({ success: true });
}
