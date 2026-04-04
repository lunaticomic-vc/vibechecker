import { NextResponse } from 'next/server';
import { fetchMALAnimeList } from '@/lib/mal';
import { addFavorite, getAllFavorites } from '@/lib/favorites';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const animeList = await fetchMALAnimeList(username.trim(), { limit: 100 });

    if (animeList.length === 0) {
      return NextResponse.json({ error: 'No anime found for this user. Make sure the list is public.' }, { status: 404 });
    }

    const existing = await getAllFavorites('anime');
    const existingTitles = new Set(existing.map(f => f.title.toLowerCase()));

    let imported = 0;
    let skipped = 0;

    for (const anime of animeList) {
      if (existingTitles.has(anime.title.toLowerCase())) {
        skipped++;
        continue;
      }

      await addFavorite({
        type: 'anime',
        title: anime.title,
        external_id: `mal:${anime.mal_id}`,
        image_url: anime.image_url,
        metadata: JSON.stringify({
          mal_id: anime.mal_id,
          episodes: anime.episodes,
          score: anime.score,
          status: anime.status,
        }),
      });
      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: animeList.length,
      message: `Imported ${imported} anime${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
