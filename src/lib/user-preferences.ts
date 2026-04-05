import { db } from '@/lib/db';
import { getOpenAI } from '@/lib/openai';
import { log } from '@/lib/logger';

export async function buildUserPreferences(): Promise<string> {
  const client = await db();

  // Fetch all favorites with ratings and notes
  const favs = await client.execute('SELECT f.*, r.rating, r.reasoning FROM favorites f LEFT JOIN ratings r ON r.favorite_id = f.id ORDER BY f.type, r.rating LIMIT 500');

  const interests = await client.execute('SELECT name FROM interests ORDER BY name LIMIT 100');
  const progress = await client.execute(`
    SELECT wp.status, f.title, f.type FROM watch_progress wp
    JOIN favorites f ON f.id = wp.favorite_id
    LIMIT 500
  `);

  // Group by type and rating, including user notes from metadata
  const byType: Record<string, { title: string; rating?: string; reasoning?: string; notes?: string }[]> = {};
  for (const row of favs.rows) {
    const r = row as unknown as { type: string; title: string; rating?: string; reasoning?: string; metadata?: string };
    if (!byType[r.type]) byType[r.type] = [];
    // Extract notes: plain text metadata or JSON with notes field
    let notes: string | undefined;
    if (r.metadata) {
      try {
        const meta = JSON.parse(r.metadata);
        if (meta?.notes) notes = meta.notes;
      } catch {
        // Plain text = user notes
        notes = r.metadata;
      }
    }
    byType[r.type].push({ title: r.title, rating: r.rating ?? undefined, reasoning: r.reasoning ?? undefined, notes });
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
    if (loved.length) summaryParts.push(`Loved: ${loved.map(i => `${i.title}${i.reasoning ? ` (${i.reasoning})` : ''}${i.notes ? ` [notes: ${i.notes}]` : ''}`).join(', ')}`);
    if (enjoyed.length) summaryParts.push(`Enjoyed: ${enjoyed.map(i => `${i.title}${i.notes ? ` [notes: ${i.notes}]` : ''}`).join(', ')}`);
    if (disliked.length) summaryParts.push(`Disliked: ${disliked.map(i => `${i.title}${i.reasoning ? ` (${i.reasoning})` : ''}${i.notes ? ` [notes: ${i.notes}]` : ''}`).join(', ')}`);
    const withNotes = items.filter(i => i.notes && !loved.includes(i) && !enjoyed.includes(i) && !disliked.includes(i));
    if (withNotes.length) summaryParts.push(`Other notes: ${withNotes.map(i => `${i.title} [${i.notes}]`).join(', ')}`);
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
          content: `You are a taste profile analyzer. Given a user's media library with ratings, reasoning, and personal notes, distill it into an exhaustive personality/taste profile. Cover:
1. **Core themes they love** — what patterns emerge from their "felt things" ratings and notes?
2. **Humor style** — what kind of comedy resonates with them?
3. **Emotional preferences** — do they lean toward heavy, light, bittersweet?
4. **Storytelling preferences** — pacing, complexity, visual style
5. **Turn-offs** — what they actively dislike and why (from ratings AND notes)
6. **Interests & passions** — their stated interests, what they care about deeply, recurring topics
7. **Personality insights** — what their notes and choices reveal about them as a person
8. **Blind spots** — genres/styles they haven't explored much
9. **Likes & dislikes beyond media** — concepts, aesthetics, values that come through in their notes

Pay special attention to user notes — these are personal thoughts that reveal taste beyond just ratings. A note like "reminded me of my childhood" or "the cinematography was breathtaking" reveals what matters to them.

Write in second person ("you love...", "you tend to..."). Be specific, not generic. Reference actual titles and quote their notes as examples. Keep it under 800 words.`,
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

    await client.execute({
      sql: 'INSERT OR REPLACE INTO user_preferences (id, content, updated_at) VALUES (1, ?, datetime(\'now\'))',
      args: [md],
    });
    log.success('User preferences updated', `${favs.rows.length} items analyzed`);
    return md;
  } catch (err) {
    log.error('Failed to build user preferences', err);
    // Fallback: write raw data without AI analysis
    const fallback = `# User Preferences\n\n> Raw data (AI analysis failed)\n> Last updated: ${new Date().toISOString().split('T')[0]}\n\n${rawData}`;
    await client.execute({
      sql: 'INSERT OR REPLACE INTO user_preferences (id, content, updated_at) VALUES (1, ?, datetime(\'now\'))',
      args: [fallback],
    });
    return fallback;
  }
}

export async function getUserPreferences(): Promise<string | null> {
  try {
    const client = await db();
    const result = await client.execute('SELECT content FROM user_preferences WHERE id = 1');
    const row = result.rows[0] as unknown as { content: string } | undefined;
    return row?.content ?? null;
  } catch {
    return null;
  }
}
