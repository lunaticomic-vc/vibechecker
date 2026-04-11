'use client';

import { useState, useRef, useEffect } from 'react';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
import RatingSelector from '@/components/RatingSelector';
import StatusDragProvider, { useDragStatus } from '@/components/StatusDragOverlay';
import GlassTabs from '@/components/GlassTabs';
import { useAuth } from '@/components/AuthProvider';
import LoadingMouse from '@/components/LoadingMouse';

type StatusGroup = 'Todo' | 'In Progress' | 'On Hold' | 'Completed';

const PROGRESS_STATUS_MAP: Record<WatchProgress['status'], StatusGroup> = {
  todo: 'Todo',
  watching: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  dropped: 'Completed',
};

const SECTION_ORDER: StatusGroup[] = ['Todo', 'In Progress', 'On Hold', 'Completed'];
const statusGroupToApi: Record<StatusGroup, string> = { 'Todo': 'todo', 'In Progress': 'watching', 'On Hold': 'on_hold', 'Completed': 'completed' };

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

interface ArticleRowProps {
  fav: Favorite;
  ratingsMap: Record<number, { rating: RatingValue; reasoning?: string }>;
  getCurrentStatus: (fav: Favorite) => string;
  onStatusChange: (favoriteId: number, newStatus: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onRate: (favoriteId: number, rating: RatingValue, reasoning?: string) => void;
  isOwner: boolean;
}

function ArticleRow({ fav, ratingsMap, getCurrentStatus, onStatusChange, onDelete, onRate, isOwner }: ArticleRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const { startDrag } = useDragStatus();
  const status = getCurrentStatus(fav);
  const rating = ratingsMap[fav.id];

  function handleClick() {
    if (!fav.external_id) return;
    if (status === 'todo') onStatusChange(fav.id, 'watching');
    window.open(fav.external_id, '_blank');
  }

  function handlePointerDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    holdTimer.current = setTimeout(() => {
      startDrag(fav.id, fav.title, status, x, y);
    }, 500);
  }

  function handlePointerUp() {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }

