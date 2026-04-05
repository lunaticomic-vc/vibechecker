import { db } from '@/lib/db';

const MAX_CALLS = 3;

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const client = await db();

  const result = await client.execute({ sql: 'SELECT count FROM ip_usage WHERE ip = ?', args: [ip] });
  const row = result.rows[0] as unknown as { count: number } | undefined;
  const used = row?.count ?? 0;

  if (used >= MAX_CALLS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_CALLS - used };
}

export async function incrementUsage(ip: string): Promise<void> {
  const client = await db();

  await client.execute({
    sql: `INSERT INTO ip_usage (ip, count) VALUES (?, 1)
          ON CONFLICT(ip) DO UPDATE SET count = count + 1`,
    args: [ip],
  });
}
