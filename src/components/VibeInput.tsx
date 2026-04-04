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
        rows={4}
        placeholder="Describe your vibe... e.g., 'eating lunch, want something light and funny, ~20 mins'"
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-gray-500 focus:border-violet-500/60 focus:bg-white/8 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_VIBES.map((example) => (
          <button
            key={example}
            onClick={() => setVibe(example)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-gray-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-300 transition-all"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!vibe.trim() || loading}
        className="flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 font-semibold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
          'Check My Vibe ✨'
        )}
      </button>
    </div>
  );
}
