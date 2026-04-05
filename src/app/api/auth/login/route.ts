import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!checkPassword(password ?? '')) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }

    const cookie = createAuthCookie();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
