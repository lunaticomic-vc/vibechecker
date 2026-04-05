import { NextRequest, NextResponse } from 'next/server';
import { parseLetterboxdCSV } from '@/lib/letterboxd';
import { addFavorite, getAllFavorites } from '@/lib/favorites';
import { verifyAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { csv } = await req.json();

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
    }

    const entries = parseLetterboxdCSV(csv);

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No movies found in the CSV. Check the format.' }, { status: 400 });
    }

    const existing = await getAllFavorites('movie');
    const existingTitles = new Set(existing.map(f => f.title.toLowerCase()));

    let imported = 0;
    let skipped = 0;

    for (const entry of entries) {
      if (existingTitles.has(entry.title.toLowerCase())) {
        skipped++;
        continue;
      }

      await addFavorite({
        type: 'movie',
        title: entry.year ? `${entry.title} (${entry.year})` : entry.title,
        external_id: entry.letterboxd_uri || undefined,
        metadata: entry.rating ? JSON.stringify({ rating: entry.rating, source: 'letterboxd' }) : undefined,
      });
      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: entries.length,
      message: `Imported ${imported} movie${imported !== 1 ? 's' : ''}${skipped > 0 ? `, skipped ${skipped} duplicates` : ''}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
