'use client';

import { ContentType } from '@/types/index';

const CONTENT_TYPES: { type: ContentType; icon: string }[] = [
  { type: 'movie', icon: '🎬' },
  { type: 'tv', icon: '📺' },
  { type: 'youtube', icon: '▶️' },
  { type: 'anime', icon: '🎌' },
];

interface Props {
  selected: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-[280px] mx-auto">
      {CONTENT_TYPES.map(({ type, icon }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`aspect-square flex items-center justify-center rounded-2xl border-2 transition-all duration-300 active:scale-95 ${
              isSelected
                ? 'border-[#c4b5fd] bg-white shadow-lg shadow-purple-200/50 scale-105'
                : 'border-[#e9e4f5] bg-white/60 hover:bg-white hover:border-[#c4b5fd] hover:shadow-md hover:shadow-purple-100/30'
            }`}
          >
            <span className="text-4xl sm:text-5xl">{icon}</span>
          </button>
        );
      })}
    </div>
  );
}
