import { NextRequest, NextResponse } from 'next/server';
import { getAllProgress, createProgress, updateProgress, getProgressForFavorite } from '@/lib/progress';

export async function GET() {
  try {
    const progress = await getAllProgress();
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { favorite_id, current_season, current_episode, total_seasons, total_episodes, status } = body;

    if (!favorite_id) {
      return NextResponse.json({ error: 'favorite_id is required' }, { status: 400 });
    }

    const existing = await getProgressForFavorite(Number(favorite_id));
    let progress;

    if (existing) {
      progress = await updateProgress(Number(favorite_id), { current_season, current_episode, status });
    } else {
      progress = await createProgress(Number(favorite_id), { current_season, current_episode, total_seasons, total_episodes, status });
    }

    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: 'Failed to create/update progress' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const body = await req.json();
    const { current_episode, current_season, status } = body;

    const progress = await updateProgress(Number(id), { current_episode, current_season, status });
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
