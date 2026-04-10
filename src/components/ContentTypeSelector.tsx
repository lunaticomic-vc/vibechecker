'use client';

import { ContentType } from '@/types/index';

const CONTENT_TYPE_MAP: Record<ContentType, { label: string; icon: React.ReactNode }> = {
  movie: {
    label: 'movie',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
  tv: {
    label: 'tv show',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
  youtube: {
    label: 'youtube',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
  anime: {
    label: 'anime',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
  substack: {
    label: 'substack',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
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
  research: {
    label: 'research',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Magnifying glass */}
        <circle cx="30" cy="30" r="16" />
        <line x1="41.3" y1="41.3" x2="58" y2="58" strokeWidth="2.5" strokeLinecap="round" />
        {/* Inner lens glimmer */}
        <circle cx="30" cy="30" r="11" strokeWidth="0.7" opacity="0.3" />
        {/* Lightbulb filament inside lens */}
        <path d="M26 28 Q 30 22, 34 28 Q 34 32, 30 34 Q 26 32, 26 28 Z" strokeWidth="0.9" opacity="0.5" />
        <line x1="30" y1="34" x2="30" y2="37" strokeWidth="0.9" opacity="0.4" />
        <line x1="28" y1="36" x2="32" y2="36" strokeWidth="0.9" opacity="0.35" />
        {/* Sparkle accents around lens */}
        <path d="M16 14 L16 10 M14 12 L18 12" strokeWidth="0.8" opacity="0.2" />
        <path d="M48 12 L48 8 M46 10 L50 10" strokeWidth="0.8" opacity="0.2" />
        {/* Decorative arc flourish */}
        <path d="M10 38 Q 6 30, 14 22" strokeWidth="0.7" opacity="0.15" />
        <path d="M48 10 Q 56 18, 50 28" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  kdrama: {
    label: 'k-drama',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Heart with Korean-style flourish */}
        <path d="M36 56 C 20 42, 8 30, 16 20 C 22 14, 30 16, 36 24 C 42 16, 50 14, 56 20 C 64 30, 52 42, 36 56 Z" />
        {/* Inner detail */}
        <path d="M36 48 C 26 38, 18 30, 22 24 C 26 20, 30 21, 36 28" strokeWidth="0.8" opacity="0.3" />
        {/* Sparkle accents */}
        <path d="M20 12 L20 8 M18 10 L22 10" strokeWidth="0.8" opacity="0.2" />
        <path d="M54 12 L54 8 M52 10 L56 10" strokeWidth="0.8" opacity="0.2" />
        {/* Decorative swirl */}
        <path d="M12 36 Q 8 42, 12 48" strokeWidth="0.7" opacity="0.15" />
        <path d="M60 36 Q 64 42, 60 48" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  poetry: {
    label: 'poetry',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Quill feather */}
        <path d="M54 10 Q 62 8, 60 18 Q 52 36, 36 50 L32 54" />
        <path d="M54 10 Q 46 12, 42 20 Q 38 32, 36 50" strokeWidth="0.9" opacity="0.5" />
        {/* Quill spine */}
        <path d="M54 10 L32 54" strokeWidth="0.7" opacity="0.35" />
        {/* Ink drop at nib */}
        <path d="M32 54 Q 30 58, 32 62 Q 34 58, 32 54" fill="currentColor" stroke="none" opacity="0.3" />
        <path d="M32 54 Q 30 58, 32 62 Q 34 58, 32 54" />
        {/* Decorative barbs on feather */}
        <path d="M50 16 Q 54 18, 52 22" strokeWidth="0.8" opacity="0.25" />
        <path d="M46 22 Q 50 24, 48 28" strokeWidth="0.8" opacity="0.25" />
        <path d="M42 28 Q 46 30, 44 34" strokeWidth="0.8" opacity="0.25" />
        {/* Ink flourish lines — like written verse */}
        <line x1="10" y1="42" x2="24" y2="42" strokeWidth="0.8" opacity="0.2" />
        <line x1="10" y1="48" x2="20" y2="48" strokeWidth="0.8" opacity="0.2" />
        <line x1="10" y1="54" x2="22" y2="54" strokeWidth="0.8" opacity="0.2" />
        {/* Small accent dots */}
        <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" opacity="0.2" />
        <circle cx="18" cy="10" r="0.8" fill="currentColor" stroke="none" opacity="0.15" />
        <path d="M8 28 Q 6 34, 8 40" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  short_story: {
    label: 'short story',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Scroll / manuscript */}
        <path d="M18 16 Q 18 10, 24 10 L52 10 Q 58 10, 58 16 L58 56 Q 58 62, 52 62 L24 62 Q 18 62, 18 56 Z" />
        {/* Scroll curl at top */}
        <path d="M18 16 Q 14 16, 14 20 Q 14 24, 18 24" strokeWidth="1" />
        <path d="M58 16 Q 62 16, 62 20 Q 62 24, 58 24" strokeWidth="1" />
        {/* Scroll curl at bottom */}
        <path d="M18 56 Q 14 56, 14 52 Q 14 48, 18 48" strokeWidth="1" />
        <path d="M58 56 Q 62 56, 62 52 Q 62 48, 58 48" strokeWidth="1" />
        {/* Text lines */}
        <line x1="26" y1="22" x2="50" y2="22" strokeWidth="0.8" opacity="0.35" />
        <line x1="26" y1="29" x2="50" y2="29" strokeWidth="0.8" opacity="0.35" />
        <line x1="26" y1="36" x2="50" y2="36" strokeWidth="0.8" opacity="0.35" />
        <line x1="26" y1="43" x2="44" y2="43" strokeWidth="0.8" opacity="0.3" />
        <line x1="26" y1="50" x2="48" y2="50" strokeWidth="0.8" opacity="0.25" />
        {/* Decorative initial capital flourish */}
        <path d="M26 18 Q 22 14, 26 10" strokeWidth="0.7" opacity="0.2" />
        {/* Corner flourish */}
        <path d="M50 62 Q 56 60, 58 56" strokeWidth="0.7" opacity="0.2" />
        <circle cx="54" cy="8" r="1" fill="currentColor" stroke="none" opacity="0.2" />
      </svg>
    ),
  },
  book: {
    label: 'book',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Book cover */}
        <rect x="14" y="10" width="44" height="54" rx="3" />
        {/* Spine */}
        <line x1="22" y1="10" x2="22" y2="64" strokeWidth="1.5" />
        {/* Pages edge — subtle layering */}
        <rect x="23" y="12" width="33" height="50" rx="1" strokeWidth="0.7" opacity="0.3" />
        <rect x="24" y="13" width="31" height="48" rx="1" strokeWidth="0.5" opacity="0.15" />
        {/* Cover title lines */}
        <line x1="30" y1="28" x2="50" y2="28" strokeWidth="0.9" opacity="0.35" />
        <line x1="30" y1="34" x2="46" y2="34" strokeWidth="0.9" opacity="0.3" />
        {/* Decorative cover emblem */}
        <circle cx="40" cy="48" r="8" strokeWidth="0.8" opacity="0.25" />
        <path d="M36 48 Q 40 44, 44 48 Q 40 52, 36 48 Z" strokeWidth="0.8" opacity="0.3" />
        {/* Spine decorations */}
        <line x1="15" y1="20" x2="21" y2="20" strokeWidth="0.7" opacity="0.2" />
        <line x1="15" y1="54" x2="21" y2="54" strokeWidth="0.7" opacity="0.2" />
        {/* Corner flourishes */}
        <path d="M10 14 Q 8 18, 10 22" strokeWidth="0.7" opacity="0.15" />
        <path d="M62 14 Q 64 18, 62 22" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  essay: {
    label: 'essay',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Document / paper */}
        <path d="M16 8 L48 8 L58 18 L58 64 L16 64 Z" />
        {/* Folded corner */}
        <path d="M48 8 L48 18 L58 18" strokeWidth="1" />
        <path d="M48 8 L58 18" strokeWidth="0.6" opacity="0.3" />
        {/* Text lines */}
        <line x1="24" y1="28" x2="50" y2="28" strokeWidth="0.9" opacity="0.35" />
        <line x1="24" y1="35" x2="50" y2="35" strokeWidth="0.9" opacity="0.35" />
        <line x1="24" y1="42" x2="50" y2="42" strokeWidth="0.9" opacity="0.35" />
        <line x1="24" y1="49" x2="42" y2="49" strokeWidth="0.9" opacity="0.3" />
        {/* Pen nib resting on document */}
        <path d="M46 56 L56 46 L60 50 L50 60 Z" />
        <path d="M50 60 Q 48 64, 46 62 Q 44 60, 46 58 Z" fill="currentColor" stroke="none" opacity="0.2" />
        <path d="M50 60 Q 48 64, 46 62 Q 44 60, 46 58 Z" />
        <line x1="56" y1="46" x2="60" y2="50" strokeWidth="0.8" opacity="0.4" />
        {/* Decorative corner marks */}
        <path d="M12 12 Q 10 18, 12 24" strokeWidth="0.7" opacity="0.15" />
        <circle cx="52" cy="12" r="1" fill="currentColor" stroke="none" opacity="0.2" />
        <path d="M20 8 Q 16 4, 12 8" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  podcast: {
    label: 'podcast',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Headphones band */}
        <path d="M18 36 Q 18 18, 36 18 Q 54 18, 54 36" />
        {/* Left ear cup */}
        <rect x="12" y="34" width="12" height="16" rx="4" />
        {/* Right ear cup */}
        <rect x="48" y="34" width="12" height="16" rx="4" />
        {/* Sound waves — emanating outward */}
        <path d="M8 28 Q 4 36, 8 44" strokeWidth="0.9" opacity="0.3" />
        <path d="M4 22 Q -2 36, 4 50" strokeWidth="0.7" opacity="0.2" />
        <path d="M64 28 Q 68 36, 64 44" strokeWidth="0.9" opacity="0.3" />
        <path d="M68 22 Q 74 36, 68 50" strokeWidth="0.7" opacity="0.2" />
        {/* Decorative band detail */}
        <path d="M28 20 Q 36 16, 44 20" strokeWidth="0.8" opacity="0.25" />
        {/* Accent dots on ear cups */}
        <circle cx="18" cy="42" r="2.5" strokeWidth="0.8" opacity="0.3" />
        <circle cx="54" cy="42" r="2.5" strokeWidth="0.8" opacity="0.3" />
        {/* Cord suggestion */}
        <path d="M24 50 Q 24 58, 36 60 Q 48 58, 48 50" strokeWidth="0.8" opacity="0.2" />
        {/* Small sparkle above */}
        <path d="M36 10 L36 6 M34 8 L38 8" strokeWidth="0.7" opacity="0.2" />
      </svg>
    ),
  },
  manga: {
    label: 'manga',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Book spine — right-to-left binding */}
        <rect x="14" y="10" width="44" height="54" rx="3" />
        <line x1="50" y1="10" x2="50" y2="64" strokeWidth="1.5" />
        {/* Pages edge */}
        <rect x="15" y="12" width="33" height="50" rx="1" strokeWidth="0.7" opacity="0.3" />
        {/* Speed lines — manga action feel */}
        <line x1="20" y1="22" x2="34" y2="22" strokeWidth="0.8" opacity="0.3" />
        <line x1="22" y1="28" x2="38" y2="28" strokeWidth="0.8" opacity="0.25" />
        <line x1="20" y1="34" x2="36" y2="34" strokeWidth="0.8" opacity="0.3" />
        {/* Panel divider lines */}
        <line x1="30" y1="18" x2="30" y2="42" strokeWidth="0.7" opacity="0.2" />
        <line x1="20" y1="38" x2="44" y2="38" strokeWidth="0.7" opacity="0.2" />
        {/* Starburst accent — manga emphasis */}
        <path d="M26 50 L28 46 L30 50 L32 46 L34 50" strokeWidth="0.9" opacity="0.35" />
        {/* Sparkle accents */}
        <path d="M56 16 L56 12 M54 14 L58 14" strokeWidth="0.8" opacity="0.2" />
        <circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" opacity="0.2" />
        {/* Decorative flourish */}
        <path d="M10 44 Q 8 50, 10 56" strokeWidth="0.7" opacity="0.15" />
        <path d="M62 44 Q 64 50, 62 56" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  comic: {
    label: 'comic',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Speech bubble — main shape */}
        <path d="M14 14 L58 14 Q 62 14, 62 18 L62 40 Q 62 44, 58 44 L32 44 L22 56 L24 44 L16 44 Q 12 44, 12 40 L12 18 Q 12 14, 16 14 Z" />
        {/* Inner panel border */}
        <rect x="18" y="20" width="38" height="18" rx="2" strokeWidth="0.7" opacity="0.3" />
        {/* Comic dots — halftone pattern */}
        <circle cx="22" cy="26" r="1.5" fill="currentColor" stroke="none" opacity="0.15" />
        <circle cx="28" cy="24" r="1" fill="currentColor" stroke="none" opacity="0.12" />
        <circle cx="26" cy="30" r="1.2" fill="currentColor" stroke="none" opacity="0.1" />
        {/* ZAP text lines */}
        <line x1="34" y1="26" x2="50" y2="26" strokeWidth="0.9" opacity="0.35" />
        <line x1="34" y1="32" x2="46" y2="32" strokeWidth="0.9" opacity="0.3" />
        {/* Starburst accent — comic pow */}
        <path d="M54 8 L56 12 L60 10 L58 14" strokeWidth="0.8" opacity="0.25" />
        <path d="M8 8 L10 12 L14 10 L12 14" strokeWidth="0.8" opacity="0.2" />
        {/* Small sparkle */}
        <path d="M48 52 L48 48 M46 50 L50 50" strokeWidth="0.7" opacity="0.2" />
        {/* Motion lines */}
        <line x1="8" y1="28" x2="12" y2="28" strokeWidth="0.7" opacity="0.15" />
        <line x1="62" y1="28" x2="66" y2="28" strokeWidth="0.7" opacity="0.15" />
        {/* Decorative flourish */}
        <path d="M36 58 Q 40 62, 44 58" strokeWidth="0.7" opacity="0.15" />
      </svg>
    ),
  },
  game: {
    label: 'game',
    icon: (
      <svg aria-hidden="true" width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Controller body */}
        <path d="M16 28 Q 16 22, 24 22 L48 22 Q 56 22, 56 28 L58 40 Q 60 50, 52 50 L46 50 Q 44 50, 42 46 L30 46 Q 28 50, 26 50 L20 50 Q 12 50, 14 40 Z" />
        {/* D-pad */}
        <line x1="26" y1="33" x2="26" y2="39" strokeWidth="1" opacity="0.4" />
        <line x1="23" y1="36" x2="29" y2="36" strokeWidth="1" opacity="0.4" />
        {/* Buttons */}
        <circle cx="44" cy="33" r="2" strokeWidth="0.9" opacity="0.35" />
        <circle cx="49" cy="36" r="2" strokeWidth="0.9" opacity="0.3" />
        {/* Analog sticks */}
        <circle cx="32" cy="42" r="2.5" strokeWidth="0.7" opacity="0.2" />
        <circle cx="40" cy="42" r="2.5" strokeWidth="0.7" opacity="0.2" />
        {/* Top bumpers */}
        <line x1="22" y1="22" x2="28" y2="18" strokeWidth="0.7" opacity="0.2" />
        <line x1="50" y1="22" x2="44" y2="18" strokeWidth="0.7" opacity="0.2" />
        {/* Sparkle */}
        <path d="M60 18 L60 14 M58 16 L62 16" strokeWidth="0.7" opacity="0.2" />
      </svg>
    ),
  },
};

