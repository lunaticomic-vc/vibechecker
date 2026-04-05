'use client';

import { useState, useEffect, useCallback } from 'react';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';

type StatusGroup = 'Todo' | 'In Progress' | 'On Hold' | 'Completed';

const PROGRESS_STATUS_MAP: Record<WatchProgress['status'], StatusGroup> = {
  todo: 'Todo',
  watching: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  dropped: 'Completed',
};

const SECTION_ORDER: StatusGroup[] = ['Todo', 'In Progress', 'On Hold', 'Completed'];

export default function AnimePage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, { rating: RatingValue; reasoning?: string }>>({});
  const [progressMap, setProgressMap] = useState<Record<number, WatchProgress>>({});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [activeTab, setActiveTab] = useState<StatusGroup>('Todo');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');

  async function fetchFavorites(currentOffset: number, append = false) {
    const res = await fetch(`/api/favorites?type=anime&limit=25&offset=${currentOffset}`);
    const data = await res.json();
    const items: Favorite[] = data.favorites ?? [];
    setFavorites(prev => append ? [...prev, ...items] : items);
    setTotal(data.total ?? 0);
    setHasMore(data.hasMore ?? false);
    setOffset(currentOffset + items.length);
  }

  async function fetchRatings() {
    const res = await fetch('/api/ratings');
    const all: Rating[] = await res.json();
    const map: Record<number, { rating: RatingValue; reasoning?: string }> = {};
    for (const r of all) map[r.favorite_id] = { rating: r.rating, reasoning: r.reasoning };
    setRatingsMap(map);
  }

  async function fetchProgress() {
    const res = await fetch('/api/progress');
    const all: WatchProgress[] = await res.json();
    const map: Record<number, WatchProgress> = {};
    for (const p of all) map[p.favorite_id] = p;
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
        if (meta.status) return PROGRESS_STATUS_MAP[meta.status as WatchProgress['status']] ?? 'Todo';
      } catch { /* ignore */ }
    }
    return 'Todo';
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addTitle.trim()) return;
    await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'anime', title: addTitle.trim() }) });
    setAddTitle('');
    setShowAdd(false);
    setLoading(true);
    await fetchFavorites(0);
    setLoading(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    setFavorites(prev => prev.filter(f => f.id !== id));
    setTotal(prev => prev - 1);
  }

  async function handleRate(favoriteId: number, rating: RatingValue, reasoning?: string) {
    await fetch('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite_id: favoriteId, rating, reasoning }) });
    setRatingsMap(prev => ({ ...prev, [favoriteId]: { rating, reasoning } }));
  }

  const grouped = SECTION_ORDER.reduce<Record<StatusGroup, Favorite[]>>((acc, s) => { acc[s] = []; return acc; }, {} as Record<StatusGroup, Favorite[]>);
  for (const fav of favorites) { grouped[getGroup(fav)].push(fav); }

  const ratingOrder: Record<string, number> = { felt_things: 0, enjoyed: 1, watched: 2, not_my_thing: 3 };
  let activeItems: Favorite[] = grouped[activeTab] ?? [];
  if (ratingFilter !== 'all') { activeItems = activeItems.filter(f => ratingsMap[f.id]?.rating === ratingFilter); }
  activeItems = [...activeItems].sort((a, b) => (ratingOrder[ratingsMap[a.id]?.rating] ?? 4) - (ratingOrder[ratingsMap[b.id]?.rating] ?? 4));

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#2d2640]">Anime</h1>
            {!loading && <p className="text-sm text-[#7c7291] mt-0.5">{total} titles</p>}
          </div>
          <button onClick={() => setShowAdd(v => !v)} className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors">
            {showAdd ? 'Cancel' : '+ Add'}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="mb-8 bg-white border-2 border-[#e9e4f5] rounded-xl p-4 flex gap-3 items-center">
            <input type="text" value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Anime title..." className="flex-1 bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]" autoFocus />
            <button type="submit" disabled={!addTitle.trim()} className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg transition-colors">Add</button>
          </form>
        )}

        <div className="flex gap-1 mb-3 border-b border-[#e9e4f5]">
          {SECTION_ORDER.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${activeTab === tab ? 'border-[#8b5cf6] text-[#7c3aed]' : 'border-transparent text-[#7c7291] hover:text-[#2d2640]'}`}>
              {tab} ({grouped[tab]?.length ?? 0})
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 mb-6 flex-wrap items-center">
          {(['all', 'felt_things', 'enjoyed', 'watched', 'not_my_thing'] as const).map(v => (
            <button key={v} onClick={() => setRatingFilter(v)}
              className={`text-[10px] px-2 py-1 rounded-full border transition-all ${ratingFilter === v ? 'border-[#8b5cf6] bg-[#f5f3ff] text-[#7c3aed]' : 'border-[#e9e4f5] text-[#b0a8c4] hover:text-[#7c7291]'}`}>
              {v === 'all' ? 'all' : v === 'felt_things' ? '💜 felt things' : v === 'enjoyed' ? '👍 enjoyed' : v === 'watched' ? '👁 watched' : '👎 not my thing'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-[#c4b5fd] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div>
            {activeItems.length === 0 ? (
              <p className="text-center text-[#7c7291] py-16 text-sm">{activeTab === 'Todo' ? 'Nothing in your todo list. Add some or import from MAL in Settings!' : `No ${activeTab.toLowerCase()} anime.`}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeItems.map(fav => <FavoriteCard key={fav.id} favorite={fav} rating={ratingsMap[fav.id]} onDelete={handleDelete} onRate={handleRate} />)}
              </div>
            )}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button onClick={() => fetchFavorites(offset, true)} className="px-6 py-2 text-sm border-2 border-[#e9e4f5] text-[#7c7291] hover:border-[#c4b5fd] hover:text-[#2d2640] rounded-lg transition-colors">Show more</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
