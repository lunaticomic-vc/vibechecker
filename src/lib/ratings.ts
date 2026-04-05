import { db } from '@/lib/db';
import type { Rating, RatingValue } from '@/types/index';

export async function getRating(favoriteId: number): Promise<Rating | undefined> {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM ratings WHERE favorite_id = ?', args: [favoriteId] });
  return result.rows[0] as unknown as Rating | undefined;
}

export async function getAllRatings(): Promise<Rating[]> {
  const client = await db();
  const result = await client.execute('SELECT * FROM ratings ORDER BY created_at DESC');
  return result.rows as unknown as Rating[];
}

export async function setRating(favoriteId: number, rating: RatingValue, reasoning?: string): Promise<Rating> {
  const client = await db();
  await client.execute({
    sql: `INSERT INTO ratings (favorite_id, rating, reasoning)
          VALUES (?, ?, ?)
          ON CONFLICT(favorite_id) DO UPDATE SET
            rating = excluded.rating,
            reasoning = excluded.reasoning,
            created_at = CURRENT_TIMESTAMP`,
    args: [favoriteId, rating, reasoning ?? null],
  });
  return {
    favorite_id: favoriteId,
    rating,
    reasoning: reasoning ?? null,
    created_at: new Date().toISOString(),
  } as Rating;
}

export async function removeRating(favoriteId: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: 'DELETE FROM ratings WHERE favorite_id = ?', args: [favoriteId] });
}
