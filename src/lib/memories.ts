/**
 * Memories: a narrative record of what the user rejected and why. Used to inform the
 * taste profile so the recommender learns from explicit dislikes as well as ratings.
 *
 * Source of truth = the `rejected_recommendations` DB table (title, type, reason, created_at).
 * Local dev also gets a convenience mirror at ./memories.md at the repo root for browsing —
 * writes are best-effort and silently fail in serverless environments.
 */

import { db } from '@/lib/db';
import { log } from '@/lib/logger';

export interface Memory {
  title: string;
  type: string;
  reason: string;
  created_at: string;
}

/** Fetch all rejections with a reason, most-recent first. */
export async function getMemories(limit = 200): Promise<Memory[]> {
  try {
    const client = await db();
    const result = await client.execute({
      sql: `SELECT title, type, reason, created_at FROM rejected_recommendations
            WHERE reason IS NOT NULL AND reason != ''
            ORDER BY created_at DESC LIMIT ?`,
      args: [limit],
    });
    return result.rows as unknown as Memory[];
  } catch (err) {
    log.warn('Failed to load memories', String(err));
    return [];
  }
}

const REASON_LABELS: Record<string, string> = {
  wrong_vibe: 'wrong vibe',
  too_mainstream: 'too mainstream',
  not_interested: 'not interested',
  already_seen: 'already seen',
};

/** Format memories as a markdown digest — used both for the disk file and for the taste profile prompt. */
export function formatMemoriesAsMarkdown(memories: Memory[]): string {
  if (memories.length === 0) {
    return '# Memories\n\n_No rejections yet. As you reject recommendations with reasons, they\'ll appear here._\n';
  }
  const lines: string[] = ['# Memories', ''];
  lines.push('> Rejections the user explicitly pushed back on, with reasons. The recommender reads this to learn what NOT to suggest.');
  lines.push('');

  // Group by type
  const byType: Record<string, Memory[]> = {};
  for (const m of memories) {
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m);
  }

  for (const [type, items] of Object.entries(byType)) {
    lines.push(`## ${type}`);
    for (const m of items) {
      const reasonLabel = REASON_LABELS[m.reason] ?? m.reason;
      lines.push(`- **${m.title}** — _${reasonLabel}_`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Write the full memories digest to memories.md at the repo root.
 * Best-effort: swallows errors (serverless read-only filesystems, etc.).
 */
export async function writeMemoriesFile(): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const memories = await getMemories();
    const md = formatMemoriesAsMarkdown(memories);
    // Resolve to project root (where package.json lives)
    const filePath = path.join(process.cwd(), 'memories.md');
    await fs.writeFile(filePath, md, 'utf-8');
    log.success(`Wrote memories.md`, `${memories.length} entries`);
  } catch (err) {
    // Silently swallow — expected in prod serverless environments
    log.warn('Could not write memories.md (best-effort)', String(err));
  }
}

/** Build a compact memories section for inclusion in the taste-profile prompt. */
export async function buildMemoriesSection(): Promise<string> {
  const memories = await getMemories(100);
  if (memories.length === 0) return '';

  const byReason: Record<string, Memory[]> = {};
  for (const m of memories) {
    if (!byReason[m.reason]) byReason[m.reason] = [];
    byReason[m.reason].push(m);
  }

  const parts: string[] = ['## MEMORIES (explicit rejections with reasons)'];
  parts.push('These are titles the user actively rejected. Take the reasons seriously when inferring taste patterns.');
  for (const [reason, items] of Object.entries(byReason)) {
    const label = REASON_LABELS[reason] ?? reason;
    parts.push(`\n**${label}:** ${items.map(m => m.title).join(', ')}`);
  }
  return parts.join('\n');
}
