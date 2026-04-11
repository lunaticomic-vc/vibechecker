import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthCookie } from '@/lib/auth';
import { addFavorite, findFavoriteByTitle } from '@/lib/favorites';
import { updateProgress } from '@/lib/progress';
import { writeMemoriesFile } from '@/lib/memories';
import { log } from '@/lib/logger';
import { CONTENT_TYPES, type ContentType } from '@/types/index';

export async function GET() {
  const client = await db();
  const result = await client.execute('SELECT title, type, reason FROM rejected_recommendations ORDER BY created_at DESC');
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, type, reason } = body;
  if (!title || !type) return NextResponse.json({ error: 'title and type required' }, { status: 400 });
  if (!CONTENT_TYPES.includes(type as ContentType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const client = await db();

  // Special case: "already_seen" → the user has consumed this before, so promote it
  // into their library as Completed rather than blacklisting it.
  if (reason === 'already_seen') {
    log.db('REJECT as already_seen', `"${title}" (${type})`);
    try {
      let favorite = await findFavoriteByTitle(type as ContentType, title);
      if (!favorite) {
        favorite = await addFavorite({
          type: type as ContentType,
          title,
          metadata: JSON.stringify({ source: 'manual', notes: 'added via already-seen rejection' }),
        });
      }
      await updateProgress(favorite.id, { status: 'completed' });
      log.success('Marked as already seen → completed', `favorite #${favorite.id}`);
      return NextResponse.json({ success: true, status: 'completed', favorite_id: favorite.id });
    } catch (err) {
      log.error('Failed to mark as already seen', err);
      return NextResponse.json({ error: 'Failed to mark as already seen' }, { status: 500 });
    }
  }

  // Any other reason → blacklist AND persist to memories.md so the taste profile
  // can learn from explicit dislikes.
  log.db('REJECT with reason', `"${title}" (${type}) reason=${reason ?? 'none'}`);
  try {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO rejected_recommendations (title, type, reason) VALUES (?, ?, ?)',
      args: [title, type, reason ?? null],
    });
  } catch (err) {
    log.warn('Failed to insert rejection', String(err));
  }

  // Mirror to memories.md on the local filesystem (best-effort, no-op in serverless)
  writeMemoriesFile().catch(() => {});

  return NextResponse.json({ success: true, status: 'rejected' });
}
