import { db } from '@/lib/db';
import type { WatchProgress, ContentType } from '@/types/index';

export type ProgressWithFavorite = WatchProgress & {
  favorite_title: string;
  favorite_type: ContentType;
  favorite_image: string;
  favorite_external_id?: string;
};

export async function getProgressForFavorite(favoriteId: number): Promise<WatchProgress | undefined> {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT * FROM watch_progress WHERE favorite_id = ?', args: [favoriteId] });
  return result.rows[0] as unknown as WatchProgress | undefined;
}

export async function getAllProgress(): Promise<ProgressWithFavorite[]> {
  const client = await db();
  const result = await client.execute(`
    SELECT
      wp.*,
      f.title AS favorite_title,
      f.type AS favorite_type,
      f.image_url AS favorite_image,
      f.external_id AS favorite_external_id
    FROM watch_progress wp
    JOIN favorites f ON f.id = wp.favorite_id
    ORDER BY wp.updated_at DESC
  `);
  return result.rows as unknown as ProgressWithFavorite[];
}

export async function updateProgress(
  favoriteId: number,
  data: { current_season?: number; current_episode?: number; status?: string; stopped_at?: string | null }
): Promise<WatchProgress> {
  const client = await db();

  // Only update the fields that were actually provided, preserving existing values
  const sets: string[] = ['updated_at = datetime(\'now\')'];
  const args: (string | number | null)[] = [];

  if (data.current_season !== undefined) { sets.push('current_season = ?'); args.push(data.current_season); }
  if (data.current_episode !== undefined) { sets.push('current_episode = ?'); args.push(data.current_episode); }
  if (data.status !== undefined) { sets.push('status = ?'); args.push(data.status); }
  if (data.stopped_at !== undefined) { sets.push('stopped_at = ?'); args.push(data.stopped_at); }

  const existing = await getProgressForFavorite(favoriteId);
  if (existing) {
    args.push(favoriteId);
    await client.execute({
      sql: `UPDATE watch_progress SET ${sets.join(', ')} WHERE favorite_id = ?`,
      args,
    });
  } else {
    await client.execute({
      sql: `INSERT INTO watch_progress (favorite_id, current_season, current_episode, status, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [favoriteId, data.current_season ?? 1, data.current_episode ?? 1, data.status ?? 'watching'],
    });
  }
  return (await getProgressForFavorite(favoriteId)) as WatchProgress;
}

export async function createProgress(
  favoriteId: number,
  data: { current_season?: number; current_episode?: number; total_seasons?: number; total_episodes?: number; status?: string }
): Promise<WatchProgress> {
  const client = await db();
  const result = await client.execute({
    sql: 'INSERT INTO watch_progress (favorite_id, current_season, current_episode, total_seasons, total_episodes, status) VALUES (?, ?, ?, ?, ?, ?)',
    args: [favoriteId, data.current_season ?? 1, data.current_episode ?? 1, data.total_seasons ?? null, data.total_episodes ?? null, data.status ?? 'watching'],
  });
  const row = await client.execute({ sql: 'SELECT * FROM watch_progress WHERE id = ?', args: [Number(result.lastInsertRowid)] });
  return row.rows[0] as unknown as WatchProgress;
}

export async function markCompleted(favoriteId: number): Promise<void> {
  const client = await db();
  await client.execute({ sql: "UPDATE watch_progress SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE favorite_id = ?", args: [favoriteId] });
}

export async function incrementEpisode(favoriteId: number): Promise<WatchProgress> {
  const progress = await getProgressForFavorite(favoriteId);
  if (!progress) return createProgress(favoriteId, {});

  let newEpisode = progress.current_episode + 1;
  let newSeason = progress.current_season;

  if (progress.total_episodes && newEpisode > progress.total_episodes) {
    newEpisode = 1;
    newSeason = progress.current_season + 1;
  }

  return updateProgress(favoriteId, { current_season: newSeason, current_episode: newEpisode });
}
