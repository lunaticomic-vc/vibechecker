import { db } from '@/lib/db';

const MAX_CALLS = 3;

export async function getRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const client = await db();

  const result = await client.execute({
    sql: `SELECT count, window_start FROM ip_usage WHERE ip = ?`,
    args: [ip],
  });

  const row = result.rows[0] as unknown as { count: number; window_start: string } | undefined;

  if (!row) {
    return { allowed: true, remaining: MAX_CALLS };
  }

  // If the window has expired, treat as fresh
  const expired = await client.execute({
    sql: `SELECT datetime(?, '+24 hours') < datetime('now') AS expired`,
    args: [row.window_start],
  });
  const isExpired = (expired.rows[0] as unknown as { expired: number })?.expired === 1;

  const count = isExpired ? 0 : row.count;

  return {
    allowed: count < MAX_CALLS,
    remaining: Math.max(0, MAX_CALLS - count),
  };
}

export async function consumeRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const client = await db();

  const result = await client.execute({
    sql: `INSERT INTO ip_usage (ip, count, window_start) VALUES (?, 1, datetime('now'))
          ON CONFLICT(ip) DO UPDATE SET
            count = CASE WHEN datetime(window_start, '+24 hours') < datetime('now') THEN 1 ELSE count + 1 END,
            window_start = CASE WHEN datetime(window_start, '+24 hours') < datetime('now') THEN datetime('now') ELSE window_start END
          RETURNING count`,
    args: [ip],
  });

  const count = (result.rows[0] as unknown as { count: number })?.count ?? 1;

  return {
    allowed: count <= MAX_CALLS,
    remaining: Math.max(0, MAX_CALLS - count),
  };
}
