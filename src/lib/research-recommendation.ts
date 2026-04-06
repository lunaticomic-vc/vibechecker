import { getOpenAI } from '@/lib/openai';
import { log } from '@/lib/logger';
import type { Recommendation, ResearchLink, KnowledgeChecklistItem } from '@/types/index';

const VALID_SOURCE_TYPES = ['academic', 'video', 'article', 'community', 'book'] as const;
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

/** Use Brave Search to find a real URL for a given resource description. */
async function findRealUrl(query: string, sourceType: string): Promise<{ url: string; title: string } | null> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return null;

  const siteHints: Record<string, string> = {
    video: 'site:youtube.com OR site:ted.com',
    community: 'site:reddit.com OR site:stackexchange.com',
    academic: 'site:arxiv.org OR site:scholar.google.com OR site:coursera.org OR site:khanacademy.org',
  };
  const siteFilter = siteHints[sourceType] ?? '';
  const searchQuery = `${query} ${siteFilter}`.trim();

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=3`,
      {
        headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const top = (data?.web?.results ?? [])[0];
    if (!top?.url) return null;
    return { url: top.url as string, title: (top.title as string) ?? query };
  } catch {
    return null;
  }
}

/** Validate a batch of links via Brave, replacing hallucinated ones with real results. */
async function validateAndFixLinks(links: ResearchLink[]): Promise<ResearchLink[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return links;

  const results = await Promise.all(
    links.map(async (link) => {
      // Search for a real version of this resource
      const searchQuery = `${link.title} ${link.description}`;
      const found = await findRealUrl(searchQuery, link.sourceType);
      if (found) {
        return { ...link, url: found.url, title: found.title.length > link.title.length ? link.title : found.title };
      }
      // If Brave can't find anything, drop the link
      log.warn('Dropping unverifiable research link', link.title);
      return null;
    })
  );

  return results.filter((r): r is ResearchLink => r !== null);
}

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
- Generate 5-8 links across these categories:
  - video: YouTube explainers, video essays, TED talks, conference talks — this should be the MOST represented category (2-3 links)
  - article: blog posts, newsletters, long-form essays, journalism, Substack pieces
  - academic: research papers (arXiv, Google Scholar), university course pages, Khan Academy, Coursera
  - community: Reddit threads, Stack Exchange, niche forums, Discord servers
  - book: specific book titles with Goodreads or publisher links
- NEVER suggest Wikipedia, basic encyclopedias, or generic reference pages. Users want depth, not surface-level overviews.
- Prefer specific, high-quality content: a 30-minute YouTube deep dive > a Wikipedia article. A detailed Reddit AMA > a dictionary definition.
- Use REAL, working URLs. Prefer well-known sources and specific content (specific video, specific article, specific thread).
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

  const rawLinks: ResearchLink[] = (parsed.links ?? [])
    .filter(l => l.title && l.url)
    .map(l => ({
      title: l.title!,
      url: l.url!,
      sourceType: (VALID_SOURCE_TYPES.includes(l.sourceType as ResearchLink['sourceType'])
        ? l.sourceType
        : 'article') as ResearchLink['sourceType'],
      description: l.description ?? '',
    }));

  // Validate all links via Brave Search — replace hallucinated URLs with real ones
  const researchLinks = await validateAndFixLinks(rawLinks);

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
    actionUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`,
    actionLabel: 'Search YouTube',
    researchLinks,
    knowledgeChecklist,
  };
}