interface Props {
  types: ContentType[];
  selected: ContentType | null;
  onSelect: (type: ContentType) => void;
}

export default function ContentTypeSelector({ types, selected, onSelect }: Props) {
  return (
    <div className="relative w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] mx-auto">
      {/* Surprise me — ? in the center */}
      <button
        onClick={() => onSelect(types[Math.floor(Math.random() * types.length)])}
        className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/80 bg-white/40 hover:bg-white/70 hover:border-[#d4cee6] hover:shadow-lg hover:shadow-purple-50/40 transition-all duration-500 active:scale-95 z-10"
        title="Surprise me"
      >
        {/* Sparkles around the ? */}
        <svg className="absolute w-[100px] h-[100px] text-[#c4b5fd]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path className="opacity-40 group-hover:opacity-80 transition-opacity duration-500" d="M14 14 L14 8 M11 11 L17 11" />
          <path className="opacity-35 group-hover:opacity-75 transition-opacity duration-500" d="M86 14 L86 8 M83 11 L89 11" />
          <path className="opacity-30 group-hover:opacity-70 transition-opacity duration-500" d="M14 86 L14 80 M11 83 L17 83" />
          <path className="opacity-35 group-hover:opacity-75 transition-opacity duration-500" d="M86 86 L86 80 M83 83 L89 83" />
          <circle cx="6" cy="50" r="1.5" fill="currentColor" className="opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
          <circle cx="94" cy="50" r="1.5" fill="currentColor" className="opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
          <circle cx="50" cy="6" r="1.5" fill="currentColor" className="opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
          <circle cx="50" cy="94" r="1.5" fill="currentColor" className="opacity-30 group-hover:opacity-60 transition-opacity duration-500" />
        </svg>
        <span className="text-[24px] font-light text-[#b0a8c4] group-hover:text-[#8b5cf6] transition-colors duration-300">?</span>
      </button>

      {types.map((type, index) => {
        const entry = CONTENT_TYPE_MAP[type];
        if (!entry) return null;
        const { label, icon } = entry;
        const isSelected = selected === type;
        const total = types.length;
        // Arrange in circle: start from top (-90deg), distribute evenly
        const angle = ((index / total) * 360 - 90) * (Math.PI / 180);
        const radius = 46; // percentage from center
        const cx = 50 + Math.cos(angle) * radius;
        const cy = 50 + Math.sin(angle) * radius;

        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`group absolute w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] flex flex-col items-center justify-center gap-2 rounded-3xl border-2 transition-all duration-500 active:scale-95 -translate-x-1/2 -translate-y-1/2 ${
              isSelected
                ? 'border-[#c4b5fd] bg-white/90 shadow-xl shadow-purple-100/60 scale-[1.08]'
                : 'border-[#e8e3f3]/80 bg-white/40 hover:bg-white/70 hover:border-[#d4cee6] hover:shadow-lg hover:shadow-purple-50/40'
            }`}
            style={{
              left: `${cx}%`,
              top: `${cy}%`,
            }}
          >
            <span className={`transition-all duration-500 scale-75 sm:scale-90 ${
              isSelected ? 'text-[#a78bfa] scale-90 sm:scale-100' : 'text-[#c8c2d6] group-hover:text-[#b0a8c4]'
            }`}>
              {icon}
            </span>
            <span className={`text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-light transition-colors duration-500 ${
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