  return (
    <div
      className="flex items-center gap-3 bg-white border-2 border-[#e9e4f5] rounded-xl px-4 py-3 hover:border-[#c4b5fd] transition-colors group select-none"
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {fav.external_id ? (
            <button onClick={handleClick} className="text-sm font-medium text-[#2d2640] hover:text-[#7c3aed] hover:underline truncate text-left">
              {fav.title}
            </button>
          ) : (
            <p className="text-sm font-medium text-[#2d2640] truncate">{fav.title}</p>
          )}
        </div>
        {fav.external_id && (
          <p className="text-[10px] text-[#b0a8c4] mt-0.5 truncate">{extractDomain(fav.external_id)}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isOwner && status !== 'todo' && rating && (
          <RatingSelector favoriteId={fav.id} currentRating={rating.rating} currentReasoning={rating.reasoning} onRate={onRate} compact />
        )}
        {isOwner && (
        <button
          onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return; } onDelete(fav.id); }}
          onBlur={() => setConfirmDelete(false)}
          className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity ${
            confirmDelete ? 'bg-red-500 text-white opacity-100' : 'bg-[#f5f3ff] text-[#7c7291] hover:bg-red-500 hover:text-white'
          }`}
        >
          {confirmDelete ? '!' : '×'}
        </button>
        )}
      </div>
    </div>
  );
}

export default function SubstackPage() {
  const { isOwner } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, { rating: RatingValue; reasoning?: string }>>({});
  const [progressMap, setProgressMap] = useState<Record<number, WatchProgress>>({});
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusGroup>('Todo');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');
  const [search, setSearch] = useState('');

  // Add form state
  const [url, setUrl] = useState('');
  const [fetchedTitle, setFetchedTitle] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [addError, setAddError] = useState('');

  async function fetchFavorites(currentOffset: number, append = false, status?: string) {
    const apiStatus = status ?? statusGroupToApi[activeTab];
    const res = await fetch(`/api/favorites?type=substack&status=${apiStatus}&limit=25&offset=${currentOffset}`);
    if (!res.ok) return;
    const data = await res.json();
    setFavorites(prev => append ? [...prev, ...data.favorites] : data.favorites);
    setHasMore(data.hasMore);
    setOffset(currentOffset + data.favorites.length);
  }

  async function fetchRatings() {
    const res = await fetch('/api/ratings');
    if (!res.ok) return;
    const data: Rating[] = await res.json();
    const map: Record<number, { rating: RatingValue; reasoning?: string }> = {};
    for (const r of data) map[r.favorite_id] = { rating: r.rating, reasoning: r.reasoning };
    setRatingsMap(map);
  }

  async function fetchProgress() {
    const res = await fetch('/api/progress');
    if (!res.ok) return;
    const data: WatchProgress[] = await res.json();
    const map: Record<number, WatchProgress> = {};
    for (const p of data) map[p.favorite_id] = p;
    setProgressMap(map);
  }

  useEffect(() => {
    Promise.all([fetchFavorites(0), fetchRatings(), fetchProgress()]).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function getGroup(fav: Favorite): StatusGroup {
    const progress = progressMap[fav.id];
    if (progress) return PROGRESS_STATUS_MAP[progress.status];
    return 'Todo';
  }

  function getCurrentStatus(fav: Favorite): string {
    return statusGroupToApi[getGroup(fav)];
  }

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite_id: favoriteId, status: newStatus }) });
    await fetchProgress();
  }

  async function handleUrlChange(val: string) {
    setUrl(val);
    setAddError('');
    setFetchedTitle('');

    const trimmed = val.trim();
    if (!trimmed) return;

    try { new URL(trimmed); } catch { return; }

    setFetchingTitle(true);
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) setFetchedTitle(data.title);
      }
    } catch (error) { console.warn('Failed to fetch article title', error); }
    setFetchingTitle(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) { setAddError('Link is required.'); return; }

    try { new URL(trimmedUrl); } catch { setAddError('Please enter a valid URL.'); return; }

    const title = fetchedTitle || new URL(trimmedUrl).pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || trimmedUrl;

    setAddLoading(true);
    setAddError('');
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'substack', title, external_id: trimmedUrl }),
    });
    if (!res.ok) {
      setAddError('Failed to add article.');
    } else {
      setUrl('');
      setFetchedTitle('');
      setShowAddForm(false);
      setLoading(true);
      await fetchFavorites(0);
      setLoading(false);
    }
    setAddLoading(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    setFavorites(prev => prev.filter(f => f.id !== id));
  }

  async function handleRate(favoriteId: number, rating: RatingValue, reasoning?: string) {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite_id: favoriteId, rating, reasoning }),
    });
    if (!res.ok) return;
    setRatingsMap(prev => ({ ...prev, [favoriteId]: { rating, reasoning } }));
  }

  const grouped = SECTION_ORDER.reduce<Record<StatusGroup, Favorite[]>>((acc, s) => {
    acc[s] = [];
    return acc;
  }, {} as Record<StatusGroup, Favorite[]>);

  for (const fav of favorites) {
    grouped[getGroup(fav)].push(fav);
  }

  const ratingOrder: Record<string, number> = { felt_things: 0, enjoyed: 1, watched: 2, not_my_thing: 3 };
  let activeItems: Favorite[] = grouped[activeTab] ?? [];
  if (search.trim()) {
    const q = search.toLowerCase();
    activeItems = activeItems.filter(f => f.title.toLowerCase().includes(q));
  }
  if (ratingFilter !== 'all' && activeTab !== 'Todo') {
    activeItems = activeItems.filter(f => ratingsMap[f.id]?.rating === ratingFilter);
  }
  if (activeTab !== 'Todo') {
    activeItems = [...activeItems].sort((a, b) => {
      const oa = ratingOrder[ratingsMap[a.id]?.rating] ?? 4;
      const ob = ratingOrder[ratingsMap[b.id]?.rating] ?? 4;
      return oa - ob;
    });
  }

  const inputClass = "bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd] w-full";

  return (
    <StatusDragProvider onStatusChange={handleStatusChange}>
    <div className="min-h-screen overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#2d2640]">Substack</h1>
          </div>
          {isOwner && (
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm"
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
          )}
        </div>

        {/* Add form — collapsed by default, link-only with auto-fetch title */}
        {isOwner && showAddForm && (
          <form onSubmit={handleAdd} className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5 mb-8 space-y-3">
            <h3 className="text-sm font-semibold text-[#2d2640]">Add Article</h3>
            <input
              type="url"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="Paste article link..."
              className={inputClass}
              autoFocus
            />
            {fetchingTitle && (
              <p className="text-[10px] text-[#b0a8c4]">Fetching title...</p>
            )}
            {fetchedTitle && (
              <p className="text-xs text-[#5a5270] bg-[#f5f3ff] rounded-lg px-3 py-2 border border-[#e9e4f5]">
                {fetchedTitle}
              </p>
            )}
            {addError && <p className="text-xs text-red-500">{addError}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-[#7c7291] hover:text-[#2d2640] transition-colors">Cancel</button>
              <button
                type="submit"
                disabled={addLoading || !url.trim()}
                className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40"
              >
                {addLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." aria-label="Search" className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-4" />

        <div className="mb-4">
          <GlassTabs tabs={SECTION_ORDER} active={activeTab} onChange={(tab) => { setActiveTab(tab); setOffset(0); fetchFavorites(0, false, statusGroupToApi[tab]); }} layoutId="substack-tab" />
        </div>

        {/* Rating filter — hidden on Todo tab */}
        {activeTab !== 'Todo' && (
          <div className="flex gap-1.5 mb-6 flex-wrap items-center">
            {(['all', 'felt_things', 'enjoyed', 'watched', 'not_my_thing'] as const).map(v => (
              <button key={v} onClick={() => setRatingFilter(v)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                  ratingFilter === v ? 'border-[#8b5cf6] bg-[#f5f3ff] text-[#7c3aed]' : 'border-[#e9e4f5] text-[#b0a8c4] hover:text-[#7c7291]'
                }`}>
                {v === 'all' ? 'all' : v === 'felt_things' ? '♡ felt things' : v === 'enjoyed' ? '✦ enjoyed' : v === 'watched' ? '◎ okayish' : '✕ not my thing'}
              </button>
            ))}
          </div>
        )}

        {loading || addLoading ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center">
            <LoadingMouse />
          </div>
        ) : (
          <div>
            {activeItems.length === 0 ? (
              <p className="text-center text-[#7c7291] py-16 text-sm">
                {activeTab === 'Todo' ? 'Nothing in your reading list. Add some articles!' : `No ${activeTab.toLowerCase()} articles.`}
              </p>
            ) : (
              <div className="space-y-2">
                {activeItems.map(fav => (
                  <ArticleRow key={fav.id} fav={fav} ratingsMap={ratingsMap} getCurrentStatus={getCurrentStatus} onStatusChange={handleStatusChange} onDelete={handleDelete} onRate={handleRate} isOwner={isOwner} />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => fetchFavorites(offset, true)}
                  className="px-6 py-2 text-sm border-2 border-[#e9e4f5] text-[#7c7291] hover:border-[#c4b5fd] hover:text-[#2d2640] rounded-lg transition-colors"
                >
                  Show more
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </StatusDragProvider>
  );
}
