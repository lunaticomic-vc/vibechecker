'use client';

import { useEffect, useState } from 'react';
import { Recommendation, ResearchLink, KnowledgeChecklistItem } from '@/types/index';
import { TYPE_COLORS as BASE_TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';

// RecommendationCard needs border colors in addition to bg/text — extend with borders
const TYPE_COLORS: Record<string, string> = {
  movie: `${BASE_TYPE_COLORS.movie} border-[#c4b5fd]`,
  tv: `${BASE_TYPE_COLORS.tv} border-[#a7c4a0]`,
  youtube: `${BASE_TYPE_COLORS.youtube} border-[#fca5a5]`,
  anime: `${BASE_TYPE_COLORS.anime} border-[#c4b5fd]`,
  substack: `${BASE_TYPE_COLORS.substack} border-[#fdba74]`,
  kdrama: `${BASE_TYPE_COLORS.kdrama} border-[#f9a8d4]`,
  research: `bg-[#f0f4ff] text-[#3b5bdb] border-[#a5b4fc]`,
  poetry: `${BASE_TYPE_COLORS.poetry} border-[#f9a8d4]`,
  short_story: `${BASE_TYPE_COLORS.short_story} border-[#fcd34d]`,
  book: `${BASE_TYPE_COLORS.book} border-[#99f6e4]`,
  essay: `${BASE_TYPE_COLORS.essay} border-[#cbd5e1]`,
  podcast: `${BASE_TYPE_COLORS.podcast} border-[#fda4af]`,
};

const SOURCE_TYPE_ICONS: Record<ResearchLink['sourceType'], React.ReactNode> = {
  academic: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  video: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  ),
  article: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  community: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  book: (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  ),
};

const SOURCE_TYPE_LABELS: Record<ResearchLink['sourceType'], string> = {
  academic: 'Academic',
  video: 'Video',
  article: 'Article',
  community: 'Community',
  book: 'Book',
};

const DIFFICULTY_STYLES: Record<KnowledgeChecklistItem['difficulty'], string> = {
  beginner: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
  intermediate: 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]',
  advanced: 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]',
};

