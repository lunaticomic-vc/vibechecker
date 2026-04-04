'use client';

import { ContentType } from '@/types/index';

const CONTENT_TYPES: { type: ContentType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'movie',
    label: 'movie',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="36" height="28" rx="3" />
        <path d="M6 18h36M6 30h36" />
        <path d="M14 10v8M14 30v8M34 10v8M34 30v8" />
      </svg>
    ),
  },
  {
    type: 'tv',
    label: 'tv show',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="12" width="36" height="24" rx="3" />
        <path d="M18 42h12" />
        <path d="M24 36v6" />
        <circle cx="24" cy="24" r="6" />
        <path d="M22 22l5 2-5 2z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    type: 'youtube',
    label: 'youtube',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="12" width="36" height="24" rx="6" />
        <path d="M20 18l10 6-10 6z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    type: 'anime',
    label: 'anime',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" />
        <circle cx="14" cy="38" r="4" />
        <circle cx="34" cy="38" r="4" />
        <path d="M18 38h12" />
      </svg>
    ),
  },
];

interface Props {
  selected: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:gap-7 w-full max-w-[340px] sm:max-w-[400px] mx-auto">
      {CONTENT_TYPES.map(({ type, label, icon }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`group aspect-square flex flex-col items-center justify-center gap-3 rounded-3xl border-2 transition-all duration-300 active:scale-95 ${
              isSelected
                ? 'border-[#c4b5fd] bg-white shadow-xl shadow-purple-100/60 scale-[1.03]'
                : 'border-[#e5e1ef] bg-white/50 hover:bg-white hover:border-[#d4cee6] hover:shadow-lg hover:shadow-purple-50/40'
            }`}
          >
            <span className={`transition-colors duration-300 ${
              isSelected ? 'text-[#a78bfa]' : 'text-[#c8c2d6] group-hover:text-[#b0a8c4]'
            }`}>
              {icon}
            </span>
            <span className={`text-[11px] tracking-wider uppercase font-medium transition-colors duration-300 ${
              isSelected ? 'text-[#8b5cf6]' : 'text-[#c8c2d6] group-hover:text-[#a8a0ba]'
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
