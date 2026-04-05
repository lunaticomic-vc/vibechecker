import { NextResponse } from 'next/server';
import { buildUserPreferences } from '@/lib/user-preferences';
import { log } from '@/lib/logger';

export async function GET() {
  log.api('GET', '/api/cron/preferences', 'weekly taste profile rebuild');
  const content = await buildUserPreferences();
  return NextResponse.json({ success: true, length: content.length });
}
