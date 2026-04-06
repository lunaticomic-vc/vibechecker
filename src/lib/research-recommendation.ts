import { getOpenAI } from '@/lib/openai';
import type { Recommendation, ResearchLink, KnowledgeChecklistItem } from '@/types/index';

const VALID_SOURCE_TYPES = ['academic', 'video', 'article', 'community', 'book'] as const;
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export async function getResearchRecommendation(vibe: string): Promise<Recommendation> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `You are a research guide generator. Given a topic or interest, produce a comprehensive starter kit.

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "topic": "Clean topic title (e.g. 'Behavioral Economics')",
  "summary": "2-3 sentence overview of this research area and why it matters",
  "links": [
    {
      "title": "Resource title",
      "url": "https://...",
      "sourceType": "academic|video|article|community|book",
      "description": "One sentence: what this covers and why it's a good starting point"
    }
  ],
  "concepts": [
    {
      "concept": "Concept name",
      "explanation": "One-line explanation of why this concept matters for understanding the topic",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}

Rules:
- Generate 5-8 links. Include at least 1 of each: academic (Wikipedia, Khan Academy, Coursera, university page), video (YouTube educational, TED talk), article (blog post, newsletter, essay), community (Reddit thread, Stack Exchange, forum). Books optional.
- Use REAL, working URLs. Prefer well-known sources.
- Generate 8-12 key concepts ordered roughly beginner → advanced.
- Concepts are things a person must understand to "know what they're talking about" on this topic.`,
      },
      {
        role: 'user',
        content: `Research interest: "${vibe}"`,
      },
    ],
  });

  let parsed: {
    topic?: string;
    summary?: string;
    links?: Array<{ title?: string; url?: string; sourceType?: string; description?: string }>;
    concepts?: Array<{ concept?: string; explanation?: string; difficulty?: string }>;
  };

  try {
    parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}');
  } catch {
    throw new Error('Failed to parse research recommendation response');
  }

  const researchLinks: ResearchLink[] = (parsed.links ?? [])
    .filter(l => l.title && l.url)
    .map(l => ({
      title: l.title!,
      url: l.url!,
      sourceType: (VALID_SOURCE_TYPES.includes(l.sourceType as ResearchLink['sourceType'])
        ? l.sourceType
        : 'article') as ResearchLink['sourceType'],
      description: l.description ?? '',
    }));

  const knowledgeChecklist: KnowledgeChecklistItem[] = (parsed.concepts ?? [])
    .filter(c => c.concept)
    .map(c => ({
      concept: c.concept!,
      explanation: c.explanation ?? '',
      difficulty: (VALID_DIFFICULTIES.includes(c.difficulty as KnowledgeChecklistItem['difficulty'])
        ? c.difficulty
        : 'beginner') as KnowledgeChecklistItem['difficulty'],
    }));

  const topic = parsed.topic ?? vibe;

  return {
    title: topic,
    type: 'research',
    description: parsed.summary ?? '',
    reasoning: `A curated research guide covering key concepts and resources for "${topic}".`,
    actionUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(topic)}`,
    actionLabel: 'Search Wikipedia',
    researchLinks,
    knowledgeChecklist,
  };
}
