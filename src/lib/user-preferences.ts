import { db } from '@/lib/db';
import { getOpenAI } from '@/lib/openai';
import { log } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';

const PREFS_PATH = path.join(process.cwd(), 'userpreferences.md');

export async function buildUserPreferences(): Promise<string> {
  const client = await db();

  // Fetch all favorites with ratings
  const favs = await client.execute('SELECT f.*, r.rating, r.reasoning FROM favorites f LEFT JOIN ratings r ON r.favorite_id = f.id ORDER BY f.type, r.rating');
  const interests = await client.execute('SELECT name FROM interests ORDER BY name');
  const progress = await client.execute(`
    SELECT wp.status, f.title, f.type FROM watch_progress wp
    JOIN favorites f ON f.id = wp.favorite_id
  `);

  // Group by type and rating
  const byType: Record<string, { title: string; rating?: string; reasoning?: string }[]> = {};
  for (const row of favs.rows) {
    const r = row as unknown as { type: string; title: string; rating?: string; reasoning?: string };
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push({ title: r.title, rating: r.rating ?? undefined, reasoning: r.reasoning ?? undefined });
  }

  const interestList = (interests.rows as unknown as { name: string }[]).map(r => r.name);

  const progressItems = progress.rows as unknown as { status: string; title: string; type: string }[];
  const watching = progressItems.filter(p => p.status === 'watching').map(p => p.title);
  const completed = progressItems.filter(p => p.status === 'completed').map(p => p.title);

  // Build a summary prompt for ChatGPT to distill into a taste profile
  const summaryParts: string[] = [];

  for (const [type, items] of Object.entries(byType)) {
    const loved = items.filter(i => i.rating === 'felt_things');
    const enjoyed = items.filter(i => i.rating === 'enjoyed');
    const disliked = items.filter(i => i.rating === 'not_my_thing');

    summaryParts.push(`## ${type.toUpperCase()} (${items.length} total)`);
    if (loved.length) summaryParts.push(`Loved: ${loved.map(i => `${i.title}${i.reasoning ? ` (${i.reasoning})` : ''}`).join(', ')}`);
    if (enjoyed.length) summaryParts.push(`Enjoyed: ${enjoyed.map(i => i.title).join(', ')}`);
    if (disliked.length) summaryParts.push(`Disliked: ${disliked.map(i => `${i.title}${i.reasoning ? ` (${i.reasoning})` : ''}`).join(', ')}`);
    summaryParts.push('');
  }

  if (interestList.length) summaryParts.push(`## INTERESTS\n${interestList.join(', ')}\n`);
  if (watching.length) summaryParts.push(`## CURRENTLY WATCHING\n${watching.join(', ')}\n`);

  // Use ChatGPT to distill into a concise taste profile
  const rawData = summaryParts.join('\n');

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a taste profile analyzer. Given a user's media library with ratings and reasoning, distill it into a concise personality/taste profile. Cover:
1. **Core themes they love** — what patterns emerge from their "felt things" ratings?
2. **Humor style** — what kind of comedy resonates with them?
3. **Emotional preferences** — do they lean toward heavy, light, bittersweet?
4. **Storytelling preferences** — pacing, complexity, visual style
5. **Turn-offs** — what they actively dislike and why
6. **Interests** — their stated interests and how they connect to media taste
7. **Blind spots** — genres/styles they haven't explored much

Write in second person ("you love...", "you tend to..."). Be specific, not generic. Reference actual titles from their library as examples. Keep it under 500 words.`,
        },
        { role: 'user', content: rawData },
      ],
    });

    const profile = response.choices[0]?.message?.content ?? '';

    // Build the final markdown
    const md = `# User Preferences

> Auto-generated taste profile. Updated weekly.
> Last updated: ${new Date().toISOString().split('T')[0]}

${profile}

---

## Raw Stats
- Total items: ${favs.rows.length}
- Interests: ${interestList.join(', ') || 'none set'}
- Currently watching: ${watching.length} items
- Completed: ${completed.length} items
`;

    await fs.writeFile(PREFS_PATH, md, 'utf-8');
    log.success('User preferences updated', `${favs.rows.length} items analyzed`);
    return md;
  } catch (err) {
    log.error('Failed to build user preferences', err);
    // Fallback: write raw data without AI analysis
    const fallback = `# User Preferences\n\n> Raw data (AI analysis failed)\n> Last updated: ${new Date().toISOString().split('T')[0]}\n\n${rawData}`;
    await fs.writeFile(PREFS_PATH, fallback, 'utf-8');
    return fallback;
  }
}

export async function getUserPreferences(): Promise<string | null> {
  try {
    return await fs.readFile(PREFS_PATH, 'utf-8');
  } catch {
    return null;
  }
}
