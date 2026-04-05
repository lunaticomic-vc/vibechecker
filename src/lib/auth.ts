import crypto from 'crypto';

const COOKIE_NAME = 'cc_auth';

const secret = process.env.APP_SECRET ?? 'dev-secret-change-me';

if (process.env.NODE_ENV === 'production' && secret === 'dev-secret-change-me') {
  console.warn('WARNING: Using default APP_SECRET in production! Set APP_SECRET env var.');
}

function sign(value: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function createAuthCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const value = 'authenticated';
  const signature = sign(value);
  return {
    name: COOKIE_NAME,
    value: `${value}.${signature}`,
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
  const [value, sig] = cookieValue.split('.');
  if (!value || !sig) return false;
  const expected = sign(value);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function checkPassword(input: string, password?: string): boolean {
  const pwd = password ?? process.env.APP_PASSWORD;
  if (!pwd) return false;
  const inputBuf = Buffer.from(input);
  const passBuf = Buffer.from(pwd);
  if (inputBuf.length !== passBuf.length) {
    // Still compare to avoid timing leak, but return false
    crypto.timingSafeEqual(Buffer.alloc(passBuf.length), passBuf);
    return false;
  }
  return crypto.timingSafeEqual(inputBuf, passBuf);
}

const GUEST_COOKIE_NAME = 'cc_guest';

export function createGuestCookie(): { name: string; value: string; options: Record<string, unknown> } {
  const value = 'guest';
  const signature = sign(value);
  return {
    name: GUEST_COOKIE_NAME,
    value: `${value}.${signature}`,
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
  const [value, sig] = cookieValue.split('.');
  if (!value || !sig) return false;
  const expected = sign(value);
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function isOwner(cookieValue: string | undefined): boolean {
  return verifyAuthCookie(cookieValue);
}

export function isGuest(cookieValue: string | undefined): boolean {
  return verifyGuestCookie(cookieValue);
}
