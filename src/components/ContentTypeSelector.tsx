'use client';

import { ContentType } from '@/types/index';

const CONTENT_TYPES: { type: ContentType; label: string; icon: React.ReactNode }[] = [
  {
    type: 'movie',
    label: 'movie',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Film reel with decorative flourishes */}
        <circle cx="36" cy="36" r="22" />
        <circle cx="36" cy="36" r="7" />
        <circle cx="36" cy="36" r="2.5" fill="currentColor" stroke="none" />
        {/* Spokes */}
        <line x1="36" y1="14" x2="36" y2="29" />
        <line x1="36" y1="43" x2="36" y2="58" />
        <line x1="14" y1="36" x2="29" y2="36" />
        <line x1="43" y1="36" x2="58" y2="36" />
        {/* Diagonal spokes */}
        <line x1="20.4" y1="20.4" x2="30.1" y2="30.1" />
        <line x1="41.9" y1="41.9" x2="51.6" y2="51.6" />
        <line x1="51.6" y1="20.4" x2="41.9" y2="30.1" />
        <line x1="30.1" y1="41.9" x2="20.4" y2="51.6" />
        {/* Decorative dots on rim */}
        <circle cx="36" cy="14" r="2" fill="currentColor" stroke="none" opacity="0.4" />
        <circle cx="36" cy="58" r="2" fill="currentColor" stroke="none" opacity="0.4" />
        <circle cx="14" cy="36" r="2" fill="currentColor" stroke="none" opacity="0.4" />
        <circle cx="58" cy="36" r="2" fill="currentColor" stroke="none" opacity="0.4" />
        {/* Flourish arcs */}
        <path d="M10 10 Q 18 6, 20 14" strokeWidth="1" opacity="0.3" />
        <path d="M62 10 Q 54 6, 52 14" strokeWidth="1" opacity="0.3" />
        <path d="M10 62 Q 18 66, 20 58" strokeWidth="1" opacity="0.3" />
        <path d="M62 62 Q 54 66, 52 58" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  },
  {
    type: 'tv',
    label: 'tv show',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Ornate TV/mirror frame */}
        <rect x="12" y="14" width="48" height="34" rx="4" />
        <rect x="16" y="18" width="40" height="26" rx="2" strokeWidth="0.8" opacity="0.4" />
        {/* Screen reflection */}
        <path d="M20 22 L26 22 L22 28" strokeWidth="0.8" opacity="0.25" fill="currentColor" />
        {/* Decorative top crown */}
        <path d="M28 14 Q 30 8, 36 6 Q 42 8, 44 14" strokeWidth="1" />
        <circle cx="36" cy="6" r="2" fill="currentColor" stroke="none" opacity="0.3" />
        {/* Stand with flourishes */}
        <path d="M30 48 Q 30 54, 24 58" strokeWidth="1" />
        <path d="M42 48 Q 42 54, 48 58" strokeWidth="1" />
        <line x1="22" y1="58" x2="50" y2="58" />
        {/* Decorative corner dots */}
        <circle cx="14" cy="16" r="1.5" fill="currentColor" stroke="none" opacity="0.2" />
        <circle cx="58" cy="16" r="1.5" fill="currentColor" stroke="none" opacity="0.2" />
        <circle cx="14" cy="46" r="1.5" fill="currentColor" stroke="none" opacity="0.2" />
        <circle cx="58" cy="46" r="1.5" fill="currentColor" stroke="none" opacity="0.2" />
        {/* Side vine decorations */}
        <path d="M8 24 Q 6 30, 8 36 Q 6 42, 8 46" strokeWidth="0.8" opacity="0.25" />
        <path d="M64 24 Q 66 30, 64 36 Q 66 42, 64 46" strokeWidth="0.8" opacity="0.25" />
      </svg>
    ),
  },
  {
    type: 'youtube',
    label: 'youtube',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Ornate play button */}
        <circle cx="36" cy="36" r="22" />
        <circle cx="36" cy="36" r="26" strokeWidth="0.6" opacity="0.2" strokeDasharray="3 4" />
        {/* Play triangle */}
        <path d="M30 24 L48 36 L30 48 Z" fill="currentColor" stroke="none" opacity="0.15" />
        <path d="M30 24 L48 36 L30 48 Z" strokeWidth="1.2" />
        {/* Decorative rays */}
        <line x1="36" y1="6" x2="36" y2="10" strokeWidth="0.8" opacity="0.2" />
        <line x1="36" y1="62" x2="36" y2="66" strokeWidth="0.8" opacity="0.2" />
        <line x1="6" y1="36" x2="10" y2="36" strokeWidth="0.8" opacity="0.2" />
        <line x1="62" y1="36" x2="66" y2="36" strokeWidth="0.8" opacity="0.2" />
        {/* Diagonal rays */}
        <line x1="13" y1="13" x2="16" y2="16" strokeWidth="0.8" opacity="0.15" />
        <line x1="56" y1="13" x2="53" y2="16" strokeWidth="0.8" opacity="0.15" />
        <line x1="13" y1="59" x2="16" y2="56" strokeWidth="0.8" opacity="0.15" />
        <line x1="56" y1="59" x2="53" y2="56" strokeWidth="0.8" opacity="0.15" />
        {/* Petal curves around circle */}
        <path d="M36 10 Q 44 14, 42 10" strokeWidth="0.7" opacity="0.2" />
        <path d="M58 30 Q 62 36, 58 42" strokeWidth="0.7" opacity="0.2" />
        <path d="M36 62 Q 28 58, 30 62" strokeWidth="0.7" opacity="0.2" />
        <path d="M14 42 Q 10 36, 14 30" strokeWidth="0.7" opacity="0.2" />
      </svg>
    ),
  },
  {
    type: 'anime',
    label: 'anime',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Crescent moon with star — celestial/ethereal */}
        <path d="M42 12 Q 22 18, 22 36 Q 22 54, 42 60 Q 30 54, 30 36 Q 30 18, 42 12 Z" />
        {/* Main star */}
        <path d="M48 24 L50 30 L56 30 L51 34 L53 40 L48 36 L43 40 L45 34 L40 30 L46 30 Z" />
        {/* Small stars */}
        <circle cx="54" cy="18" r="1.2" fill="currentColor" stroke="none" opacity="0.4" />
        <circle cx="58" cy="28" r="0.8" fill="currentColor" stroke="none" opacity="0.3" />
        <circle cx="56" cy="48" r="1" fill="currentColor" stroke="none" opacity="0.35" />
        <circle cx="50" cy="54" r="0.8" fill="currentColor" stroke="none" opacity="0.25" />
        <circle cx="60" cy="40" r="0.6" fill="currentColor" stroke="none" opacity="0.2" />
        {/* Sparkle crosses */}
        <path d="M16 16 L16 12 M14 14 L18 14" strokeWidth="0.8" opacity="0.2" />
        <path d="M62 52 L62 48 M60 50 L64 50" strokeWidth="0.8" opacity="0.2" />
        {/* Flowing trail from moon */}
        <path d="M24 56 Q 18 62, 14 60" strokeWidth="0.8" opacity="0.2" />
        <path d="M22 52 Q 14 56, 10 52" strokeWidth="0.7" opacity="0.15" />
        {/* Delicate arc */}
        <path d="M38 8 Q 46 4, 56 10" strokeWidth="0.7" opacity="0.2" />
      </svg>
    ),
  },
  {
    type: 'substack' as ContentType,
    label: 'substack',
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Open book/letter with pages */}
        <path d="M16 18 L36 24 L56 18" />
        <path d="M16 18 L16 52 L36 58 L56 52 L56 18" />
        <path d="M36 24 L36 58" />
        {/* Text lines on left page */}
        <line x1="22" y1="30" x2="32" y2="33" strokeWidth="0.8" opacity="0.3" />
        <line x1="22" y1="36" x2="32" y2="39" strokeWidth="0.8" opacity="0.3" />
        <line x1="22" y1="42" x2="30" y2="44" strokeWidth="0.8" opacity="0.25" />
        {/* Text lines on right page */}
        <line x1="40" y1="33" x2="50" y2="30" strokeWidth="0.8" opacity="0.3" />
        <line x1="40" y1="39" x2="50" y2="36" strokeWidth="0.8" opacity="0.3" />
        <line x1="40" y1="44" x2="48" y2="42" strokeWidth="0.8" opacity="0.25" />
        {/* Decorative bookmark ribbon */}
        <path d="M44 18 L44 12 L48 15 L52 12 L52 18" strokeWidth="0.8" opacity="0.25" />
        {/* Small flourish */}
        <path d="M12 22 Q 10 28, 12 34" strokeWidth="0.7" opacity="0.15" />
        <path d="M60 22 Q 62 28, 60 34" strokeWidth="0.7" opacity="0.15" />
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
    <div className="flex flex-wrap justify-center gap-5 sm:gap-6 w-full max-w-[400px] sm:max-w-[460px] mx-auto">
      {CONTENT_TYPES.map(({ type, label, icon }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`group w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex flex-col items-center justify-center gap-3 rounded-3xl border-2 transition-all duration-500 active:scale-95 ${
              isSelected
                ? 'border-[#c4b5fd] bg-white/90 shadow-xl shadow-purple-100/60 scale-[1.03]'
                : 'border-[#e8e3f3]/80 bg-white/40 hover:bg-white/70 hover:border-[#d4cee6] hover:shadow-lg hover:shadow-purple-50/40'
            }`}
          >
            <span className={`transition-all duration-500 ${
              isSelected ? 'text-[#a78bfa] scale-110' : 'text-[#c8c2d6] group-hover:text-[#b0a8c4] group-hover:scale-105'
            }`}>
              {icon}
            </span>
            <span className={`text-[10px] tracking-[0.2em] uppercase font-light transition-colors duration-500 ${
              isSelected ? 'text-[#8b5cf6]' : 'text-[#d0cadc] group-hover:text-[#b0a8c4]'
            }`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
