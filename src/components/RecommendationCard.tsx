'use client';

import { useState } from 'react';
import { Recommendation } from '@/types/index';

const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  youtube: 'YouTube',
  anime: 'Anime',
};

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-[#f3f0ff] text-[#7c3aed] border-[#c4b5fd]',
  tv: 'bg-[#f0f7ef] text-[#6b9a65] border-[#a7c4a0]',
  youtube: 'bg-[#fef2f2] text-[#dc2626] border-[#fca5a5]',
  anime: 'bg-[#f5f3ff] text-[#8b5cf6] border-[#c4b5fd]',
};

interface Props {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation }: Props) {
  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, imageUrls, actors, year, episodeInfo } = recommendation;
  const [currentImg, setCurrentImg] = useState(0);

  const allImages = [
    ...(thumbnailUrl ? [thumbnailUrl] : []),
    ...(imageUrls ?? []),
  ];

  return (
    <div className="rounded-2xl border-2 border-[#e9e4f5] bg-white overflow-hidden shadow-sm">
      {/* Image carousel */}
      {allImages.length > 0 && (
        <div className="relative">
          <div className="h-48 sm:h-56 w-full overflow-hidden bg-[#f5f3ff]">
            <img
              src={allImages[currentImg]}
              alt={title}
              className="h-full w-full object-cover transition-opacity duration-300"
            />
          </div>
          {allImages.length > 1 && (
            <>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImg(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentImg ? 'bg-white scale-110 shadow' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
              {/* Arrows */}
              <button
                onClick={() => setCurrentImg(i => (i - 1 + allImages.length) % allImages.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-[#2d2640] transition-all text-sm"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentImg(i => (i + 1) % allImages.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-[#2d2640] transition-all text-sm"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#2d2640] leading-tight">{title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {TYPE_LABELS[type] ?? type}
            </span>
            {year && <span className="text-xs text-[#7c7291]">{year}</span>}
            {episodeInfo && (
              <span className="rounded-full border border-[#c4b5fd] bg-[#f5f3ff] px-3 py-0.5 text-xs text-[#8b5cf6]">
                {episodeInfo}
              </span>
            )}
          </div>
        </div>

        {/* Actors */}
        {actors && actors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#7c7291]">Starring</span>
            {actors.map((actor, i) => (
              <span key={i} className="text-xs text-[#2d2640] bg-[#f5f3ff] border border-[#e9e4f5] px-2 py-0.5 rounded-full">
                {actor}
              </span>
            ))}
          </div>
        )}

        {description && (
          <p className="text-sm text-[#7c7291] leading-relaxed">{description}</p>
        )}

        <div className="rounded-xl border border-[#d4e6d1] bg-[#f6faf5] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6b9a65] mb-1.5">Why this fits your vibe</p>
          <p className="text-sm italic text-[#4a7044] leading-relaxed">{reasoning}</p>
        </div>

        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#8b5cf6] px-6 py-3 font-semibold text-white transition-all hover:bg-[#7c3aed] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd] text-sm"
        >
          {actionLabel}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
