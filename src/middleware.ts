import { NextRequest, NextResponse } from 'next/server';

async function sign(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verify(value: string, expectedSig: string, secret: string): Promise<boolean> {
  const actualSig = await sign(value, secret);
  return timingSafeEqual(actualSig, expectedSig);
}

// API routes that modify data — only owner can use these
const WRITE_APIS = [
  '/api/favorites',
  '/api/progress',
  '/api/ratings',
  '/api/interests',
  '/api/people',
  '/api/rejected',
  '/api/imports/',
  '/api/accounts/',
  '/api/preferences',
  '/api/cron/',
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const method = req.method;

  // If no APP_PASSWORD is set, skip auth entirely (local dev convenience)
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const secret = process.env.APP_SECRET ?? 'dev-secret-change-me';

  // Verify owner cookie
  let owner = false;
  const authCookie = req.cookies.get('cc_auth')?.value;
  if (authCookie) {
    const [value, sig] = authCookie.split('.');
    if (value && sig) {
      owner = await verify(value, sig, secret);
    }
  }

  // Verify guest cookie
  let hasGuestCookie = false;
  const guestCookie = req.cookies.get('cc_guest')?.value;
  if (guestCookie) {
    const [value, sig] = guestCookie.split('.');
    if (value && sig) {
      hasGuestCookie = await verify(value, sig, secret);
    }
  }

  const isAuthed = owner || hasGuestCookie;

  // Skip auth for login page, auth APIs, and static assets
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

  // First visit — redirect to login flow
  if (!isAuthed) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Guests can browse but not modify data
  if (!owner && method !== 'GET') {
    const isWriteApi = WRITE_APIS.some(api => path.startsWith(api));
    if (isWriteApi) {
      return NextResponse.json({ error: 'Sign in to modify data' }, { status: 403 });
    }
  }

  // Recommend route: rate limiting handled inside the route itself
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
