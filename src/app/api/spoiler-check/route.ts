import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { consumeRateLimit } from '@/lib/rate-limit';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  // Rate limit guests — this endpoint hits the paid OpenAI API
  const isOwner = verifyAuthCookie(req.cookies.get('cc_auth')?.value);
  if (!isOwner) {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { allowed } = await consumeRateLimit(ip);
    if (!allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  try {
    let parsed;
    try { parsed = await req.json(); } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { comments } = parsed;
    if (!Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({ results: [] });
    }

    if (comments.length > 100) {
      return NextResponse.json({ error: 'Too many comments (max 100)' }, { status: 400 });
    }

    const truncated = comments.map((c: string) =>
      typeof c === 'string' && c.length > 500 ? c.slice(0, 500) : c
    );

    const numbered = truncated.map((c: string, i: number) => `${i + 1}. "${c}"`).join('\n');

    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a spoiler detector. For each comment, determine if it contains plot spoilers — reveals about character deaths, plot twists, endings, major surprises, or specific story developments that would ruin the experience for someone who hasn't seen it yet.
General praise, mood descriptions, genre vibes, or vague recommendations are NOT spoilers.
Respond with ONLY a JSON object: {"results": [false, true, false, ...]} — one boolean per comment in order.`,
        },
        {
          role: 'user',
          content: `Check these comments for spoilers:\n${numbered}`,
        },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? '{}';
    let results: boolean[];
    try {
      const obj = JSON.parse(raw);
      if (Array.isArray(obj)) results = obj;
      else if (Array.isArray(obj.results)) results = obj.results;
      else results = comments.map(() => false);
    } catch {
      results = comments.map(() => false);
    }
    if (results.length !== comments.length) {
      // Normalize to expected length
      results = comments.map((_, i) => Boolean(results[i]));
    }

    return NextResponse.json({ results });
  } catch (err) {
    log.error('Spoiler check failed', err);
    return NextResponse.json({ results: [] });
  }
}
