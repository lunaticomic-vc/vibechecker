'use client';

import { Recommendation } from '@/types/index';

const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  youtube: 'YouTube',
  anime: 'Anime',
};

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  tv: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  youtube: 'bg-red-500/20 text-red-300 border-red-500/30',
  anime: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

interface Props {
  recommendation: Recommendation;
}

export default function RecommendationCard({ recommendation }: Props) {
  const { title, type, description, reasoning, actionUrl, actionLabel, thumbnailUrl, year, episodeInfo } = recommendation;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-2xl shadow-black/40 transition-all hover:border-violet-500/30">
      {thumbnailUrl && (
        <div className="relative h-48 w-full overflow-hidden bg-black/30">
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
      )}

      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">{title}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${TYPE_COLORS[type] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                {TYPE_LABELS[type] ?? type}
              </span>
              {year && (
                <span className="text-xs text-gray-500">{year}</span>
              )}
              {episodeInfo && (
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-xs text-violet-300">
                  {episodeInfo}
                </span>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        )}

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2">Why this fits your vibe</p>
          <p className="text-sm italic text-violet-200/80 leading-relaxed">{reasoning}</p>
        </div>

        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 font-semibold text-white transition-all hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
