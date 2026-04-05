import { db } from '@/lib/db';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  : 'http://localhost:3000/api/auth/google/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is required for YouTube features. Set it in your environment.`);
  return val;
}

export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });
  if (state) {
    params.set('state', state);
  }
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description || 'Token exchange failed');
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh token');

  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  const client = await db();
  await client.execute({
    sql: 'UPDATE oauth_tokens SET access_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE platform = ?',
    args: [data.access_token, expiresAt, 'youtube'],
  });

  return data.access_token;
}

export async function saveTokens(data: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}) {
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const client = await db();

  await client.execute({
    sql: `INSERT INTO oauth_tokens (platform, access_token, refresh_token, expires_at, scope, updated_at)
          VALUES ('youtube', ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(platform) DO UPDATE SET
            access_token = excluded.access_token,
            refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
            expires_at = excluded.expires_at,
            scope = excluded.scope,
            updated_at = CURRENT_TIMESTAMP`,
    args: [data.access_token, data.refresh_token ?? null, expiresAt, data.scope],
  });
}

export async function getStoredToken(): Promise<{ access_token: string; refresh_token: string | null; expires_at: string } | null> {
  const client = await db();
  const result = await client.execute({ sql: 'SELECT access_token, refresh_token, expires_at FROM oauth_tokens WHERE platform = ?', args: ['youtube'] });
  return (result.rows[0] as unknown as { access_token: string; refresh_token: string | null; expires_at: string }) ?? null;
}

export async function getValidAccessToken(): Promise<string> {
  const stored = await getStoredToken();
  if (!stored) throw new Error('YouTube not connected. Please connect your account first.');

  const isExpired = new Date(stored.expires_at) <= new Date();
  if (!isExpired) return stored.access_token;

  if (!stored.refresh_token) throw new Error('Token expired and no refresh token. Please reconnect.');
  return refreshAccessToken(stored.refresh_token);
}

export async function isYouTubeConnected(): Promise<boolean> {
  return (await getStoredToken()) !== null;
}

export async function disconnectYouTube(): Promise<void> {
  const client = await db();
  await client.execute({ sql: 'DELETE FROM oauth_tokens WHERE platform = ?', args: ['youtube'] });
}
