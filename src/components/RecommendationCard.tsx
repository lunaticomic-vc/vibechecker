'use client';

import { useState } from 'react';
import { Recommendation } from '@/types/index';

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-[#f3f0ff] text-[#7c3aed] border-[#c4b5fd]',
  tv: 'bg-[#f0f7ef] text-[#6b9a65] border-[#a7c4a0]',
  youtube: 'bg-[#fef2f2] text-[#dc2626] border-[#fca5a5]',
  anime: 'bg-[#f5f3ff] text-[#8b5cf6] border-[#c4b5fd]',
  substack: 'bg-[#fff7ed] text-[#c2410c] border-[#fdba74]',
};

async function autoAddToProgress(rec: Recommendation) {
  try {
    const favRes = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: rec.type,
        title: rec.title,
        image_url: rec.thumbnailUrl ?? rec.imageUrls?.[0],
        metadata: JSON.stringify({ year: rec.year, source: 'recommendation', description: rec.description, reasoning: rec.reasoning, interests: rec.interests, actors: rec.actors }),
      }),
    });
    const fav = await favRes.json();
    if (fav.id && rec.type !== 'youtube') {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite_id: fav.id, status: 'watching' }),
      });
    }
  } catch { /* best effort */ }
}

interface Props {
  recommendation: Recommendation;
  onAccept?: () => void;
}

