const COOKIE_NAME = 'cc_auth';

function getSecret(): string {
  return process.env.APP_SECRET ?? 'dev-secret-change-me';
}

// Simple sync hash — no crypto import needed, works in Edge + Node
function sign(value: string): string {
  const secret = getSecret();
  const input = value + ':' + secret;
  // FNV-1a inspired hash, produces a 64-char hex string
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
  // Multiple rounds for avalanche
  for (let r = 0; r < 100; r++) {
    h1 = Math.imul(h1 ^ h4, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ h1, 0x27d4eb2d) >>> 0;
    h3 = Math.imul(h3 ^ h2, 0x1b873593) >>> 0;
    h4 = Math.imul(h4 ^ h3, 0xcc9e2d51) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, '0');
  return hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h1 ^ h2) + hex(h2 ^ h3) + hex(h3 ^ h4) + hex(h4 ^ h1);
}

export function createAuthCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const signature = sign('authenticated');
  return {
    name: COOKIE_NAME,
    value: signature,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    },
  };
}

export function verifyAuthCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = sign('authenticated');
  // Constant-time comparison
  if (cookieValue.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export function checkPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD;
  if (!password) return false;
  // Constant-time comparison
  if (input.length !== password.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ password.charCodeAt(i);
  }
  return mismatch === 0;
}

const GUEST_COOKIE_NAME = 'cc_guest';

export function createGuestCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const signature = sign('guest');
  return {
    name: GUEST_COOKIE_NAME,
    value: signature,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    },
  };
}

export function verifyGuestCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = sign('guest');
  if (cookieValue.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isOwner(cookieValue: string | undefined): boolean {
  return verifyAuthCookie(cookieValue);
}

export function isGuest(cookieValue: string | undefined): boolean {
  return verifyGuestCookie(cookieValue);
}
