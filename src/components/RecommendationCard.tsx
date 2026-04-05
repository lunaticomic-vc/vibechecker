'use client';

import { useState } from 'react';
import { Recommendation } from '@/types/index';
import FloatingCircle from '@/components/FloatingCircle';

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-[#f3f0ff] text-[#7c3aed] border-[#c4b5fd]',
  tv: 'bg-[#f0f7ef] text-[#6b9a65] border-[#a7c4a0]',
  youtube: 'bg-[#fef2f2] text-[#dc2626] border-[#fca5a5]',
  anime: 'bg-[#f5f3ff] text-[#8b5cf6] border-[#c4b5fd]',
};

interface Props {
  recommendation: Recommendation;
}

type AccordionSection = 'description' | 'vibe' | 'reddit' | 'interests' | null;

const CIRCLE_LAYOUT = [
  { top: '10%', left: '4%', size: 180 },
  { bottom: '10%', left: '6%', size: 170 },
  { top: '8%', right: '4%', size: 175 },
  { bottom: '12%', right: '5%', size: 180 },
];

function RedditCarousel({ insights, isOpen, onToggle, chevron }: {
  insights: { subreddit: string; comment: string; score: number }[];
  isOpen: boolean;
  onToggle: () => void;
  chevron: (open: boolean) => React.ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const current = insights[idx];
  if (!current) return null;

  return (
    <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4] hover:bg-[#faf8ff] transition-colors">
        What people say {chevron(isOpen)}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-3 pb-3">
          <div className="text-[10px] text-[#5a5270] leading-relaxed min-h-[40px]">
            <span className="text-[9px] text-[#c4b5fd] font-medium">r/{current.subreddit}</span>
            <span className="text-[9px] text-[#d0cadc] ml-1">+{current.score}</span>
            <p className="mt-1">&ldquo;{current.comment.length > 200 ? current.comment.substring(0, 200) + '...' : current.comment}&rdquo;</p>
          </div>
          {insights.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => setIdx(i => (i - 1 + insights.length) % insights.length)}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-[#e9e4f5] text-[#b0a8c4] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-colors text-xs">‹</button>
              <span className="text-[9px] text-[#c8c2d6]">{idx + 1}/{insights.length}</span>
              <button onClick={() => setIdx(i => (i + 1) % insights.length)}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-[#e9e4f5] text-[#b0a8c4] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-colors text-xs">›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecommendationCard({ recommendation }: Props) {
  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, imageUrls, actors, year, episodeInfo, redditInsights, interests } = recommendation;
  const [openSection, setOpenSection] = useState<AccordionSection>(null);

  const isYouTube = type === 'youtube';
  const allImages = isYouTube ? [] : [
    ...(thumbnailUrl ? [thumbnailUrl] : []),
    ...(imageUrls ?? []),
  ];

  function toggleSection(section: AccordionSection) {
    setOpenSection(prev => prev === section ? null : section);
  }

  const chevron = (isOpen: boolean) => (
    <svg className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  // YouTube: side-by-side layout with thumbnail
  if (isYouTube) {
    return (
      <div className="relative z-10 flex gap-4 items-start max-w-[480px] mx-auto">
        {/* YouTube thumbnail — rectangular */}
        {thumbnailUrl && (
          <a href={actionUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 group">
            <div className="w-[200px] rounded-xl overflow-hidden border-2 border-[#e9e4f5] hover:border-[#c4b5fd] transition-all shadow-sm hover:shadow-md">
              <img src={thumbnailUrl} alt={title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          </a>
        )}

        {/* Card */}
        <div className="flex-1 rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-4 flex flex-col gap-2">
          <h2 className="text-base font-bold text-[#2d2640] leading-tight">{title}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS.youtube}`}>youtube</span>
          </div>

          {/* Interests tags */}
          {interests && interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {interests.map((tag, i) => (
                <span key={i} className="text-[9px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Accordion */}
          <div className="flex flex-col gap-1">
            {description && (
              <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
                <button onClick={() => toggleSection('description')} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#7c7291] hover:bg-[#faf8ff] transition-colors">
                  About {chevron(openSection === 'description')}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openSection === 'description' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-3 pb-2 text-xs text-[#5a5270] leading-relaxed">{description}</p>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-[#d4e6d1] overflow-hidden">
              <button onClick={() => toggleSection('vibe')} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6b9a65] hover:bg-[#f6faf5] transition-colors">
                Why this fits {chevron(openSection === 'vibe')}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === 'vibe' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-3 pb-2 text-xs italic text-[#4a7044] leading-relaxed">{reasoning}</p>
              </div>
            </div>
          </div>

          <a href={actionUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-4 py-2 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs">
            Watch on YouTube
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  // Movie/TV/Anime: centered card with floating circles
  return (
    <>
      {/* Floating image circles */}
      {allImages.map((src, i) => {
        const layout = CIRCLE_LAYOUT[i];
        if (!layout) return null;
        return (
          <div key={i} className="fixed z-[3]" style={{ top: layout.top, left: layout.left, right: layout.right, bottom: layout.bottom }}>
            <FloatingCircle src={src} alt={`${title} ${i === 0 ? 'poster' : `scene ${i}`}`} size={layout.size} initialX={0} initialY={0} delay={i * 0.6} />
          </div>
        );
      })}

      {/* Card */}
      <div className="relative z-10 rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-5 flex flex-col gap-3 max-w-[320px] mx-auto">
        <div>
          <h2 className="text-lg font-bold text-[#2d2640] leading-tight">{title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[type] ?? ''}`}>{type}</span>
            {year && <span className="text-[10px] text-[#7c7291]">{year}</span>}
            {episodeInfo && <span className="rounded-full border border-[#c4b5fd] bg-[#f5f3ff] px-2.5 py-0.5 text-[10px] text-[#8b5cf6]">{episodeInfo}</span>}
          </div>
        </div>

        {actors && actors.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[9px] tracking-widest uppercase text-[#c8c2d6]">starring</span>
            {actors.map((actor, i) => (
              <span key={i} className="text-[10px] text-[#5a5270] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{actor}</span>
            ))}
          </div>
        )}

        {/* Interests */}
        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interests.map((tag, i) => (
              <span key={i} className="text-[9px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {/* Accordion */}
        <div className="flex flex-col gap-1">
          {description && (
            <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
              <button onClick={() => toggleSection('description')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#7c7291] hover:bg-[#faf8ff] transition-colors">
                About {chevron(openSection === 'description')}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === 'description' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-3 pb-3 text-xs text-[#5a5270] leading-relaxed">{description}</p>
              </div>
            </div>
          )}
          <div className="rounded-lg border border-[#d4e6d1] overflow-hidden">
            <button onClick={() => toggleSection('vibe')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6b9a65] hover:bg-[#f6faf5] transition-colors">
              Why this fits {chevron(openSection === 'vibe')}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openSection === 'vibe' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="px-3 pb-3 text-xs italic text-[#4a7044] leading-relaxed">{reasoning}</p>
            </div>
          </div>
          {redditInsights && redditInsights.length > 0 && (
            <RedditCarousel insights={redditInsights} isOpen={openSection === 'reddit'} onToggle={() => toggleSection('reddit')} chevron={chevron} />
          )}
        </div>

        <a href={actionUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs">
          {actionLabel}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </>
  );
}
