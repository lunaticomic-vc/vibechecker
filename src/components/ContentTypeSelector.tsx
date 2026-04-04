'use client';

import { ContentType } from '@/types/index';

const CONTENT_TYPES: { type: ContentType; emoji: string; label: string; color: string; selectedBg: string; selectedBorder: string }[] = [
  { type: 'movie', emoji: '🎬', label: 'Movie', color: 'text-[#7c3aed]', selectedBg: 'bg-[#f3f0ff]', selectedBorder: 'border-[#c4b5fd]' },
  { type: 'tv', emoji: '📺', label: 'TV Show', color: 'text-[#6b9a65]', selectedBg: 'bg-[#f0f7ef]', selectedBorder: 'border-[#a7c4a0]' },
  { type: 'youtube', emoji: '▶️', label: 'YouTube', color: 'text-[#dc2626]', selectedBg: 'bg-[#fef2f2]', selectedBorder: 'border-[#fca5a5]' },
  { type: 'anime', emoji: '🎌', label: 'Anime', color: 'text-[#8b5cf6]', selectedBg: 'bg-[#f5f3ff]', selectedBorder: 'border-[#c4b5fd]' },
];

interface Props {
  selected: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-sm mx-auto">
      {CONTENT_TYPES.map(({ type, emoji, label, selectedBg, selectedBorder }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-6 sm:p-8 text-center transition-all duration-200 active:scale-95 ${
              isSelected
                ? `${selectedBg} ${selectedBorder} shadow-md`
                : 'bg-white border-[#e9e4f5] hover:border-[#c4b5fd] hover:shadow-sm'
            }`}
          >
            <span className="text-3xl sm:text-4xl">{emoji}</span>
            <span className={`font-semibold text-sm sm:text-base ${isSelected ? 'text-[#7c3aed]' : 'text-[#2d2640]'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
