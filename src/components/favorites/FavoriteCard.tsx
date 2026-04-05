'use client';

import { useState, useRef } from 'react';
import type { Favorite, RatingValue } from '@/types/index';
import RatingSelector from '@/components/RatingSelector';
import { useDragStatus } from '@/components/StatusDragOverlay';

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
  currentStatus?: string;
  showTypeLabel?: boolean;
  landscape?: boolean;
  onDelete: (id: number) => void;
  onRate: (favoriteId: number, rating: RatingValue, reasoning?: string) => void;
}

export default function FavoriteCard({ favorite, rating, currentStatus, showTypeLabel, landscape, onDelete, onRate }: FavoriteCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const didDrag = useRef(false);
  const { startDrag } = useDragStatus();

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    didDrag.current = false;
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    holdTimer.current = setTimeout(() => {
      didDrag.current = true;
      startDrag(favorite.id, favorite.title, currentStatus ?? 'todo', x, y);
    }, 500);
  }

  function handlePointerUp() {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }

  function handleClick() {
    if (!didDrag.current) setFlipped(f => !f);
  }

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onDelete(favorite.id);
  }

  return (
    <div
      className="perspective-[800px]"
      style={{ perspective: '800px' }}
    >
      <div
        className={`relative transition-transform duration-500 select-none `}
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : '' }}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
        onClick={handleClick}
      >
        {/* Front */}
        <div
          className="group bg-white border-2 border-[#e9e4f5] rounded-xl overflow-hidden hover:border-[#c4b5fd] hover:shadow-sm transition-colors"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={landscape ? 'aspect-video bg-[#f5f3ff] overflow-hidden' : 'aspect-[2/3] bg-[#f5f3ff] overflow-hidden'}>
            {favorite.image_url ? (
              <img
                src={favorite.image_url}
                alt={favorite.title}
                draggable={false}
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
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            onBlur={() => setConfirming(false)}
            className={`absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
              confirming
                ? 'bg-red-500 text-white opacity-100'
                : 'bg-white/80 text-[#7c7291] hover:bg-red-500 hover:text-white'
            }`}
            title={confirming ? 'Click again to confirm' : 'Delete'}
          >
            {confirming ? '!' : '×'}
          </button>

          <div className="p-2.5 flex-1 min-w-0">
            {showTypeLabel && (
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLORS[favorite.type]}`}>
                {TYPE_LABELS[favorite.type]}
              </span>
            )}
            <p className="text-xs font-medium text-[#2d2640] leading-snug line-clamp-2">{favorite.title}</p>
          </div>
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 bg-white border-2 border-[#c4b5fd] rounded-xl overflow-hidden p-3 flex flex-col gap-2 `}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs font-semibold text-[#2d2640] line-clamp-2">{favorite.title}</p>
          <div className="flex-1 overflow-y-auto">
            {currentStatus && currentStatus !== 'todo' && (
              <div onClick={e => e.stopPropagation()}>
                {rating ? (
                  <RatingSelector favoriteId={favorite.id} currentRating={rating.rating} currentReasoning={rating.reasoning} onRate={onRate} compact />
                ) : (
                  <RatingSelector favoriteId={favorite.id} onRate={onRate} />
                )}
              </div>
            )}
            {rating?.reasoning && (
              <p className="text-[10px] text-[#5a5270] mt-2 italic leading-relaxed">&ldquo;{rating.reasoning}&rdquo;</p>
            )}
            {(() => {
              if (!favorite.metadata) return null;
              try {
                const meta = JSON.parse(favorite.metadata);
                // Recommendation data
                if (meta?.source === 'recommendation') {
                  return (
                    <div className="mt-2 space-y-1.5">
                      {meta.description && <p className="text-[10px] text-[#5a5270] leading-relaxed">{meta.description}</p>}
                      {meta.reasoning && <p className="text-[10px] text-[#6b9a65] italic leading-relaxed">{meta.reasoning}</p>}
                      {meta.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {meta.interests.map((tag: string, i: number) => <span key={i} className="text-[8px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1 py-0.5 rounded-full">{tag}</span>)}
                        </div>
                      )}
                      {meta.actors?.length > 0 && <p className="text-[9px] text-[#b0a8c4]">{meta.actors.join(', ')}</p>}
                    </div>
                  );
                }
                // Plain notes in JSON
                if (meta?.notes) return <p className="text-[10px] text-[#5a5270] mt-2 leading-relaxed">{meta.notes}</p>;
              } catch {
                // Plain text notes (not JSON)
                return <p className="text-[10px] text-[#5a5270] mt-2 leading-relaxed">{favorite.metadata}</p>;
              }
              return null;
            })()}
            {!rating?.reasoning && !favorite.metadata && (
              <p className="text-[10px] text-[#b0a8c4] mt-2">No notes yet</p>
            )}
          </div>
          <p className="text-[9px] text-[#c8c2d6] text-center">tap to flip back</p>
        </div>
      </div>
    </div>
  );
}
