import { createHmac } from 'crypto';

const COOKIE_NAME = 'cc_auth';

function getSecret(): string {
  return process.env.APP_SECRET ?? 'dev-secret-change-me';
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
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
