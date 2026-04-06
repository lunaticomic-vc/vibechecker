'use client';

import { useState } from 'react';
import LoadingMouse from '@/components/LoadingMouse';
import type { ContentType } from '@/types/index';

const DEFAULT_VIBES = [
  'can\'t sleep, something cozy',
  'need a good cry',
  'procrastinating, make it unhinged',
  'rainy day, slow and pretty',
];

const VIBES_BY_TYPE: Partial<Record<ContentType, string[]>> = {
  movie: [
    'i\'m having lunch rn, something light',
    'sleepover binge with the girls',
    'need a good cry, something devastating',
    'rainy day, slow and pretty',
  ],
  tv: [
    'sleepover binge with the girls',
    'background show while cooking',
    'something addictive i can\'t stop watching',
    'cozy and feel-good, no drama',
  ],
  anime: [
    'need something with beautiful animation',
    'unhinged and chaotic, surprise me',
    'slow burn with deep characters',
    'something emotional and bittersweet',
  ],
  youtube: [
    'i\'m having lunch rn, something light and ~20 mins',
    'deep dive into something niche',
    'procrastinating, make it unhinged',
    'calming background while i work',
  ],
  kdrama: [
    'enemies to lovers, slow burn',
    'something funny and lighthearted',
    'need to cry, give me melodrama',
    'cozy romance, nothing heavy',
  ],
  substack: [
    'something that makes me think differently',
    'personal essay, raw and honest',
    'culture criticism, sharp and witty',
    'something about art or creativity',
  ],
  book: [
    'can\'t sleep, need something immersive',
    'short and beautiful, under 200 pages',
    'something that changes how i see things',
    'cozy and comforting like a warm blanket',
  ],
  poetry: [
    'heartbreak but make it beautiful',
    'something about nature and stillness',
    'angry and raw, no polished edges',
    'soft and tender, like a whisper',
  ],
  short_story: [
    'something surreal and dreamlike',
    'twist ending that haunts me',
    'quiet and melancholy',
    'weird and wonderful, very strange',
  ],
  essay: [
    'something philosophical and deep',
    'personal essay, vulnerable and real',
    'sharp cultural commentary',
    'about love or loss or both',
  ],
  podcast: [
    'true crime but thoughtful, not sensational',
    'something funny while i commute',
    'deep conversation about life',
    'learn something weird and niche',
  ],
  research: [
    'rabbit hole i can get lost in',
    'something mind-blowing about the universe',
    'curious about how things work',
    'niche topic nobody talks about',
  ],
  manga: [
    'something with beautiful art and slow pacing',
    'dark and psychological, mess me up',
    'wholesome slice of life, warm vibes',
    'epic worldbuilding and complex power systems',
  ],
  comic: [
    'gritty noir, morally grey characters',
    'colorful and fun, classic superhero vibes',
    'indie and artistic, something different',
    'dark humor and sharp writing',
  ],
};

interface Props {
  onSubmit: (vibe: string, useInterests: boolean) => void;
  loading: boolean;
  isOwner?: boolean;
  contentType?: ContentType | null;
}

export default function VibeInput({ onSubmit, loading, isOwner = false, contentType }: Props) {
  const [vibe, setVibe] = useState('');
  const [useInterests, setUseInterests] = useState(true);
  const examples = (contentType && VIBES_BY_TYPE[contentType]) || DEFAULT_VIBES;

  const handleSubmit = () => {
    if (vibe.trim()) onSubmit(vibe.trim(), useInterests);
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="w-full flex flex-col gap-1.5">
        {isOwner && (
          <label className="flex items-center gap-2 cursor-pointer select-none self-end">
            <input
              type="checkbox"
              checked={useInterests}
              onChange={(e) => setUseInterests(e.target.checked)}
              className="w-4 h-4 rounded border-[#e9e4f5] text-[#8b5cf6] focus:ring-[#c4b5fd] focus:ring-offset-0 cursor-pointer accent-[#8b5cf6]"
            />
            <span className="text-[12px] text-[#7c7291]">use my interests</span>
          </label>
        )}
        <textarea
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={3}
          autoFocus
          placeholder="describe your vibe..."
          className="w-full resize-none rounded-2xl border-2 border-[#e9e4f5] bg-white/80 backdrop-blur-sm px-4 py-3 text-[#2d2640] placeholder-[#c4b5fd] focus:border-[#c4b5fd] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/20 transition-all text-sm text-center"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {examples.map((example) => (
          <button
            key={example}
            onClick={() => setVibe(example)}
            className="rounded-full border border-[#e9e4f5] bg-white/60 px-3 py-1 text-[11px] text-[#b8b0c8] hover:border-[#c4b5fd] hover:text-[#7c3aed] hover:bg-white transition-all"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!vibe.trim() || loading}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-[#8b5cf6] text-white transition-all hover:bg-[#7c3aed] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200/50"
      >
        {loading ? (
          <LoadingMouse size="sm" />
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        )}
      </button>
    </div>
  );
}
