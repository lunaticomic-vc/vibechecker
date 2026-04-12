import { getOpenAI } from '@/lib/openai';
import type { Recommendation } from '@/types/index';

/**
 * Context passed to reading-type recommenders so they can learn from the user's taste.
 * Previously reading types were completely blind to ratings/library — now the same
 * personalization that powers screen recommendations flows here too.
 */
export interface ReadingContext {
  tasteProfile?: string | null;
  lovedItems?: { title: string; reasoning?: string }[];
  enjoyedItems?: string[];
  dislikedItems?: { title: string; reasoning?: string }[];
  exclusionList?: string[];
  interests?: string[];
}

function buildContextBlock(label: string, ctx?: ReadingContext): string {
  if (!ctx) return '';
  const parts: string[] = [];

  if (ctx.lovedItems?.length) {
    const lovedLines = ctx.lovedItems
      .slice(0, 15)
      .map(i => `  "${i.title}"${i.reasoning ? ` — ${i.reasoning}` : ''}`)
      .join('\n');
    parts.push(`${label} the user LOVED (match the emotional register of these):\n${lovedLines}`);
  }

  if (ctx.enjoyedItems?.length) {
    parts.push(`${label} the user enjoyed (lighter positive signal):\n${ctx.enjoyedItems.slice(0, 20).map(t => `  "${t}"`).join('\n')}`);
  }

  if (ctx.dislikedItems?.length) {
    const dislikedLines = ctx.dislikedItems
      .slice(0, 10)
      .map(i => `  "${i.title}"${i.reasoning ? ` — ${i.reasoning}` : ''}`)
      .join('\n');
    parts.push(`${label} the user DISLIKED (avoid similar style/themes):\n${dislikedLines}`);
  }

  if (ctx.exclusionList?.length) {
    parts.push(`Do NOT recommend any of these (already in their library):\n${ctx.exclusionList.slice(0, 80).map(t => `  - ${t}`).join('\n')}`);
  }

  if (ctx.tasteProfile) {
    parts.push(`User taste profile (use for tone matching):\n${ctx.tasteProfile.slice(0, 800)}`);
  }

  if (ctx.interests?.length) {
    parts.push(`User interests (for tie-breaking only, do NOT force-fit): ${ctx.interests.join(', ')}`);
  }

  return parts.join('\n\n');
}

async function callGPT(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ title: string; author: string; description: string; reasoning: string }> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    temperature: 0.7,
    response_format: { type: 'json_object' },
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

export async function getPoetryRecommendation(vibe: string, ctx?: ReadingContext): Promise<Recommendation> {
  const contextBlock = buildContextBlock('Poems', ctx);
  const parsed = await callGPT(
    `You are a poetry expert with deep knowledge of the user's taste. Given a mood and the user's reading history, recommend a specific real poem.

Return ONLY a valid JSON object:
{
  "title": "Poem title",
  "author": "Poet's full name",
  "description": "2-3 sentences about this poem — its imagery, tone, and what makes it memorable",
  "reasoning": "Why this poem fits the given vibe AND the user's taste — reference specific poems or reasons from their history if applicable"
}

Rules:
- Recommend a real, well-known poem that actually exists
- Be specific (e.g. "The Love Song of J. Alfred Prufrock" by T.S. Eliot)
- Prefer accessible-but-non-obvious poets over Rumi/Neruda every time
${contextBlock ? '\n' + contextBlock : ''}`,
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

export async function getShortStoryRecommendation(vibe: string, ctx?: ReadingContext): Promise<Recommendation> {
  const contextBlock = buildContextBlock('Short stories', ctx);
  const parsed = await callGPT(
    `You are a short fiction expert with deep knowledge of the user's taste. Given a mood and the user's reading history, recommend a specific real short story.

Return ONLY a valid JSON object:
{
  "title": "Story title",
  "author": "Author's full name",
  "description": "2-3 sentences about this story — its plot, atmosphere, and what lingers after reading",
  "reasoning": "Why this story fits the given vibe AND the user's taste — reference specific prior picks or reasons if applicable"
}

Rules:
- Recommend a real short story that actually exists
- Be specific about title and author
${contextBlock ? '\n' + contextBlock : ''}`,
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

export async function getBookRecommendation(vibe: string, ctx?: ReadingContext): Promise<Recommendation> {
  const contextBlock = buildContextBlock('Books', ctx);
  const parsed = await callGPT(
    `You are a literary guide with deep knowledge of the user's taste. Given a mood and the user's reading history, recommend a specific real book.

Return ONLY a valid JSON object:
{
  "title": "Book title",
  "author": "Author's full name",
  "description": "2-3 sentences about this book — its themes, writing style, and emotional texture",
  "reasoning": "Why this book fits the given vibe AND the user's taste — reference specific books or reasons from their history if applicable"
}

Rules:
- Recommend a real book that actually exists
- MUST match the vibe first — taste signals help you pick the BEST match within the topic
- Can be fiction or non-fiction, any genre
${contextBlock ? '\n' + contextBlock : ''}`,
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

export async function getEssayRecommendation(vibe: string, ctx?: ReadingContext): Promise<Recommendation> {
  const contextBlock = buildContextBlock('Essays', ctx);
  const parsed = await callGPT(
    `You are a longform essay curator with deep knowledge of the user's taste. Given a mood and the user's reading history, recommend a specific real essay.

Return ONLY a valid JSON object:
{
  "title": "Essay title",
  "author": "Author's full name",
  "description": "2-3 sentences about this essay — its central argument, style, and what makes it worth reading",
  "reasoning": "Why this essay fits the given vibe AND the user's taste"
}

Rules:
- Recommend a real essay that actually exists (published in a magazine, journal, newspaper, or online)
- Examples of good sources: The Atlantic, New Yorker, n+1, Aeon, Lapham's Quarterly, Harper's, personal sites
- Be specific about title and author
${contextBlock ? '\n' + contextBlock : ''}`,
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

export async function getPodcastRecommendation(vibe: string, ctx?: ReadingContext): Promise<Recommendation> {
  const contextBlock = buildContextBlock('Podcasts', ctx);
  const parsed = await callGPT(
    `You are a podcast curator with deep knowledge of the user's taste. Given a mood and the user's history, recommend a specific real podcast episode.

Return ONLY a valid JSON object:
{
  "title": "Episode title",
  "author": "Podcast name",
  "description": "2-3 sentences about this episode — what it covers, who's involved, and what makes it compelling",
  "reasoning": "Why this episode fits the given vibe AND the user's taste"
}

Rules:
- Recommend a real podcast episode that actually exists
- Be specific: include the exact episode title and podcast name
- Can be from any genre: interview, narrative, educational, storytelling
${contextBlock ? '\n' + contextBlock : ''}`,
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
