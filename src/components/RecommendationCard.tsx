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

type AccordionSection = 'description' | 'vibe' | 'reddit' | null;

// Positions for floating circles — spread around the page, not overlapping center card
// Using viewport-relative positioning
const CIRCLE_LAYOUT = [
  // Poster — top left, big
  { top: '3%', left: '3%', size: 160 },
  // Screencaps — scattered around edges
  { top: '5%', right: '5%', size: 140 },
  { bottom: '15%', left: '5%', size: 130 },
  { bottom: '10%', right: '3%', size: 145 },
  { top: '40%', left: '2%', size: 120 },
  { top: '35%', right: '2%', size: 125 },
];

export default function RecommendationCard({ recommendation }: Props) {
  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, imageUrls, actors, year, episodeInfo, redditInsights } = recommendation;
  const [openSection, setOpenSection] = useState<AccordionSection>(null);

  // First image is poster, rest are screencaps
  const allImages = [
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

  return (
    <>
      {/* Floating image circles — fixed positioned to fill the page, below nav z-index */}
      {allImages.map((src, i) => {
        const layout = CIRCLE_LAYOUT[i];
        if (!layout) return null;
        return (
          <div
            key={i}
            className="fixed z-[3]"
            style={{
              top: layout.top,
              left: layout.left,
              right: layout.right,
              bottom: layout.bottom,
            }}
          >
            <FloatingCircle
              src={src}
              alt={i === 0 ? `${title} poster` : `${title} scene ${i}`}
              size={layout.size}
              initialX={0}
              initialY={0}
              delay={i * 0.6}
            />
          </div>
        );
      })}

      {/* Card — centered, narrow, doesn't overlap circles */}
      <div className="relative z-10 rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-5 flex flex-col gap-3 max-w-[320px] mx-auto">
        <div>
          <h2 className="text-lg font-bold text-[#2d2640] leading-tight">{title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[type] ?? ''}`}>
              {type}
            </span>
            {year && <span className="text-[10px] text-[#7c7291]">{year}</span>}
            {episodeInfo && (
              <span className="rounded-full border border-[#c4b5fd] bg-[#f5f3ff] px-2.5 py-0.5 text-[10px] text-[#8b5cf6]">
                {episodeInfo}
              </span>
            )}
          </div>
        </div>

        {actors && actors.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[9px] tracking-widest uppercase text-[#c8c2d6]">starring</span>
            {actors.map((actor, i) => (
              <span key={i} className="text-[10px] text-[#5a5270] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">
                {actor}
              </span>
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
            <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
              <button onClick={() => toggleSection('reddit')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4] hover:bg-[#faf8ff] transition-colors">
                What people say {chevron(openSection === 'reddit')}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === 'reddit' ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-3 pb-3 flex flex-col gap-2">
                  {redditInsights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="text-[10px] text-[#5a5270] leading-relaxed">
                      <span className="text-[9px] text-[#c4b5fd] font-medium">r/{insight.subreddit}</span>
                      {' '}&ldquo;{insight.comment.length > 150 ? insight.comment.substring(0, 150) + '...' : insight.comment}&rdquo;
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
