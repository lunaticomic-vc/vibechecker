import { NextRequest, NextResponse } from 'next/server';
import { getAllProgress, createProgress, updateProgress, getProgressForFavorite } from '@/lib/progress';
import { log } from '@/lib/logger';

export async function GET() {
  log.api('GET', '/api/progress');
  try {
    const progress = await getAllProgress();
    log.success(`Fetched ${progress.length} progress items`);
    return NextResponse.json(progress);
  } catch (err) {
    log.error('Failed to fetch progress', err);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  log.api('POST', '/api/progress');
  try {
    const body = await req.json();
    const { favorite_id, current_season, current_episode, total_seasons, total_episodes, status } = body;
    log.db('UPSERT progress', `favorite_id=${favorite_id} S${current_season ?? '?'}E${current_episode ?? '?'}`);

    if (!favorite_id) {
      log.warn('Missing favorite_id');
      return NextResponse.json({ error: 'favorite_id is required' }, { status: 400 });
    }

    const existing = await getProgressForFavorite(Number(favorite_id));
    let progress;

    if (existing) {
      progress = await updateProgress(Number(favorite_id), { current_season, current_episode, status });
      log.success('Updated progress', `favorite_id=${favorite_id}`);
    } else {
      progress = await createProgress(Number(favorite_id), { current_season, current_episode, total_seasons, total_episodes, status });
      log.success('Created progress', `favorite_id=${favorite_id}`);
    }

    return NextResponse.json(progress);
  } catch (err) {
    log.error('Failed to create/update progress', err);
    return NextResponse.json({ error: 'Failed to create/update progress' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  log.api('PATCH', '/api/progress', `id=${id}`);
  try {
    if (!id) {
      log.warn('Missing id param');
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const body = await req.json();
    const { current_episode, current_season, status, stopped_at } = body;
    log.db('UPDATE progress', `id=${id} ep=${current_episode ?? '-'} season=${current_season ?? '-'} status=${status ?? '-'}`);

    const progress = await updateProgress(Number(id), { current_episode, current_season, status, stopped_at });
    log.success('Patched progress', `id=${id}`);
    return NextResponse.json(progress);
  } catch (err) {
    log.error('Failed to update progress', err);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
