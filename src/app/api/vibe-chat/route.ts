import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { verifyAuthCookie } from '@/lib/auth';
import { log } from '@/lib/logger';
import { getUserPreferences } from '@/lib/user-preferences';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('cc_auth')?.value;
  if (!verifyAuthCookie(cookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { messages, contentType } = body as { messages: ChatMessage[]; contentType: string };

  if (!messages?.length || !contentType) {
    return NextResponse.json({ error: 'messages and contentType required' }, { status: 400 });
  }

  log.api('POST', '/api/vibe-chat', `${messages.length} messages, type=${contentType}`);

  const tasteProfile = await getUserPreferences();
  const questionCount = messages.filter(m => m.role === 'assistant').length;

  try {
    const openai = getOpenAI();
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content: `You are a friend helping someone find something to ${contentType === 'movie' ? 'watch' : contentType === 'book' ? 'read' : contentType === 'game' ? 'play' : 'enjoy'}. You text casually, warmly, like a real friend — lowercase, no periods at end of sentences, natural tone. Never sound like an AI or a customer service bot.

Your job: figure out exactly what vibe they're looking for so you can recommend the perfect ${contentType}. You can ask up to 3 short clarifying questions (one at a time) to nail down their mood, but ONLY if the vibe is unclear. If they give you enough to work with, skip the questions and say you're ready.

${tasteProfile ? `You know this person well. Their taste:\n${tasteProfile.slice(0, 800)}` : ''}

RULES:
- Keep messages SHORT (1-2 sentences max), like actual texts
- Be warm but not fake. Sound like a real friend, not a chatbot
- Ask about mood/energy/what they're in the mood for, NOT about specific genres or ratings
- If the user's first message is already specific enough (mentions a mood, scenario, or clear desire), you can skip questions entirely
- Activity words like "eating", "having lunch", "commuting" = their current situation, NOT a topic request
- NEVER ask more than 3 questions total
- Questions asked so far: ${questionCount}
- Max questions remaining: ${Math.max(0, 3 - questionCount)}

RESPONSE FORMAT — return ONLY a JSON object, no markdown:
- If you want to ask a clarifying question: {"type": "question", "message": "your question here"}
- If you have enough info (or hit 3 questions): {"type": "ready", "vibe": "a rich summary for the recommendation engine"}

CRITICAL for the "ready" vibe: You MUST preserve EVERY specific constraint the user mentioned — duration ("20 mins", "short", "quick"), format, mood, situation, energy level. The vibe is passed directly to the recommendation engine which has NO access to this conversation. If they said "20 mins", the vibe MUST say "around 20 minutes". If they said "something to watch while eating", include that context. The content type is: ${contentType} — the vibe must make sense for this type specifically. Do NOT recommend or mention titles from other content types.

${questionCount >= 3 ? 'You have asked 3 questions already. You MUST respond with type "ready" now.' : ''}`,
        },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
    });

    const raw = res.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw) as { type: 'question' | 'ready'; message?: string; vibe?: string };

    return NextResponse.json(parsed);
  } catch (err) {
    log.error('Vibe chat error', err);
    // Fallback: treat the last user message as the vibe
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    return NextResponse.json({ type: 'ready', vibe: lastUserMsg });
  }
}
