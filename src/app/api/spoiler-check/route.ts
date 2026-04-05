import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';

export async function POST(req: NextRequest) {
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
      messages: [
        {
          role: 'system',
          content: `You are a spoiler detector. For each comment, determine if it contains plot spoilers — reveals about character deaths, plot twists, endings, major surprises, or specific story developments that would ruin the experience for someone who hasn't seen it yet.
General praise, mood descriptions, genre vibes, or vague recommendations are NOT spoilers.
Respond with ONLY a JSON array of booleans, one per comment. Example: [false, true, false]`,
        },
        {
          role: 'user',
          content: `Check these comments for spoilers:\n${numbered}`,
        },
      ],
    });

    const raw = res.choices[0]?.message?.content ?? '[]';
    let results: boolean[];
    try {
      results = JSON.parse(raw);
    } catch {
      results = comments.map(() => false);
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Spoiler check failed:', err);
    return NextResponse.json({ results: [] });
  }
}
