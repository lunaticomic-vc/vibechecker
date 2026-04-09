'use client';

import { useState } from 'react';
import type { ProgressWithFavorite } from '@/lib/progress';
import { useDragStatus } from '@/components/StatusDragOverlay';
import { TYPE_COLORS } from '@/lib/constants';
import { useLongPress } from '@/lib/hooks';
import { buildDirectLink } from '@/lib/external-links';

interface ProgressCardProps {
  item: ProgressWithFavorite;
  isGuest?: boolean;
  onUpdate: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-[#f0f4ff] text-[#4a6fa5] border border-[#bfdbfe]',
  watching: 'bg-[#f0f7ef] text-[#6b9a65] border border-[#a7c4a0]',
  completed: 'bg-[#f3f0ff] text-[#7c3aed] border border-[#c4b5fd]',
  dropped: 'bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]',
  on_hold: 'bg-[#fefce8] text-[#a16207] border border-[#fde68a]',
};

export default function ProgressCard({ item, isGuest, onUpdate }: ProgressCardProps) {
  const { startDrag } = useDragStatus();
  const { onPointerDown: handlePointerDown, onPointerUp: handlePointerUp } = useLongPress(
    (x, y) => startDrag(item.favorite_id, item.favorite_title, item.status, x, y)
  );
  const [editingTimestamp, setEditingTimestamp] = useState(false);
  const [timestampVal, setTimestampVal] = useState(item.stopped_at ?? '');
  const [fading, setFading] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(false);
  const [seasonVal, setSeasonVal] = useState(String(item.current_season));
  const [episodeVal, setEpisodeVal] = useState(String(item.current_episode));

  const progressPercent =
    item.total_episodes
      ? Math.round((item.current_episode / item.total_episodes) * 100)
      : null;

  async function patch(body: Record<string, unknown>) {
    const isStatusChange = body.status === 'dropped' || body.status === 'completed';
    if (isStatusChange) {
      setFading(body.status as string);
      await new Promise(r => setTimeout(r, 400));
    }
    await fetch(`/api/progress?id=${item.favorite_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    onUpdate();
  }

  return (
    <div
      className={`bg-white border-2 border-[#e9e4f5] rounded-xl overflow-hidden flex flex-col hover:border-[#c4b5fd] hover:shadow-sm transition-all select-none ${fading ? 'opacity-0 scale-95 duration-400' : 'opacity-100 scale-100'}`}
      style={fading ? { transition: 'opacity 0.4s, transform 0.4s' } : undefined}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-[#f5f3ff]">
        {item.favorite_image ? (
          <img src={item.favorite_image} alt={item.favorite_title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c4b5fd]">
            <svg width="40" height="40" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="36" cy="36" r="22" /><circle cx="36" cy="36" r="7" /><circle cx="36" cy="36" r="2.5" fill="currentColor" stroke="none" />
              <line x1="36" y1="14" x2="36" y2="29" /><line x1="36" y1="43" x2="36" y2="58" />
              <line x1="14" y1="36" x2="29" y2="36" /><line x1="43" y1="36" x2="58" y2="36" />
            </svg>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[item.favorite_type]}`}>
          {item.favorite_type.toUpperCase()}
        </span>
        <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        <a
          href={buildDirectLink(item.favorite_type, item.favorite_title, item.favorite_external_id)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          className="text-[#2d2640] font-semibold text-sm leading-tight line-clamp-2 hover:text-[#7c3aed] hover:underline transition-colors"
        >
          {item.favorite_title}
        </a>

        {/* Season/Episode for TV and Anime only */}
        {(item.favorite_type === 'tv' || item.favorite_type === 'anime') && (
          <>
            <div className="flex gap-3 items-center">
              <div className="text-center">
                {editingSeason ? (
                  <input
                    type="number"
                    value={seasonVal}
                    onChange={e => setSeasonVal(e.target.value)}
                    onBlur={() => { patch({ current_season: Number(seasonVal) || 1 }); setEditingSeason(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') { patch({ current_season: Number(seasonVal) || 1 }); setEditingSeason(false); } }}
                    className="w-10 text-xl font-bold text-[#2d2640] text-center bg-[#f5f3ff] border border-[#c4b5fd] rounded focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div className={`text-xl font-bold text-[#2d2640] ${!isGuest ? 'cursor-pointer hover:text-[#7c3aed]' : ''} transition-colors`} onClick={!isGuest ? () => setEditingSeason(true) : undefined}>{item.current_season}</div>
                )}
                <div className="text-[10px] text-[#7c7291]">Season</div>
              </div>
              <div className="text-[#c4b5fd] text-lg font-light">×</div>
              <div className="text-center">
                {editingEpisode ? (
                  <input
                    type="number"
                    value={episodeVal}
                    onChange={e => setEpisodeVal(e.target.value)}
                    onBlur={() => { patch({ current_episode: Number(episodeVal) || 1 }); setEditingEpisode(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') { patch({ current_episode: Number(episodeVal) || 1 }); setEditingEpisode(false); } }}
                    className="w-10 text-xl font-bold text-[#2d2640] text-center bg-[#f5f3ff] border border-[#c4b5fd] rounded focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <div className={`text-xl font-bold text-[#2d2640] ${!isGuest ? 'cursor-pointer hover:text-[#7c3aed]' : ''} transition-colors`} onClick={!isGuest ? () => setEditingEpisode(true) : undefined}>{item.current_episode}</div>
                )}
                <div className="text-[10px] text-[#7c7291]">Episode</div>
              </div>
              {item.total_episodes && (
                <div className="text-[#7c7291] text-[10px] self-end pb-0.5">/ {item.total_episodes}</div>
              )}
            </div>
            {progressPercent !== null && (
              <div className="w-full bg-[#e9e4f5] rounded-full h-1.5">
                <div className="bg-[#8b5cf6] h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            )}
          </>
        )}

        {/* Stopped at timestamp for movies/youtube */}
        {!isGuest && (item.favorite_type === 'movie' || item.favorite_type === 'youtube') && (
          <div className="text-xs text-[#7c7291]">
            {editingTimestamp ? (
              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  value={timestampVal}
                  onChange={e => setTimestampVal(e.target.value)}
                  placeholder="e.g. 1:23:45"
                  className="border border-[#e9e4f5] rounded px-1.5 py-0.5 text-[10px] text-[#2d2640] w-20 focus:outline-none focus:border-[#c4b5fd]"
                  onKeyDown={e => { if (e.key === 'Enter') { patch({ stopped_at: timestampVal || null }); setEditingTimestamp(false); } }}
                  autoFocus
                />
                <button onClick={() => { patch({ stopped_at: timestampVal || null }); setEditingTimestamp(false); }} className="text-[10px] text-[#8b5cf6] hover:text-[#7c3aed]">save</button>
              </div>
            ) : (
              <button onClick={() => setEditingTimestamp(true)} className="hover:text-[#7c3aed] transition-colors">
                {item.stopped_at ? <>at <span className="font-medium text-[#2d2640]">{item.stopped_at}</span></> : 'set timestamp'}
              </button>
            )}
          </div>
        )}

        {!isGuest && (
        <div className="flex gap-1.5 mt-auto pt-1">
          {(item.favorite_type === 'tv' || item.favorite_type === 'anime') && (
            <button onClick={() => patch({ current_episode: item.current_episode + 1 })} className="flex-1 text-[10px] bg-[#f5f3ff] hover:bg-[#e9e4f5] text-[#7c3aed] font-medium px-2 py-1.5 rounded-lg transition-colors">
              +1 Ep
            </button>
          )}
          <button onClick={() => patch({ status: 'completed' })} className="flex-1 text-[10px] bg-[#f0f7ef] hover:bg-[#d4e6d1] text-[#6b9a65] font-medium px-2 py-1.5 rounded-lg transition-colors">
            Done
          </button>
          <button onClick={() => patch({ status: 'dropped' })} className="flex-1 text-[10px] bg-[#fef2f2] hover:bg-[#fecaca] text-[#dc2626] font-medium px-2 py-1.5 rounded-lg transition-colors">
            Drop
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
