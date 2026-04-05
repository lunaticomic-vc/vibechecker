import { NextRequest, NextResponse } from 'next/server';
import { buildUserPreferences } from '@/lib/user-preferences';
import { log } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log.api('GET', '/api/cron/preferences', 'weekly taste profile rebuild');
  const content = await buildUserPreferences();
  return NextResponse.json({ success: true, length: content.length });
}
