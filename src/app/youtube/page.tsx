'use client';

import { useState, useEffect } from 'react';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import StatusDragProvider from '@/components/StatusDragOverlay';
import GlassTabs from '@/components/GlassTabs';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
import { useIsOwner } from '@/lib/useIsOwner';
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

export default function YouTubePage() {
  const isOwner = useIsOwner();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, { rating: RatingValue; reasoning?: string }>>({});
  const [progressMap, setProgressMap] = useState<Record<number, WatchProgress>>({});
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusGroup>('Todo');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');
  const [search, setSearch] = useState('');

  // Add form state
  const [addUrl, setAddUrl] = useState('');
  const [fetchedTitle, setFetchedTitle] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [addError, setAddError] = useState('');

  async function fetchFavorites(currentOffset: number, append = false, status?: string) {
    const apiStatus = status ?? statusGroupToApi[activeTab];
    const res = await fetch(`/api/favorites?type=youtube&status=${apiStatus}&limit=25&offset=${currentOffset}`);
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
    setAddUrl(val);
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
    } catch (error) { console.warn('Failed to fetch YouTube video title', error); }
    setFetchingTitle(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = addUrl.trim();
    if (!trimmedUrl) { setAddError('Link is required.'); return; }

    try { new URL(trimmedUrl); } catch { setAddError('Please enter a valid URL.'); return; }

    const title = fetchedTitle || new URL(trimmedUrl).pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || trimmedUrl;

    setAddLoading(true);
    setAddError('');
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'youtube', title, external_id: trimmedUrl }),
    });
    if (!res.ok) {
      setAddError('Failed to add.');
    } else {
      setAddUrl('');
      setFetchedTitle('');
      setShowAdd(false);
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
            <h1 className="text-2xl font-semibold text-[#2d2640]">YouTube</h1>
          </div>
          {isOwner && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm"
          >
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
          )}
        </div>

        {/* Add form — collapsed by default */}
        {isOwner && showAdd && (
          <form onSubmit={handleAdd} className="mb-8 bg-white border-2 border-[#e9e4f5] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#2d2640]">Add Video</h3>
            <input
              type="url"
              value={addUrl}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="Paste YouTube link..."
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
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addLoading || !addUrl.trim()}
                className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40"
              >
                {addLoading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." aria-label="Search" className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-4" />

        <div className="mb-4">
          <GlassTabs tabs={SECTION_ORDER} active={activeTab} onChange={(tab) => { setActiveTab(tab); setOffset(0); fetchFavorites(0, false, statusGroupToApi[tab]); }} layoutId="youtube-tab" />
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
                {activeTab === 'Todo' ? 'Nothing in your watch list. Add some videos!' : `No ${activeTab.toLowerCase()} videos.`}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeItems.map(fav => (
                  <FavoriteCard
                    key={fav.id}
                    favorite={fav}
                    rating={ratingsMap[fav.id]}
                    currentStatus={getCurrentStatus(fav)}
                    landscape
                    isGuest={!isOwner}
                    onDelete={handleDelete}
                    onRate={handleRate}
                    onStatusChange={handleStatusChange}
                  />
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
