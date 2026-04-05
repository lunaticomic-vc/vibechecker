import { NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-auth';

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const authUrl = getGoogleAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, {
    maxAge: 300,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
