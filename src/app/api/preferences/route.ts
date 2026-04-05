import { NextRequest, NextResponse } from 'next/server';
import { buildUserPreferences, getUserPreferences } from '@/lib/user-preferences';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';

export async function GET() {
  const prefs = await getUserPreferences();
  if (!prefs) {
    return NextResponse.json({ exists: false, content: null });
  }
  return NextResponse.json({ exists: true, content: prefs });
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  log.api('POST', '/api/preferences', 'rebuilding taste profile...');
  const content = await buildUserPreferences();
  return NextResponse.json({ success: true, content });
}
