import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, saveTokens } from '@/lib/google-auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  if (error) {
    return NextResponse.redirect(new URL('/favorites?yt_error=denied', url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/favorites?yt_error=no_code', url.origin));
  }

  // Validate OAuth state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL('/favorites?yt_error=invalid_state', url.origin));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveTokens(tokens);
    const response = NextResponse.redirect(new URL('/favorites?yt_connected=1', url.origin));
    response.cookies.delete('oauth_state');
    return response;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/favorites?yt_error=token_failed', url.origin));
  }
}
