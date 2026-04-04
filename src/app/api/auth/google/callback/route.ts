import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, saveTokens } from '@/lib/google-auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/favorites?yt_error=denied', url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/favorites?yt_error=no_code', url.origin));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    saveTokens(tokens);
    return NextResponse.redirect(new URL('/favorites?yt_connected=1', url.origin));
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/favorites?yt_error=token_failed', url.origin));
  }
}
