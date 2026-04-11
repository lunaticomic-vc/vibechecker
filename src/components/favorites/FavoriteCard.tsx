'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Favorite, RatingValue } from '@/types/index';
import { parseFavoriteMetadata } from '@/types/index';
import RatingSelector from '@/components/RatingSelector';
import { useDragStatus } from '@/components/StatusDragOverlay';
import { TYPE_COLORS, TYPE_LABELS } from '@/lib/constants';
import { useLongPress } from '@/lib/hooks';
import Accordion from '@/components/Accordion';
import { buildDirectLink } from '@/lib/external-links';

interface FavoriteCardProps {
  favorite: Favorite;
  rating?: { rating: RatingValue; reasoning?: string };
  currentStatus?: string;
  showTypeLabel?: boolean;
  showDirectLink?: boolean;
  landscape?: boolean;
  isGuest?: boolean;
  onDelete: (id: number) => void;
  onRate: (favoriteId: number, rating: RatingValue, reasoning?: string) => void;
  onStatusChange?: (favoriteId: number, newStatus: string) => void;
}

type AccordionSection = 'about' | 'vibe' | 'rating' | 'reddit' | null;

export default function FavoriteCard({ favorite, rating, currentStatus, showTypeLabel, showDirectLink, landscape, isGuest, onDelete, onRate, onStatusChange }: FavoriteCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [cardOrigin, setCardOrigin] = useState({ x: 0, y: 0 });
  const clickLock = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { startDrag } = useDragStatus();
  const { onPointerDown: handlePointerDown, onPointerUp: handlePointerUp, didLongPress } = useLongPress(
    (x, y) => startDrag(favorite.id, favorite.title, currentStatus ?? 'todo', x, y),
    { preventDefault: true }
  );

  function handleClick() {
    if (clickLock.current) return;
    if (!didLongPress.current) {
      clickLock.current = true;
      setTimeout(() => { clickLock.current = false; }, 300);
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setCardOrigin({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
      setExpanded(true);
    }
  }

  function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    onDelete(favorite.id);
  }

  const meta = parseFavoriteMetadata(favorite.metadata);
  const isEnriched = meta !== null && 'source' in meta && (meta.source === 'recommendation' || meta.source === 'manual');
  const recMeta = isEnriched ? (meta as { source: string; description?: string; reasoning?: string; interests?: string[]; actors?: string[]; year?: string; redditInsights?: { subreddit: string; comment: string; score: number }[] }) : null;
  const plainNotes = meta !== null && 'notes' in meta ? meta.notes : undefined;

  const chevron = (open: boolean) => (
    <svg className={`w-3 h-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <>
      {/* Card */}
      <div
        ref={cardRef}
        className="select-none"
        onMouseDown={!expanded && !isGuest ? handlePointerDown : undefined}
        onMouseUp={!expanded && !isGuest ? handlePointerUp : undefined}
        onMouseLeave={!expanded && !isGuest ? handlePointerUp : undefined}
        onTouchStart={!expanded && !isGuest ? handlePointerDown : undefined}
        onTouchEnd={!expanded && !isGuest ? handlePointerUp : undefined}
        onClick={!expanded ? handleClick : undefined}
      >
        {expanded ? (
          /* Card back — shown in place while the detail overlay is open */
          <div className="bg-[#e9e4f5]/40 border-2 border-[#e9e4f5] rounded-xl overflow-hidden cursor-pointer" onClick={() => setExpanded(false)}>
            <div className={`${landscape ? 'aspect-video' : 'aspect-[2/3]'} flex items-center justify-center`}>
              <div className="w-12 h-12 rounded-full border-2 border-[#d4cee6] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#c4b5fd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-3-3m0 0l3-3m-3 3h12" />
                </svg>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium text-[#b0a8c4] leading-snug line-clamp-2">{favorite.title}</p>
            </div>
          </div>
        ) : (
          /* Card front */
          <div className="group bg-white border-2 border-[#e9e4f5] rounded-xl overflow-hidden hover:border-[#c4b5fd] hover:shadow-sm transition-colors cursor-pointer relative">
            <div className={landscape ? 'aspect-video bg-[#f5f3ff] overflow-hidden relative' : 'aspect-[2/3] bg-[#f5f3ff] overflow-hidden relative'}>
              {favorite.image_url ? (
                <img src={favorite.image_url} alt={favorite.title} draggable={false} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c4b5fd]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {/* Crown for "felt things" rated items */}
              {rating?.rating === 'felt_things' && (
                <div className="absolute top-1.5 left-1.5 z-10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                    <path d="M2 8l4 10h12l4-10-5 4-5-8-5 8-5-4z" fill="#b0a8c4" />
                    <circle cx="2" cy="8" r="1.5" fill="#b0a8c4" />
                    <circle cx="22" cy="8" r="1.5" fill="#b0a8c4" />
                    <circle cx="12" cy="4" r="1.5" fill="#b0a8c4" />
                    <circle cx="7" cy="12" r="1.5" fill="#b0a8c4" />
                    <circle cx="17" cy="12" r="1.5" fill="#b0a8c4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Delete */}
            {!isGuest && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              onBlur={() => setConfirming(false)}
              className={`absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
                confirming ? 'bg-red-500 text-white opacity-100' : 'bg-white/80 text-[#7c7291] hover:bg-red-500 hover:text-white'
              }`}
            >
              {confirming ? '!' : '×'}
            </button>
            )}

            <div className="p-2.5 flex-1 min-w-0">
              {showTypeLabel && (
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${TYPE_COLORS[favorite.type]}`}>
                  {TYPE_LABELS[favorite.type]}
                </span>
              )}
              {showDirectLink ? (
                <a
                  href={buildDirectLink(favorite.type, favorite.title, favorite.external_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                  className="text-xs font-medium text-[#2d2640] leading-snug line-clamp-2 hover:text-[#7c3aed] hover:underline transition-colors"
                >
                  {favorite.title}
                </a>
              ) : (
                <p className="text-xs font-medium text-[#2d2640] leading-snug line-clamp-2">{favorite.title}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded overlay */}
      <AnimatePresence>
      {expanded && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative z-[201] bg-white rounded-2xl border-2 border-[#e9e4f5] w-full max-w-sm shadow-xl overflow-hidden"
            initial={{
              rotateY: 180,
              scale: 0.3,
              opacity: 0,
              x: cardOrigin.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0),
              y: cardOrigin.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0),
            }}
            animate={{ rotateY: 0, scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{
              rotateY: -180,
              scale: 0.3,
              opacity: 0,
              x: cardOrigin.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0),
              y: cardOrigin.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0),
            }}
            transition={{ type: 'spring', stiffness: 250, damping: 22, mass: 0.8 }}
            style={{ perspective: '1200px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 space-y-3">
              {/* Title + type */}
              <div>
                <a
                  href={buildDirectLink(favorite.type, favorite.title, favorite.external_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-lg font-bold text-[#2d2640] leading-tight hover:text-[#7c3aed] hover:underline block"
                >
                  {favorite.title}
                </a>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[favorite.type]}`}>
                    {TYPE_LABELS[favorite.type]}
                  </span>
                  {recMeta?.year && <span className="text-[10px] text-[#7c7291]">{recMeta.year}</span>}
                </div>
              </div>

              {/* Interest tags */}
              {recMeta?.interests && recMeta.interests.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recMeta.interests.map((tag, i) => (
                    <span key={i} className="text-[9px] text-[#7c3aed] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* Actors */}
              {recMeta?.actors && recMeta.actors.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[9px] tracking-widest uppercase text-[#c8c2d6]">starring</span>
                  {recMeta.actors.map((actor, i) => (
                    <span key={i} className="text-[10px] text-[#5a5270] bg-[#f5f3ff] border border-[#e9e4f5] px-1.5 py-0.5 rounded-full">{actor}</span>
                  ))}
                </div>
              )}

              {/* About */}
              {(recMeta ? !!recMeta.description : !!plainNotes) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4] mb-1">About</p>
                  <p className="text-xs text-[#5a5270] leading-relaxed">
                    {recMeta ? recMeta.description : plainNotes}
                  </p>
                </div>
              )}

              {/* Why this fits */}
              {recMeta?.reasoning && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b9a65] mb-1">Why this fits</p>
                  <p className="text-xs italic text-[#4a7044] leading-relaxed">{recMeta.reasoning}</p>
                </div>
              )}

              {/* Reddit insights */}
              {recMeta?.redditInsights && recMeta.redditInsights.length > 0 && (
                <Accordion
                  isOpen={openSection === 'reddit'}
                  onToggle={() => setOpenSection(openSection === 'reddit' ? null : 'reddit')}
                  headerClassName="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4] mb-1"
                  header={<>Reddit {chevron(openSection === 'reddit')}</>}
                  contentClassName="space-y-2"
                >
                  {recMeta.redditInsights.map((insight, i) => (
                    <div key={i} className="bg-[#f5f3ff] rounded-lg p-2.5">
                      <p className="text-[10px] text-[#5a5270] leading-relaxed">{insight.comment}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-[#b0a8c4]">r/{insight.subreddit}</span>
                        <span className="text-[9px] text-[#b0a8c4]">{insight.score} pts</span>
                      </div>
                    </div>
                  ))}
                </Accordion>
              )}

              {/* Rating */}
              {currentStatus && currentStatus !== 'todo' && !isGuest && (
                <div onClick={e => e.stopPropagation()}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b0a8c4] mb-1">Rating</p>
                  <RatingSelector favoriteId={favorite.id} currentRating={rating?.rating} currentReasoning={rating?.reasoning} onRate={onRate} />
                  {rating?.reasoning && (
                    <p className="text-[10px] text-[#5a5270] mt-1.5 italic">&ldquo;{rating.reasoning}&rdquo;</p>
                  )}
                </div>
              )}

              {/* No info fallback */}
              {!isEnriched && !plainNotes && !rating?.reasoning && (
                <p className="text-[10px] text-[#b0a8c4]">No notes yet</p>
              )}

              {/* Close */}
              <button onClick={() => setExpanded(false)} className="w-full pt-2 text-xs text-[#c8c2d6] hover:text-[#7c7291] transition-colors">
                tap to close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </>
  );
}
