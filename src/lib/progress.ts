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

export async function getAllProgress(type?: ContentType): Promise<ProgressWithFavorite[]> {
  const client = await db();
  if (type) {
    const result = await client.execute({
      sql: `
        SELECT
          wp.*,
          f.title AS favorite_title,
          f.type AS favorite_type,
          f.image_url AS favorite_image,
          f.external_id AS favorite_external_id
        FROM watch_progress wp
        JOIN favorites f ON f.id = wp.favorite_id
        WHERE f.type = ?
        ORDER BY wp.updated_at DESC
      `,
      args: [type],
    });
    return result.rows as unknown as ProgressWithFavorite[];
  }
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

  // Single upsert with RETURNING * — replaces the old SELECT + UPDATE/INSERT + SELECT
  // (3 round trips) with one atomic round trip. Uses COALESCE on the UPDATE branch to
  // preserve fields the caller didn't specify.
  const result = await client.execute({
    sql: `INSERT INTO watch_progress (favorite_id, current_season, current_episode, status, stopped_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(favorite_id) DO UPDATE SET
            current_season = COALESCE(excluded.current_season, watch_progress.current_season),
            current_episode = COALESCE(excluded.current_episode, watch_progress.current_episode),
            status = COALESCE(excluded.status, watch_progress.status),
            stopped_at = CASE WHEN ? = 1 THEN excluded.stopped_at ELSE watch_progress.stopped_at END,
            updated_at = datetime('now')
          RETURNING *`,
    args: [
      favoriteId,
      data.current_season ?? null,
      data.current_episode ?? null,
      data.status ?? null,
      data.stopped_at ?? null,
      data.stopped_at !== undefined ? 1 : 0,
    ],
  });
  return result.rows[0] as unknown as WatchProgress;
}

export async function createProgress(
  favoriteId: number,
  data: { current_season?: number; current_episode?: number; total_seasons?: number; total_episodes?: number; status?: string }
): Promise<WatchProgress> {
  const client = await db();
  // RETURNING * eliminates the follow-up SELECT
  const result = await client.execute({
    sql: 'INSERT INTO watch_progress (favorite_id, current_season, current_episode, total_seasons, total_episodes, status) VALUES (?, ?, ?, ?, ?, ?) RETURNING *',
    args: [favoriteId, data.current_season ?? 1, data.current_episode ?? 1, data.total_seasons ?? null, data.total_episodes ?? null, data.status ?? 'watching'],
  });
  return result.rows[0] as unknown as WatchProgress;
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
