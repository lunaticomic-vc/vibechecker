import { db } from '@/lib/db';
import type { ContentType, Favorite } from '@/types/index';

export async function getAllFavorites(type?: ContentType, limit?: number, offset?: number): Promise<Favorite[]> {
  const client = await db();
  const lim = limit ?? 10000;
  const off = offset ?? 0;
  if (type) {
    const result = await client.execute({ sql: 'SELECT * FROM favorites WHERE type = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', args: [type, lim, off] });
    return result.rows as unknown as Favorite[];
  }
  const result = await client.execute({ sql: 'SELECT * FROM favorites ORDER BY created_at DESC LIMIT ? OFFSET ?', args: [lim, off] });
  return result.rows as unknown as Favorite[];
}

// Status-aware queries: join with watch_progress to filter by status
export async function getFavoritesByStatus(type: ContentType, status: string, limit: number, offset: number): Promise<Favorite[]> {
  const client = await db();
  if (status === 'todo') {
    // Todo = no progress entry OR progress.status = 'todo', AND metadata.status not completed/watching
    const result = await client.execute({
      sql: `SELECT f.* FROM favorites f
            LEFT JOIN watch_progress wp ON wp.favorite_id = f.id
            WHERE f.type = ? AND (wp.id IS NULL OR wp.status = 'todo')
            ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      args: [type, limit, offset],
    });
    return result.rows as unknown as Favorite[];
  }
  const result = await client.execute({
    sql: `SELECT f.* FROM favorites f
          INNER JOIN watch_progress wp ON wp.favorite_id = f.id
          WHERE f.type = ? AND wp.status = ?
          ORDER BY wp.updated_at DESC LIMIT ? OFFSET ?`,
    args: [type, status, limit, offset],
  });
  return result.rows as unknown as Favorite[];
}

export async function countFavoritesByStatus(type: ContentType, status: string): Promise<number> {
  const client = await db();
  if (status === 'todo') {
    const result = await client.execute({
      sql: `SELECT count(*) as cnt FROM favorites f
            LEFT JOIN watch_progress wp ON wp.favorite_id = f.id
            WHERE f.type = ? AND (wp.id IS NULL OR wp.status = 'todo')`,
      args: [type],
    });
    return Number((result.rows[0] as unknown as { cnt: number }).cnt);
  }
  const result = await client.execute({
    sql: `SELECT count(*) as cnt FROM favorites f
          INNER JOIN watch_progress wp ON wp.favorite_id = f.id
          WHERE f.type = ? AND wp.status = ?`,
    args: [type, status],
  });
  return Number((result.rows[0] as unknown as { cnt: number }).cnt);
}

export async function countFavorites(type?: ContentType): Promise<number> {
  const client = await db();
  if (type) {
    const result = await client.execute({ sql: 'SELECT count(*) as cnt FROM favorites WHERE type = ?', args: [type] });
    return Number((result.rows[0] as unknown as { cnt: number }).cnt);
  }
  const result = await client.execute('SELECT count(*) as cnt FROM favorites');
  return Number((result.rows[0] as unknown as { cnt: number }).cnt);
}

export async function addFavorite(data: {
  type: ContentType;
  title: string;
  external_id?: string;
  metadata?: string;
  image_url?: string;
}): Promise<Favorite> {
  const client = await db();
  // Use RETURNING * to get the inserted row in one round trip instead of INSERT + SELECT
  const result = await client.execute({
    sql: 'INSERT INTO favorites (type, title, external_id, metadata, image_url) VALUES (?, ?, ?, ?, ?) RETURNING *',
    args: [data.type, data.title, data.external_id ?? null, data.metadata ?? null, data.image_url ?? null],
  });
  return result.rows[0] as unknown as Favorite;
}

/**
 * Bulk insert favorites using libsql's batch API. Used by import routes to avoid
 * the N+1 pattern of awaiting each addFavorite sequentially (400 round trips for a
 * 200-anime MAL import). Returns the count of rows inserted.
 */
export async function bulkAddFavorites(rows: Array<{
  type: ContentType;
  title: string;
  external_id?: string;
  metadata?: string;
  image_url?: string;
}>): Promise<number> {
  if (rows.length === 0) return 0;
  const client = await db();
  const statements = rows.map(r => ({
    sql: 'INSERT INTO favorites (type, title, external_id, metadata, image_url) VALUES (?, ?, ?, ?, ?)',
    args: [r.type, r.title, r.external_id ?? null, r.metadata ?? null, r.image_url ?? null] as (string | number | null)[],
  }));
  // batch() runs all statements in a single transaction — atomic + one network round trip
  await client.batch(statements, 'write');
  return rows.length;
}

export async function removeFavorite(id: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: 'DELETE FROM favorites WHERE id = ?', args: [id] });
}

export async function getFavoriteById(id: number): Promise<Favorite | undefined> {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM favorites WHERE id = ?', args: [id] });
  return result.rows[0] as unknown as Favorite | undefined;
}

const ALLOWED_FIELDS = ['title', 'type', 'external_id', 'metadata', 'image_url'];

export async function updateFavorite(id: number, data: Partial<Omit<Favorite, 'id' | 'created_at'>>): Promise<Favorite> {
  const client = await db();
  const fields = Object.keys(data).filter(k => ALLOWED_FIELDS.includes(k) && data[k as keyof typeof data] !== undefined);
  if (fields.length === 0) return (await getFavoriteById(id))!;
  const set = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => data[f as keyof typeof data] as string | number | null);
  await client.execute({ sql: `UPDATE favorites SET ${set} WHERE id = ?`, args: [...values, id] });
  return (await getFavoriteById(id))!;
}

export async function searchFavorites(query: string): Promise<Favorite[]> {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM favorites WHERE title LIKE ? ORDER BY created_at DESC LIMIT 50', args: [`%${query}%`] });
  return result.rows as unknown as Favorite[];
}

/** Find an existing favorite by type + case-insensitive title match. */
export async function findFavoriteByTitle(type: ContentType, title: string): Promise<Favorite | undefined> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT * FROM favorites WHERE type = ? AND LOWER(title) = LOWER(?) LIMIT 1',
    args: [type, title],
  });
  return result.rows[0] as unknown as Favorite | undefined;
}
