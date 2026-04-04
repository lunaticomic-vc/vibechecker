'use client';

import { useState } from 'react';

const EXAMPLE_VIBES = [
  'relaxing',
  'eating',
  'deep focus',
  'can\'t sleep',
  'binge',
  'need a cry',
];

interface Props {
  onSubmit: (vibe: string) => void;
  loading: boolean;
}

export default function VibeInput({ onSubmit, loading }: Props) {
  const [vibe, setVibe] = useState('');

  const handleSubmit = () => {
    if (vibe.trim()) onSubmit(vibe.trim());
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <textarea
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        rows={3}
        autoFocus
        placeholder="describe your vibe..."
        className="w-full resize-none rounded-2xl border-2 border-[#e9e4f5] bg-white/80 backdrop-blur-sm px-4 py-3 text-[#2d2640] placeholder-[#c4b5fd] focus:border-[#c4b5fd] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/20 transition-all text-sm text-center"
      />

      <div className="flex flex-wrap justify-center gap-1.5">
        {EXAMPLE_VIBES.map((example) => (
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
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        )}
      </button>
    </div>
  );
}
