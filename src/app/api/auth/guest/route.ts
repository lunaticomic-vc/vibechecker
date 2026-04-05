import { NextResponse } from 'next/server';
import { createGuestCookie } from '@/lib/auth';

export async function POST() {
  const cookie = createGuestCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);
  return response;
}
