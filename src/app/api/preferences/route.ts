import { NextResponse } from 'next/server';
import { buildUserPreferences, getUserPreferences } from '@/lib/user-preferences';
import { log } from '@/lib/logger';

// GET — read current preferences
export async function GET() {
  const prefs = await getUserPreferences();
  if (!prefs) {
    return NextResponse.json({ exists: false, content: null });
  }
  return NextResponse.json({ exists: true, content: prefs });
}

// POST — rebuild preferences
export async function POST() {
  log.api('POST', '/api/preferences', 'rebuilding taste profile...');
  const content = await buildUserPreferences();
  return NextResponse.json({ success: true, content });
}
