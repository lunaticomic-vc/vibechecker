import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const isOwner = verifyAuthCookie(req.cookies.get('cc_auth')?.value);
  if (isOwner) {
    return NextResponse.json({ role: 'owner', remaining: Infinity });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { remaining } = await checkRateLimit(ip);
  return NextResponse.json({ role: 'guest', remaining });
}
