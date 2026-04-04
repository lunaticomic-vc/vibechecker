'use client';

import { useState } from 'react';

const EXAMPLE_VIBES = [
  'Relaxing evening',
  'Quick lunch break',
  'Deep focus',
  "Can't sleep",
  'Weekend binge',
  'Need a good cry',
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
    <div className="flex flex-col gap-4">
      <textarea
        value={vibe}
        onChange={(e) => setVibe(e.target.value)}
        rows={3}
        placeholder="Describe your vibe... e.g., 'eating lunch, want something light and funny, ~20 mins'"
        className="w-full resize-none rounded-2xl border-2 border-[#e9e4f5] bg-white px-4 py-3 text-[#2d2640] placeholder-[#b8b0c8] focus:border-[#c4b5fd] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/30 transition-all text-sm sm:text-base"
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_VIBES.map((example) => (
          <button
            key={example}
            onClick={() => setVibe(example)}
            className="rounded-full border border-[#e9e4f5] bg-white px-3 py-1.5 text-xs text-[#7c7291] hover:border-[#c4b5fd] hover:bg-[#f3f0ff] hover:text-[#7c3aed] transition-all"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!vibe.trim() || loading}
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#8b5cf6] px-8 py-3.5 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] text-sm sm:text-base"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Finding your vibe...
          </>
        ) : (
          'Check My Vibe'
        )}
      </button>
    </div>
  );
}