type AccordionSection = 'description' | 'vibe' | 'reddit' | null;

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
      <div className={`transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-3 pb-3">
          <div className="text-[10px] text-[#5a5270] leading-relaxed min-h-[40px] max-h-[250px] overflow-y-auto scrollbar-thin">
            <span className="text-[9px] text-[#c4b5fd] font-medium">r/{current.subreddit}</span>
            <span className="text-[9px] text-[#d0cadc] ml-1">+{current.score}</span>
            <p className="mt-1">&ldquo;{current.comment}&rdquo;</p>
          </div>
          {insights.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => setIdx(i => (i - 1 + insights.length) % insights.length)} className="w-6 h-6 flex items-center justify-center rounded-full border border-[#e9e4f5] text-[#b0a8c4] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-colors text-xs">‹</button>
              <span className="text-[9px] text-[#c8c2d6]">{idx + 1}/{insights.length}</span>
              <button onClick={() => setIdx(i => (i + 1) % insights.length)} className="w-6 h-6 flex items-center justify-center rounded-full border border-[#e9e4f5] text-[#b0a8c4] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-colors text-xs">›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Poster image that expands on hover to full official proportions
function PosterImage({ src, alt }: { src: string; alt: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative cursor-pointer transition-all duration-500 ease-out"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{ zIndex: expanded ? 30 : 5 }}
    >
      <img
        src={src}
        alt={alt}
        className="rounded-2xl border-2 border-[#e9e4f5] object-cover shadow-sm transition-all duration-500 ease-out"
        style={{
          width: expanded ? '300px' : '180px',
          height: expanded ? 'auto' : '180px',
          objectFit: expanded ? 'contain' : 'cover',
          boxShadow: expanded ? '0 20px 60px rgba(0,0,0,0.15), 0 0 40px rgba(196,181,253,0.2)' : '0 4px 15px rgba(0,0,0,0.04)',
          borderColor: expanded ? 'rgba(196,181,253,0.5)' : 'rgba(233,228,245,0.5)',
        }}
      />
    </div>
  );
}

// Screencap circle that floats
function ScreencapCard({ src, alt, width, delay }: { src: string; alt: string; width: number; delay: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="transition-all duration-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: hovered ? width * 1.1 : width,
        animation: `floatBob ${3 + delay}s ease-in-out infinite`,
        animationDelay: `${delay * 0.5}s`,
        zIndex: hovered ? 20 : 5,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto rounded-2xl object-cover border-2 transition-all duration-500"
        style={{
          borderColor: hovered ? 'rgba(196,181,253,0.6)' : 'rgba(233,228,245,0.4)',
          boxShadow: hovered ? '0 0 40px rgba(196,181,253,0.35), 0 8px 25px rgba(0,0,0,0.06)' : '0 4px 15px rgba(0,0,0,0.04)',
        }}
      />
    </div>
  );
}

export default function RecommendationCard({ recommendation, onAccept }: Props) {
  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, imageUrls, actors, year, episodeInfo, redditInsights, interests } = recommendation;
  const [openSection, setOpenSection] = useState<AccordionSection>('description');

  const isYouTube = type === 'youtube';
  const isSubstack = type === 'substack';
  const showImages = !isSubstack;

  // Poster = thumbnailUrl (first), screencaps = imageUrls (rest)
  const screencaps = showImages ? (imageUrls ?? []).filter(u => !u.startsWith('gradient:')) : [];
  const poster = showImages ? thumbnailUrl : undefined;

  function toggleSection(section: AccordionSection) {
    setOpenSection(prev => prev === section ? null : section);
  }

  const chevron = (isOpen: boolean) => (
    <svg className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  async function handleWatch() {
    await autoAddToProgress(recommendation);
    if (onAccept) onAccept();
    window.open(actionUrl, '_blank');
  }

  // YouTube: stacked with thumbnail
  if (isYouTube) {
    return (
      <div className="relative z-10 flex flex-col gap-3 max-w-[360px] mx-auto">
        {thumbnailUrl && (
          <div onClick={handleWatch} className="cursor-pointer group">
            <div className="rounded-xl overflow-hidden border-2 border-[#e9e4f5] hover:border-[#c4b5fd] transition-all shadow-sm hover:shadow-md">
              <img src={thumbnailUrl} alt={title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          </div>
        )}
        <div className="rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-4 flex flex-col gap-2">
          <h2 className="text-base font-bold text-[#2d2640] leading-tight">{title}</h2>
          {interests && interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {interests.map((tag, i) => <span key={i} className="text-[9px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{tag}</span>)}
            </div>
          )}
          <div className="flex flex-col gap-1">
            {description && (
              <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
                <button onClick={() => toggleSection('description')} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#7c7291] hover:bg-[#faf8ff] transition-colors">About {chevron(openSection === 'description')}</button>
                <div className={`overflow-hidden transition-all duration-300 ${openSection === 'description' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-3 pb-2 text-xs text-[#5a5270] leading-relaxed">{description}</p>
                </div>
              </div>
            )}
            <div className="rounded-lg border border-[#d4e6d1] overflow-hidden">
              <button onClick={() => toggleSection('vibe')} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6b9a65] hover:bg-[#f6faf5] transition-colors">Why this fits {chevron(openSection === 'vibe')}</button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === 'vibe' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-3 pb-2 text-xs italic text-[#4a7044] leading-relaxed">{reasoning}</p>
              </div>
            </div>
          </div>
          <button onClick={handleWatch} className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-4 py-2 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs">
            Watch
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>
      </div>
    );
  }

  // Substack: no images, just card
  if (isSubstack) {
    return (
      <div className="relative z-10 rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-5 flex flex-col gap-3 max-w-[360px] mx-auto">
        <h2 className="text-lg font-bold text-[#2d2640] leading-tight">{title}</h2>
        {description && <p className="text-xs text-[#5a5270] leading-relaxed">{description}</p>}
        <button onClick={handleWatch} className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs">
          Read on Substack
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </button>
      </div>
    );
  }

  // Movie/TV/Anime: poster + screencap circles + card
  return (
    <>
      {/* Images: poster top-left, screencaps scattered */}
      {poster && (
        <div className="fixed z-[5] top-[12%] left-[4%]">
          <PosterImage src={poster} alt={`${title} poster`} />
        </div>
      )}
      {screencaps.map((src, i) => {
        const positions = [
          { top: '8%', right: '5%' },
          { bottom: '15%', left: '5%' },
          { bottom: '12%', right: '4%' },
        ];
        const pos = positions[i];
        if (!pos) return null;
        return (
          <div key={i} className="fixed z-[3]" style={pos}>
            <ScreencapCard src={src} alt={`${title} scene ${i + 1}`} width={280} delay={i} />
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
            {actors.map((actor, i) => <span key={i} className="text-[10px] text-[#5a5270] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{actor}</span>)}
          </div>
        )}
        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {interests.map((tag, i) => <span key={i} className="text-[9px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{tag}</span>)}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {description && (
            <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
              <button onClick={() => toggleSection('description')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#7c7291] hover:bg-[#faf8ff] transition-colors">About {chevron(openSection === 'description')}</button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === 'description' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}><p className="px-3 pb-3 text-xs text-[#5a5270] leading-relaxed">{description}</p></div>
            </div>
          )}
          <div className="rounded-lg border border-[#d4e6d1] overflow-hidden">
            <button onClick={() => toggleSection('vibe')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6b9a65] hover:bg-[#f6faf5] transition-colors">Why this fits {chevron(openSection === 'vibe')}</button>
            <div className={`overflow-hidden transition-all duration-300 ${openSection === 'vibe' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}><p className="px-3 pb-3 text-xs italic text-[#4a7044] leading-relaxed">{reasoning}</p></div>
          </div>
          {redditInsights && redditInsights.length > 0 && (
            <RedditCarousel insights={redditInsights} isOpen={openSection === 'reddit'} onToggle={() => toggleSection('reddit')} chevron={chevron} />
          )}
        </div>
        <button onClick={handleWatch} className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs">
          Watch
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes floatBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </>
  );
}
