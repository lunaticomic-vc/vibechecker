'use client';

import { ContentType } from '@/types/index';

const CONTENT_TYPES: { type: ContentType; emoji: string; label: string; desc: string }[] = [
  { type: 'movie', emoji: '🎬', label: 'Movie', desc: 'Feature films' },
  { type: 'tv', emoji: '📺', label: 'TV Show', desc: 'Series & episodes' },
  { type: 'youtube', emoji: '▶️', label: 'YouTube', desc: 'Videos & channels' },
  { type: 'anime', emoji: '🎌', label: 'Anime', desc: 'Japanese animation' },
];

interface Props {
  selected: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {CONTENT_TYPES.map(({ type, emoji, label, desc }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-6 text-center transition-all duration-200 hover:scale-105 hover:border-violet-500/60 hover:bg-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              isSelected
                ? 'scale-105 border-violet-500 bg-violet-500/20 shadow-lg shadow-violet-500/20'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <span className="text-4xl">{emoji}</span>
            <span className={`font-semibold ${isSelected ? 'text-violet-300' : 'text-white'}`}>
              {label}
            </span>
            <span className="text-xs text-gray-500">{desc}</span>
          </button>
        );
      })}
    </div>
  );
}
