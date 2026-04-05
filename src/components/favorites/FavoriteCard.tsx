'use client';

import { useState } from 'react';
import type { Favorite, RatingValue } from '@/types/index';
import RatingSelector from '@/components/RatingSelector';

const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  anime: 'Anime',
  youtube: 'YouTube',
  substack: 'Substack',
};

const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-[#f3f0ff] text-[#7c3aed]',
  tv: 'bg-[#f0f7ef] text-[#6b9a65]',
  anime: 'bg-[#f5f3ff] text-[#8b5cf6]',
  youtube: 'bg-[#fef2f2] text-[#dc2626]',
  substack: 'bg-[#fff7ed] text-[#c2410c]',
};

interface FavoriteCardProps {
  favorite: Favorite;
  rating?: { rating: RatingValue; reasoning?: string };
  onDelete: (id: number) => void;
  onRate: (favoriteId: number, rating: RatingValue, reasoning?: string) => void;
}

export default function FavoriteCard({ favorite, rating, onDelete, onRate }: FavoriteCardProps) {
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete(favorite.id);
  }

  return (
    <div className="relative group bg-white border-2 border-[#e9e4f5] rounded-xl overflow-hidden hover:border-[#c4b5fd] hover:shadow-sm transition-all">
      {/* Thumbnail */}
      <div className="aspect-[2/3] bg-[#f5f3ff] overflow-hidden">
        {favorite.image_url ? (
          <img
            src={favorite.image_url}
            alt={favorite.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c4b5fd]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        onBlur={() => setConfirming(false)}
        className={`absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
          confirming
            ? 'bg-red-500 text-white opacity-100'
            : 'bg-white/80 text-[#7c7291] hover:bg-red-500 hover:text-white'
        }`}
        title={confirming ? 'Click again to confirm' : 'Delete'}
      >
        {confirming ? '!' : '×'}
      </button>

      {/* Info */}
      <div className="p-2.5">
        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLORS[favorite.type]}`}>
          {TYPE_LABELS[favorite.type]}
        </span>
        <p className="text-xs font-medium text-[#2d2640] leading-snug line-clamp-2">{favorite.title}</p>
        {rating && (
          <div className="mt-1.5">
            <RatingSelector favoriteId={favorite.id} currentRating={rating.rating} currentReasoning={rating.reasoning} onRate={onRate} compact />
          </div>
        )}
        {!rating && (
          <div className="mt-1.5">
            <RatingSelector favoriteId={favorite.id} onRate={onRate} />
          </div>
        )}
      </div>
    </div>
  );
}
