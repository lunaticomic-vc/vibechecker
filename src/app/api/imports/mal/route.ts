import { NextRequest, NextResponse } from 'next/server';
import { fetchMALAnimeList } from '@/lib/mal';
import { bulkAddFavorites, getAllFavorites } from '@/lib/favorites';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  log.api('POST', '/api/imports/mal');

  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      log.warn('Missing username');
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    log.ai('Fetching MAL list', `user="${username.trim()}" via ${process.env.MAL_CLIENT_ID ? 'official API' : 'Jikan'}`);
    const animeList = await fetchMALAnimeList(username.trim());
    log.success(`Fetched ${animeList.length} anime from MAL`);

    if (animeList.length === 0) {
      log.warn('No anime found for user', username);
      return NextResponse.json({ error: 'No anime found for this user. Make sure the list is public.' }, { status: 404 });
    }

    const existing = await getAllFavorites('anime');
    const existingTitles = new Set(existing.map(f => f.title.toLowerCase()));

    // De-dupe and prepare rows for a single bulk insert — previously this was a serial
    // for-loop of addFavorite calls (2 round trips per row = 400 round trips for 200 anime).
    const rowsToInsert = animeList
      .filter(anime => !existingTitles.has(anime.title.toLowerCase()))
      .map(anime => ({
        type: 'anime' as const,
        title: anime.title,
        external_id: `mal:${anime.mal_id}`,
        image_url: anime.image_url,
        metadata: JSON.stringify({
          mal_id: anime.mal_id,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
        }),
      }));

    const imported = await bulkAddFavorites(rowsToInsert);
    const skipped = animeList.length - rowsToInsert.length;

    log.success(`MAL import done`, `imported=${imported} skipped=${skipped} total=${animeList.length}`);
    return NextResponse.json({
      imported,
      skipped,
      total: animeList.length,
      message: `Imported ${imported} anime${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    log.error('MAL import failed', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