function ResearchCard({ recommendation }: { recommendation: Recommendation }) {
  const { title, description, researchLinks = [], knowledgeChecklist = [] } = recommendation;
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const grouped = researchLinks.reduce<Partial<Record<ResearchLink['sourceType'], ResearchLink[]>>>(
    (acc, link) => {
      if (!acc[link.sourceType]) acc[link.sourceType] = [];
      acc[link.sourceType]!.push(link);
      return acc;
    },
    {}
  );

  const sourceOrder: ResearchLink['sourceType'][] = ['academic', 'video', 'article', 'community', 'book'];
  const presentSources = sourceOrder.filter(s => grouped[s]?.length);

  return (
    <div className="relative z-10 rounded-2xl border-2 border-[#c7d2fe] bg-white/92 backdrop-blur-sm p-5 flex flex-col gap-4 max-w-[360px] mx-auto w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full border px-2.5 py-0.5 text-[10px] font-medium bg-[#f0f4ff] text-[#3b5bdb] border-[#a5b4fc]">research</span>
        </div>
        <h2 className="text-lg font-bold text-[#2d2640] leading-tight font-mono">{title}</h2>
        {description && <p className="mt-1.5 text-xs text-[#5a5270] leading-relaxed">{description}</p>}
      </div>

      {/* Links */}
      {presentSources.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4]">Resources</p>
          {presentSources.map(sourceType => (
            <div key={sourceType} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-[#a5b4fc]">
                {SOURCE_TYPE_ICONS[sourceType]}
                {SOURCE_TYPE_LABELS[sourceType]}
              </div>
              {grouped[sourceType]!.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-[#e9e4f5] bg-[#fafbff] hover:border-[#a5b4fc] hover:bg-[#f0f4ff] transition-colors p-2.5 flex flex-col gap-0.5"
                >
                  <span className="text-[11px] font-semibold text-[#3730a3] group-hover:underline leading-tight">{link.title}</span>
                  {link.description && <span className="text-[10px] text-[#6b7280] leading-snug">{link.description}</span>}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Knowledge checklist */}
      {knowledgeChecklist.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4]">Know your stuff</p>
          <div className="flex flex-col gap-1.5">
            {knowledgeChecklist.map((item, i) => (
              <label
                key={i}
                className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${checked[i] ? 'border-[#bbf7d0] bg-[#f0fdf4]' : 'border-[#e9e4f5] bg-[#fafbff] hover:border-[#c7d2fe]'}`}
              >
                <input
                  type="checkbox"
                  checked={checked[i] ?? false}
                  onChange={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="mt-0.5 shrink-0 accent-[#6366f1]"
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold ${checked[i] ? 'text-[#166534] line-through' : 'text-[#2d2640]'}`}>{item.concept}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${DIFFICULTY_STYLES[item.difficulty]}`}>{item.difficulty}</span>
                  </div>
                  {item.explanation && <span className="text-[10px] text-[#6b7280] leading-snug">{item.explanation}</span>}
                </div>
              </label>
            ))}
          </div>
          <p className="text-[9px] text-[#c8c2d6] text-center">
            {Object.values(checked).filter(Boolean).length}/{knowledgeChecklist.length} concepts explored
          </p>
        </div>
      )}
    </div>
  );
}

async function autoAddToProgress(rec: Recommendation) {
  try {
    const favRes = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: rec.type,
        title: rec.title,
        external_id: rec.actionUrl,
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

function RedditCarouselWithSpoilers({ insights, isOpen, onToggle, chevron }: {
  insights: { subreddit: string; comment: string; score: number }[];
  isOpen: boolean;
  onToggle: () => void;
  chevron: (open: boolean) => React.ReactNode;
}) {
  const [idx, setIdx] = useState(0);
  const [spoilerMap, setSpoilerMap] = useState<Record<number, boolean>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const current = insights[idx];
  if (!current) return null;

  const isSpoiler = spoilerMap[idx] === true;
  const isRevealed = revealed[idx] === true;

  async function checkSpoilers() {
    if (checked || checking) return;
    setChecking(true);
    try {
      const res = await fetch('/api/spoiler-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: insights.map(i => i.comment) }),
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<number, boolean> = {};
        (data.results ?? []).forEach((hasSpoiler: boolean, i: number) => { map[i] = hasSpoiler; });
        setSpoilerMap(map);
      }
    } catch { /* best effort */ }
    setChecking(false);
    setChecked(true);
  }

  function handleToggle() {
    onToggle();
    if (!isOpen && !checked) checkSpoilers();
  }

  return (
    <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
      <button onClick={handleToggle} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4] hover:bg-[#faf8ff] transition-colors">
        What people say {chevron(isOpen)}
      </button>
      <div className={`transition-all duration-300 ${isOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-3 pb-3">
          <div className="text-[10px] text-[#5a5270] leading-relaxed min-h-[40px] max-h-[250px] overflow-y-auto scrollbar-thin">
            <span className="text-[9px] text-[#c4b5fd] font-medium">r/{current.subreddit}</span>
            <span className="text-[9px] text-[#d0cadc] ml-1">+{current.score}</span>
            {checking ? (
              <p className="mt-1 text-[#b0a8c4] italic">checking for spoilers...</p>
            ) : isSpoiler && !isRevealed ? (
              <div className="mt-1">
                <p className="text-[#e57373] text-[9px] font-medium mb-1">may contain spoilers</p>
                <button
                  onClick={() => setRevealed(r => ({ ...r, [idx]: true }))}
                  className="text-[9px] text-[#7c3aed] hover:underline"
                >
                  show anyway
                </button>
              </div>
            ) : (
              <p className="mt-1">&ldquo;{current.comment}&rdquo;</p>
            )}
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
          width: expanded ? '420px' : '280px',
          height: expanded ? 'auto' : '320px',
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
        width: hovered ? width * 1.15 : width,
        animation: `floatBob ${3 + delay}s ease-in-out infinite`,
        animationDelay: `${delay * 0.5}s`,
        zIndex: hovered ? 20 : 5,
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-[38vh] rounded-2xl object-cover border-2 transition-all duration-500"
        style={{
          borderColor: hovered ? 'rgba(196,181,253,0.6)' : 'rgba(233,228,245,0.4)',
          boxShadow: hovered ? '0 0 40px rgba(196,181,253,0.35), 0 8px 25px rgba(0,0,0,0.06)' : '0 4px 15px rgba(0,0,0,0.04)',
        }}
      />
    </div>
  );
}

export default function RecommendationCard({ recommendation, onAccept }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionSection>('description');

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile) setOpenSection(null);
  }, []);

  if (recommendation.type === 'research') {
    return <ResearchCard recommendation={recommendation} />;
  }

  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, imageUrls, actors, year, episodeInfo, redditInsights, interests, tropes, channelName } = recommendation;

  const READING_TYPES = ['poetry', 'short_story', 'book', 'essay', 'podcast'];
  const isReadingType = READING_TYPES.includes(type);
  const isYouTube = type === 'youtube';
  const isSubstack = type === 'substack';
  const showImages = !isSubstack && !isReadingType;

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

  // Reading types (poetry, short_story, book, essay, podcast): simple card, no images
  if (isReadingType) {
    return (
      <div className="relative z-10 rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-5 flex flex-col gap-3 max-w-[360px] mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[type] ?? ''}`}>{TYPE_LABELS[type] ?? type}</span>
        </div>
        <h2 className="text-lg font-bold text-[#2d2640] leading-tight font-mono">{title}</h2>
        {description && <p className="text-xs text-[#5a5270] leading-relaxed">{description}</p>}
        {reasoning && <p className="text-xs italic text-[#4a7044] leading-relaxed">{reasoning}</p>}
        <button onClick={handleWatch} className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs">
          {actionLabel}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </button>
      </div>
    );
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
          <h2 className="text-base font-bold text-[#2d2640] leading-tight font-mono">{title}</h2>
          {interests && interests.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {interests.map((tag, i) => <span key={i} className="text-[9px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{tag}</span>)}
            </div>
          )}
          {channelName && (
            <p className="text-[11px] text-[#7c7291]">{channelName}</p>
          )}
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
        <h2 className="text-lg font-bold text-[#2d2640] leading-tight font-mono">{title}</h2>
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
      {/* Desktop: fixed positioned poster & screencaps */}
      {!isMobile && poster && (
        <div className="fixed z-[5] top-[12%] left-[4%]">
          <PosterImage src={poster} alt={`${title} poster`} />
        </div>
      )}
      {!isMobile && screencaps.slice(0, 2).map((src, i) => {
        const positions = [
          { top: '10%', right: '3%' },
          { bottom: '5%', right: '3%' },
        ];
        const pos = positions[i];
        if (!pos) return null;
        return (
          <div key={i} className="fixed z-[3] max-h-[38vh]" style={pos}>
            <ScreencapCard src={src} alt={`${title} scene ${i + 1}`} width={380} delay={i} />
          </div>
        );
      })}

      {/* Mobile: inline poster above card */}
      {isMobile && poster && (
        <div className="w-full max-w-[280px] mx-auto mb-3">
          <img
            src={poster}
            alt={`${title} poster`}
            className="w-full rounded-2xl border-2 border-[#e9e4f5] object-cover shadow-sm"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Card */}
      <div className="relative z-10 rounded-2xl border-2 border-[#e9e4f5] bg-white/92 backdrop-blur-sm p-5 flex flex-col gap-3 max-w-[320px] mx-auto">
        <div>
          <h2 className="text-lg font-bold text-[#2d2640] leading-tight font-mono">{title}</h2>
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
        {tropes && tropes.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[9px] tracking-widest uppercase text-[#c8c2d6]">tropes</span>
            {tropes.map((trope, i) => <span key={i} className="text-[10px] text-[#9a6db0] bg-[#faf5ff] border border-[#e9ddf5] px-1.5 py-0.5 rounded-full">{trope}</span>)}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {description && (
            <div className="rounded-lg border border-[#e9e4f5] overflow-hidden">
              <button onClick={() => toggleSection('description')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#7c7291] hover:bg-[#faf8ff] transition-colors">About {chevron(openSection === 'description')}</button>
              <div className={`overflow-hidden transition-all duration-300 ${openSection === 'description' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}><p className="px-3 pb-3 text-xs text-[#5a5270] leading-relaxed">{description}</p></div>
            </div>
          )}
          {reasoning && (
          <div className="rounded-lg border border-[#d4e6d1] overflow-hidden">
            <button onClick={() => toggleSection('vibe')} className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#6b9a65] hover:bg-[#f6faf5] transition-colors">Why this fits {chevron(openSection === 'vibe')}</button>
            <div className={`overflow-hidden transition-all duration-300 ${openSection === 'vibe' ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}><p className="px-3 pb-3 text-xs italic text-[#4a7044] leading-relaxed max-h-52 overflow-y-auto scrollbar-thin">{reasoning}</p></div>
          </div>
          )}
          {redditInsights && redditInsights.length > 0 && (
            <RedditCarouselWithSpoilers insights={redditInsights} isOpen={openSection === 'reddit'} onToggle={() => toggleSection('reddit')} chevron={chevron} />
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
