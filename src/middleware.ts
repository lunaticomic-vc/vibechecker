import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthCookie, verifyGuestCookie } from '@/lib/auth';

export function middleware(req: NextRequest) {
  // Skip auth for login page, auth APIs, and static assets
  const path = req.nextUrl.pathname;
  if (
    path === '/login' ||
    path.startsWith('/api/auth/') ||
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.endsWith('.ico') ||
    path.endsWith('.svg') ||
    path.endsWith('.png')
  ) {
    return NextResponse.next();
  }

  // If no APP_PASSWORD is set, skip auth entirely (local dev convenience)
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  // Owner gets full access
  const authCookie = req.cookies.get('cc_auth')?.value;
  if (verifyAuthCookie(authCookie)) {
    return NextResponse.next();
  }

  // Guest gets limited access (rate limiting handled in API routes)
  const guestCookie = req.cookies.get('cc_guest')?.value;
  if (verifyGuestCookie(guestCookie)) {
    return NextResponse.next();
  }

  // Redirect pages to login, return 401 for API calls
  if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
