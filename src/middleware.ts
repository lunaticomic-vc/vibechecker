import { NextRequest, NextResponse } from 'next/server';

// Inline sign function — must match src/lib/auth.ts exactly
function sign(value: string, secret: string): string {
  const input = value + ':' + secret;
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x01000193 >>> 0;
  let h3 = 0xdeadbeef >>> 0;
  let h4 = 0xcafebabe >>> 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x27d4eb2d) >>> 0;
    h3 = Math.imul(h3 ^ c, 0x1b873593) >>> 0;
    h4 = Math.imul(h4 ^ c, 0xcc9e2d51) >>> 0;
  }
  for (let r = 0; r < 100; r++) {
    h1 = Math.imul(h1 ^ h4, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ h1, 0x27d4eb2d) >>> 0;
    h3 = Math.imul(h3 ^ h2, 0x1b873593) >>> 0;
    h4 = Math.imul(h4 ^ h3, 0xcc9e2d51) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h1 ^ h2) + hex(h2 ^ h3) + hex(h3 ^ h4) + hex(h4 ^ h1);
}

function isOwnerCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = process.env.APP_SECRET ?? 'dev-secret-change-me';
  const expected = sign('authenticated', secret);
  if (cookieValue.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
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

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const method = req.method;

  // If no APP_PASSWORD is set, skip auth entirely (local dev convenience)
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const owner = isOwnerCookie(req.cookies.get('cc_auth')?.value);

  // Everyone can view all pages and read data (GET requests)
  // Only block write operations (POST/PUT/PATCH/DELETE) for non-owners
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
