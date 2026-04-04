'use client';

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

// Position circles on left and right sides of the card
function getCirclePositions(count: number): { x: number; y: number; side: 'left' | 'right' }[] {
  const positions: { x: number; y: number; side: 'left' | 'right' }[] = [
    { x: 0, y: 5, side: 'left' },
    { x: 0, y: 0, side: 'right' },
    { x: 0, y: 50, side: 'left' },
    { x: 0, y: 45, side: 'right' },
  ];
  return positions.slice(0, count);
}

export default function RecommendationCard({ recommendation }: Props) {
  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, imageUrls, actors, year, episodeInfo, redditInsights } = recommendation;

  const allImages = [
    ...(thumbnailUrl ? [thumbnailUrl] : []),
    ...(imageUrls ?? []),
  ];

  const circlePositions = getCirclePositions(allImages.length);

  return (
    <div className="relative w-full">
      {/* Floating image circles — left and right of card */}
      {allImages.map((src, i) => {
        const pos = circlePositions[i];
        if (!pos) return null;
        const sz = 130 + (i === 0 ? 20 : 0);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: pos.side === 'left' ? `-${sz / 2 + 20}px` : 'auto',
              right: pos.side === 'right' ? `-${sz / 2 + 20}px` : 'auto',
              top: `${pos.y}%`,
              zIndex: 5,
            }}
          >
            <FloatingCircle
              src={src}
              alt={`${title} ${i + 1}`}
              size={sz}
              initialX={0}
              initialY={0}
              delay={i * 0.8}
            />
          </div>
        );
      })}

      {/* Card content */}
      <div className="relative z-10 rounded-2xl border-2 border-[#e9e4f5] bg-white/90 backdrop-blur-sm p-5 flex flex-col gap-2.5" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'hidden' }}>
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

        {description && (
          <p className="text-xs text-[#7c7291] leading-relaxed line-clamp-2">{description}</p>
        )}

        <div className="rounded-lg border border-[#d4e6d1] bg-[#f6faf5] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[#6b9a65] mb-1">why this fits</p>
          <p className="text-xs italic text-[#4a7044] leading-relaxed line-clamp-3">{reasoning}</p>
        </div>

        {redditInsights && redditInsights.length > 0 && (
          <div className="rounded-lg border border-[#e9e4f5] bg-[#faf8ff] p-3">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[#b0a8c4] mb-1.5">what people say</p>
            {redditInsights.slice(0, 2).map((insight, i) => (
              <div key={i} className="text-[10px] text-[#5a5270] leading-relaxed mb-1 last:mb-0">
                <span className="text-[9px] text-[#c4b5fd]">r/{insight.subreddit}</span>
                {' '}&ldquo;{insight.comment.length > 120 ? insight.comment.substring(0, 120) + '...' : insight.comment}&rdquo;
              </div>
            ))}
          </div>
        )}

        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] text-xs"
        >
          {actionLabel}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
