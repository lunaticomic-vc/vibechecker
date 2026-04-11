import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthCookie } from '@/lib/auth';

const ALLOWED_HOSTNAMES = [
  'substack.com',
  'youtube.com',
  'youtu.be',
];

function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.some(allowed =>
    hostname === allowed || hostname.endsWith('.' + allowed)
  );
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only https URLs are allowed' }, { status: 400 });
    }

    if (!isAllowedHostname(parsed.hostname)) {
      return NextResponse.json({ error: 'Hostname not allowed' }, { status: 400 });
    }

    // YouTube: use oEmbed API which returns the real title without JS rendering
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/);
    if (ytMatch) {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.title) {
          return NextResponse.json({ title: data.title });
        }
      }
    }

    // Fallback: HTML scrape for non-YouTube URLs
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VibeChecker/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

    const title = (ogMatch?.[1] || titleMatch?.[1] || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Could not extract title' }, { status: 404 });
    }
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 });
  }
}
