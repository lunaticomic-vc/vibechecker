import { NextRequest, NextResponse } from 'next/server';
import { getAllFavorites, addFavorite, removeFavorite } from '@/lib/favorites';
import type { ContentType } from '@/types/index';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type') as ContentType | null;
    const favorites = await getAllFavorites(type ?? undefined);
    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, external_id, metadata, image_url } = body;

    if (!type || !title) {
      return NextResponse.json({ error: 'type and title are required' }, { status: 400 });
    }

    const validTypes: ContentType[] = ['movie', 'tv', 'anime', 'youtube'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const favorite = await addFavorite({ type, title, external_id, metadata, image_url });
    return NextResponse.json(favorite, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    await removeFavorite(Number(id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete favorite' }, { status: 500 });
  }
}
