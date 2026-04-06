import { getOpenAI } from '@/lib/openai';
import type { Recommendation } from '@/types/index';

async function callGPT(systemPrompt: string, userPrompt: string): Promise<{ title: string; author: string; description: string; reasoning: string }> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content ?? '{}');
  } catch {
    throw new Error('Failed to parse reading recommendation response');
  }
}

export async function getPoetryRecommendation(vibe: string): Promise<Recommendation> {
  const parsed = await callGPT(
    `You are a poetry expert. Given a mood or vibe, recommend a specific real poem by a real poet that fits it.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "title": "Poem title",
  "author": "Poet's full name",
  "description": "2-3 sentences about this poem — its imagery, tone, and what makes it memorable",
  "reasoning": "Why this poem fits the given vibe"
}

Rules:
- Recommend a real, well-known poem that actually exists
- Be specific (e.g. "The Love Song of J. Alfred Prufrock" by T.S. Eliot)`,
    `Vibe: "${vibe}"`
  );

  const fullTitle = `${parsed.title} by ${parsed.author}`;
  return {
    title: fullTitle,
    type: 'poetry',
    description: parsed.description ?? '',
    reasoning: parsed.reasoning ?? '',
    actionUrl: `https://www.poetryfoundation.org/search#query=${encodeURIComponent(parsed.title + ' ' + parsed.author)}`,
    actionLabel: 'Read Poem',
  };
}

export async function getShortStoryRecommendation(vibe: string): Promise<Recommendation> {
  const parsed = await callGPT(
    `You are a short fiction expert. Given a mood or vibe, recommend a specific real short story that fits it.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "title": "Story title",
  "author": "Author's full name",
  "description": "2-3 sentences about this story — its plot, atmosphere, and what lingers after reading",
  "reasoning": "Why this story fits the given vibe"
}

Rules:
- Recommend a real short story that actually exists
- Be specific about title and author`,
    `Vibe: "${vibe}"`
  );

  const fullTitle = `${parsed.title} by ${parsed.author}`;
  return {
    title: fullTitle,
    type: 'short_story',
    description: parsed.description ?? '',
    reasoning: parsed.reasoning ?? '',
    actionUrl: `https://www.google.com/search?q=${encodeURIComponent(parsed.title + ' by ' + parsed.author + ' short story read online')}`,
    actionLabel: 'Find Story',
  };
}

export async function getBookRecommendation(vibe: string): Promise<Recommendation> {
  const parsed = await callGPT(
    `You are a literary guide. Given a mood or vibe, recommend a specific real book that fits it.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "title": "Book title",
  "author": "Author's full name",
  "description": "2-3 sentences about this book — its themes, writing style, and emotional texture",
  "reasoning": "Why this book fits the given vibe"
}

Rules:
- Recommend a real book that actually exists
- Can be fiction or non-fiction, any genre`,
    `Vibe: "${vibe}"`
  );

  const fullTitle = `${parsed.title} by ${parsed.author}`;
  return {
    title: fullTitle,
    type: 'book',
    description: parsed.description ?? '',
    reasoning: parsed.reasoning ?? '',
    actionUrl: `https://www.goodreads.com/search?q=${encodeURIComponent(fullTitle)}`,
    actionLabel: 'View on Goodreads',
  };
}

export async function getEssayRecommendation(vibe: string): Promise<Recommendation> {
  const parsed = await callGPT(
    `You are a longform essay curator. Given a mood or vibe, recommend a specific real essay or longform piece that fits it.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "title": "Essay title",
  "author": "Author's full name",
  "description": "2-3 sentences about this essay — its central argument, style, and what makes it worth reading",
  "reasoning": "Why this essay fits the given vibe"
}

Rules:
- Recommend a real essay that actually exists (published in a magazine, journal, newspaper, or online)
- Examples of good sources: The Atlantic, New Yorker, n+1, Aeon, Lapham's Quarterly, Harper's, personal sites
- Be specific about title and author`,
    `Vibe: "${vibe}"`
  );

  const fullTitle = `${parsed.title} by ${parsed.author}`;
  return {
    title: fullTitle,
    type: 'essay',
    description: parsed.description ?? '',
    reasoning: parsed.reasoning ?? '',
    actionUrl: `https://www.google.com/search?q=${encodeURIComponent(parsed.title + ' ' + parsed.author + ' essay')}`,
    actionLabel: 'Read Essay',
  };
}

export async function getPodcastRecommendation(vibe: string): Promise<Recommendation> {
  const parsed = await callGPT(
    `You are a podcast curator. Given a mood or vibe, recommend a specific real podcast episode that fits it.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "title": "Episode title",
  "author": "Podcast name",
  "description": "2-3 sentences about this episode — what it covers, who's involved, and what makes it compelling",
  "reasoning": "Why this episode fits the given vibe"
}

Rules:
- Recommend a real podcast episode that actually exists
- Be specific: include the exact episode title and podcast name
- Can be from any genre: interview, narrative, educational, storytelling`,
    `Vibe: "${vibe}"`
  );

  return {
    title: `${parsed.title} — ${parsed.author}`,
    type: 'podcast',
    description: parsed.description ?? '',
    reasoning: parsed.reasoning ?? '',
    actionUrl: `https://www.google.com/search?q=${encodeURIComponent(parsed.title + ' ' + parsed.author + ' podcast episode')}`,
    actionLabel: 'Listen',
  };
}
