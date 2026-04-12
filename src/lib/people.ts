import { db } from '@/lib/db';
import { log } from '@/lib/logger';

export interface Person {
  id: number;
  name: string;
  photo_url: string | null;
  role: string | null;
  metadata: string | null;
  created_at: string;
}

export async function getAllPeople(): Promise<Person[]> {
  const client = await db();
  const result = await client.execute('SELECT * FROM people ORDER BY name');
  return result.rows as unknown as Person[];
}

export async function addPerson(data: { name: string; photo_url?: string; role?: string; metadata?: string }): Promise<Person> {
  const client = await db();
  const result = await client.execute({
    sql: 'INSERT INTO people (name, photo_url, role, metadata) VALUES (?, ?, ?, ?)',
    args: [data.name, data.photo_url ?? null, data.role ?? null, data.metadata ?? null],
  });
  const id = Number(result.lastInsertRowid);
  return {
    id,
    name: data.name,
    photo_url: data.photo_url ?? null,
    role: data.role ?? null,
    metadata: data.metadata ?? null,
    created_at: new Date().toISOString(),
  };
}

export async function removePerson(id: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: 'DELETE FROM people WHERE id = ?', args: [id] });
}

interface BravePersonResult {
  photo_url: string | null;
  role: string;
  description: string;
  fixedName: string | null;
}

export async function searchPersonBrave(name: string): Promise<BravePersonResult> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return { photo_url: null, role: 'unknown', description: '', fixedName: null };

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(name + ' actor director writer creator')}&count=5`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return { photo_url: null, role: 'unknown', description: '', fixedName: null };

    const data = await res.json();
    const results = data?.web?.results ?? [];
    const descriptions = results.map((r: Record<string, unknown>) => (r.description as string) ?? '').join(' ').toLowerCase();

    // Detect role from search results
    let role = 'creator';
    const roleKeywords: [string, string[]][] = [
      ['actor', ['actor', 'actress', 'starring', 'cast', 'imdb']],
      ['director', ['director', 'directed', 'filmmaker', 'filmmaking']],
      ['writer', ['author', 'writer', 'novelist', 'substack', 'journalist', 'columnist']],
      ['musician', ['singer', 'musician', 'band', 'album', 'songwriter', 'rapper']],
      ['youtuber', ['youtube', 'youtuber', 'channel', 'subscriber', 'content creator']],
      ['animator', ['animator', 'mangaka', 'manga', 'anime creator', 'studio']],
      ['voice actor', ['voice actor', 'voice actress', 'seiyuu', 'dub']],
    ];

    let maxScore = 0;
    for (const [r, keywords] of roleKeywords) {
      const score = keywords.filter(k => descriptions.includes(k)).length;
      if (score > maxScore) { maxScore = score; role = r; }
    }

    // Try to get a photo from the thumbnail or infobox
    let photo_url: string | null = null;
    const infobox = data?.infobox;
    if (infobox?.thumbnail?.src) {
      photo_url = infobox.thumbnail.src;
    } else if (infobox?.images?.[0]?.src) {
      photo_url = infobox.images[0].src;
    }
    // Fallback: try thumbnail from first result
    if (!photo_url) {
      for (const r of results) {
        const thumb = (r as Record<string, unknown>).thumbnail;
        if (thumb && typeof thumb === 'object' && (thumb as Record<string, unknown>).src) {
          photo_url = (thumb as Record<string, unknown>).src as string;
          break;
        }
      }
    }

    const description = (results[0] as Record<string, unknown>)?.description as string ?? '';

    // Extract canonical name from infobox or first result title
    let fixedName: string | null = null;
    if (infobox?.title && typeof infobox.title === 'string') {
      fixedName = infobox.title.trim();
    } else if (results[0]) {
      const resultTitle = ((results[0] as Record<string, unknown>).title as string) ?? '';
      const cleaned = resultTitle
        .replace(/\s*[\(\[].*?[\)\]]\s*/g, ' ')
        // Strip common page-title prefixes like "About | ", "Meet ", "Who is "
        .replace(/^(?:about|meet|who\s+is)\s*[|:–—]\s*/i, '')
        // Strip common suffixes like "- IMDb", "| Wikipedia", "- Biography"
        .replace(/\s*[-–—|:]\s*(imdb|wiki|wikipedia|tmdb|youtube|instagram|twitter|biography|filmography|rotten|metacritic|fandom|actor|actress|director|about|home|official).*/i, '')
        .trim();
      if (cleaned && cleaned.length > 1 && cleaned.length < 100) {
        fixedName = cleaned;
      }
    }

    if (fixedName && fixedName.toLowerCase() !== name.toLowerCase()) {
      log.success('Person name fixed', `"${name}" -> "${fixedName}"`);
    }

    log.success(`Brave person search: ${name}`, `role=${role} photo=${!!photo_url}`);
    return { photo_url, role, description: description.slice(0, 300), fixedName };
  } catch (err) {
    log.warn('Brave person search error', String(err));
    return { photo_url: null, role: 'unknown', description: '', fixedName: null };
  }
}
