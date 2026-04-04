import { db } from '@/lib/db';
import type { ContentType, Favorite } from '@/types/index';

export async function getAllFavorites(type?: ContentType): Promise<Favorite[]> {
  const client = await db();
  if (type) {
    const result = await client.execute({ sql: 'SELECT * FROM favorites WHERE type = ? ORDER BY created_at DESC', args: [type] });
    return result.rows as unknown as Favorite[];
  }
  const result = await client.execute('SELECT * FROM favorites ORDER BY created_at DESC');
  return result.rows as unknown as Favorite[];
}

export async function addFavorite(data: {
  type: ContentType;
  title: string;
  external_id?: string;
  metadata?: string;
  image_url?: string;
}): Promise<Favorite> {
  const client = await db();
  const result = await client.execute({
    sql: 'INSERT INTO favorites (type, title, external_id, metadata, image_url) VALUES (?, ?, ?, ?, ?)',
    args: [data.type, data.title, data.external_id ?? null, data.metadata ?? null, data.image_url ?? null],
  });
  return (await getFavoriteById(Number(result.lastInsertRowid)))!;
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

export async function updateFavorite(id: number, data: Partial<Omit<Favorite, 'id' | 'created_at'>>): Promise<Favorite> {
  const client = await db();
  const fields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
  if (fields.length === 0) return (await getFavoriteById(id))!;
  const set = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => data[f as keyof typeof data] as string | number | null);
  await client.execute({ sql: `UPDATE favorites SET ${set} WHERE id = ?`, args: [...values, id] });
  return (await getFavoriteById(id))!;
}

export async function searchFavorites(query: string): Promise<Favorite[]> {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM favorites WHERE title LIKE ? ORDER BY created_at DESC', args: [`%${query}%`] });
  return result.rows as unknown as Favorite[];
}
