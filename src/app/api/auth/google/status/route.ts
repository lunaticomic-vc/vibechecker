import { NextResponse } from 'next/server';
import { isYouTubeConnected, disconnectYouTube } from '@/lib/google-auth';

export async function GET() {
  return NextResponse.json({ connected: await isYouTubeConnected() });
}

export async function DELETE() {
  await disconnectYouTube();
  return NextResponse.json({ connected: false });
}
