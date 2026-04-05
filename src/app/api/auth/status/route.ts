import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // No password set = local dev, treat as owner
  if (!process.env.APP_PASSWORD) {
    return NextResponse.json({ role: 'owner', remaining: Infinity });
  }

  const isOwner = verifyAuthCookie(req.cookies.get('cc_auth')?.value);
  if (isOwner) {
    return NextResponse.json({ role: 'owner', remaining: Infinity });
  }

  // Check for guest cookie
  const { verifyGuestCookie } = await import('@/lib/auth');
  const isGuest = verifyGuestCookie(req.cookies.get('cc_guest')?.value);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { remaining } = await checkRateLimit(ip);

  if (isGuest) {
    return NextResponse.json({ role: 'guest', remaining });
  }

  return NextResponse.json({ role: 'anonymous', remaining });
}
