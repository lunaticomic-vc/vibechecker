'use client';

import { useState, useEffect } from 'react';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import AddFavoriteForm from '@/components/favorites/AddFavoriteForm';
import StatusDragProvider from '@/components/StatusDragOverlay';
import GlassTabs from '@/components/GlassTabs';

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

export default function MoviesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, { rating: RatingValue; reasoning?: string }>>({});
  const [progressMap, setProgressMap] = useState<Record<number, WatchProgress>>({});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusGroup>('Todo');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');
  const [search, setSearch] = useState('');

  async function fetchFavorites(currentOffset: number, append = false, status?: string) {
    const apiStatus = status ?? statusGroupToApi[activeTab];
    const res = await fetch(`/api/favorites?type=movie&status=${apiStatus}&limit=25&offset=${currentOffset}`);
    if (!res.ok) return;
    const data = await res.json();
    setFavorites(prev => append ? [...prev, ...data.favorites] : data.favorites);
    setTotal(data.total);
    setHasMore(data.hasMore);
    setOffset(currentOffset + data.favorites.length);
  }

  async function fetchRatings() {
    const res = await fetch('/api/ratings');
    if (!res.ok) return;
    const data: Rating[] = await res.json();
    const map: Record<number, { rating: RatingValue; reasoning?: string }> = {};
    for (const r of data) {
      map[r.favorite_id] = { rating: r.rating, reasoning: r.reasoning };
    }
    setRatingsMap(map);
  }

  async function fetchProgress() {
    const res = await fetch('/api/progress');
    if (!res.ok) return;
    const data: WatchProgress[] = await res.json();
    const map: Record<number, WatchProgress> = {};
    for (const p of data) {
      map[p.favorite_id] = p;
    }
    setProgressMap(map);
  }

  useEffect(() => {
    Promise.all([fetchFavorites(0), fetchRatings(), fetchProgress()]).finally(() => setLoading(false));
  }, []);

  function getGroup(fav: Favorite): StatusGroup {
    const progress = progressMap[fav.id];
    if (progress) return PROGRESS_STATUS_MAP[progress.status];
    if (fav.metadata) {
      try {
        const meta = JSON.parse(fav.metadata);
        if (meta.status) {
          return PROGRESS_STATUS_MAP[meta.status as WatchProgress['status']] ?? "Todo";
        }
      } catch { /* ignore */ }
    }
    return "Todo";
  }

  async function handleAdd(data: { type: string; title: string; metadata?: string }) {
    // Auto-fetch poster image from TMDB
    let image_url: string | undefined;
    try {
      const imgRes = await fetch(`/api/image?title=${encodeURIComponent(data.title)}&type=movie`);
      const imgData = await imgRes.json();
      if (imgData.image_url) image_url = imgData.image_url;
    } catch { /* best effort */ }

    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, image_url }),
    });
    if (!res.ok) return;
    setShowAddForm(false);
    setLoading(true);
    await fetchFavorites(0);
    setLoading(false);
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setFavorites(prev => prev.filter(f => f.id !== id));
    setTotal(prev => prev - 1);
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

  // Apply rating filter and sort

  function getCurrentStatus(fav: Favorite): string {
    return statusGroupToApi[getGroup(fav)];
  }

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite_id: favoriteId, status: newStatus }) });
    await fetchProgress();
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

  return (
    <StatusDragProvider onStatusChange={handleStatusChange}>
    <div className="min-h-screen bg-[#faf8ff] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#2d2640]">Movies</h1>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="mb-8">
            <AddFavoriteForm
              type="movie"
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-4"
        />

        {/* Status tabs + rating filter */}
        <div className="mb-4">
          <GlassTabs tabs={SECTION_ORDER} active={activeTab} onChange={(tab) => { setActiveTab(tab); setOffset(0); fetchFavorites(0, false, statusGroupToApi[tab]); }} layoutId="movies-tab" />
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

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#c4b5fd] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {activeItems?.length === 0 ? (
              <p className="text-center text-[#7c7291] py-16 text-sm">
                {activeTab === 'Todo' ? 'Nothing in your todo list. Add some!' : `No ${activeTab.toLowerCase()} movies.`}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeItems?.map(fav => (
                  <FavoriteCard
                    key={fav.id}
                    favorite={fav}
                    rating={ratingsMap[fav.id]}
                    currentStatus={getCurrentStatus(fav)}
                    onDelete={handleDelete}
                    onRate={handleRate}
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
