'use client';

import { useState, useEffect, useCallback } from 'react';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import type { Favorite, Rating, RatingValue } from '@/types/index';

type WatchStatus = 'not_seen' | 'watching' | 'on_hold' | 'completed';

const STATUS_SECTIONS: { label: string; value: WatchStatus }[] = [
  { label: 'Todo', value: 'not_seen' },
  { label: 'In progress', value: 'watching' },
  { label: 'On hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
];

interface ProgressInfo {
  favorite_id: number;
  status: string;
  current_season: number;
  current_episode: number;
  stopped_at?: string;
}

function getStatus(fav: Favorite, progressMap: Map<number, ProgressInfo>): WatchStatus {
  const prog = progressMap.get(fav.id);
  if (prog) {
    if (prog.status === 'completed') return 'completed';
    if (prog.status === 'on_hold') return 'on_hold';
    if (prog.status === 'watching') return 'watching';
  }
  try {
    const meta = fav.metadata ? JSON.parse(fav.metadata) : null;
    if (meta?.status === 'completed') return 'completed';
    if (meta?.status === 'watching') return 'watching';
    if (meta?.status === 'on_hold') return 'on_hold';
  } catch { /* ignore */ }
  return 'not_seen';
}

const PAGE_SIZE = 25;

export default function AnimePage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [progressMap, setProgressMap] = useState<Map<number, ProgressInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchFavorites = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    const offset = append ? favorites.length : 0;
    const params = new URLSearchParams({ type: 'anime', limit: String(PAGE_SIZE), offset: String(offset) });
    const res = await fetch(`/api/favorites?${params}`);
    const data = await res.json();
    const items: Favorite[] = data.favorites ?? (Array.isArray(data) ? data : []);
    setFavorites(prev => append ? [...prev, ...items] : items);
    setHasMore(data.hasMore ?? false);
    setTotal(data.total ?? items.length);
    setLoading(false);
    if (!append) {
      fetch('/api/ratings').then(r => r.json()).then(all => {
        const map: Record<number, Rating> = {};
        if (Array.isArray(all)) for (const r of all) map[r.favorite_id] = r;
        setRatings(map);
      }).catch(() => {});
      fetch('/api/progress').then(r => r.json()).then(items => {
        const map = new Map<number, ProgressInfo>();
        if (Array.isArray(items)) for (const p of items) map.set(p.favorite_id, p);
        setProgressMap(map);
      }).catch(() => {});
    }
  }, [favorites.length]);

  useEffect(() => { fetchFavorites(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addTitle.trim()) return;
    setAddLoading(true);
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'anime', title: addTitle.trim() }),
    });
    setAddTitle('');
    setShowAdd(false);
    setAddLoading(false);
    fetchFavorites();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    fetchFavorites();
  }

  async function handleRate(favoriteId: number, rating: RatingValue, reasoning?: string) {
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite_id: favoriteId, rating, reasoning }),
    });
    const res = await fetch(`/api/ratings?favorite_id=${favoriteId}`);
    const updated = await res.json();
    if (updated) setRatings(prev => ({ ...prev, [favoriteId]: updated }));
  }

  const grouped: Record<WatchStatus, Favorite[]> = { not_seen: [], watching: [], on_hold: [], completed: [] };
  for (const fav of favorites) {
    grouped[getStatus(fav, progressMap)].push(fav);
  }

  const inputClass = "bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]";

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto overflow-y-auto" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2d2640]">Anime</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">{total} titles</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-sm text-white rounded-lg transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 bg-white border-2 border-[#e9e4f5] rounded-xl p-4 flex gap-3 items-center">
          <input
            type="text"
            value={addTitle}
            onChange={e => setAddTitle(e.target.value)}
            placeholder="Anime title..."
            className={`flex-1 ${inputClass}`}
            autoFocus
          />
          <button
            type="submit"
            disabled={addLoading || !addTitle.trim()}
            className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            {addLoading ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center text-[#b8b0c8] py-16">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-[#b8b0c8] py-16">
          <p className="text-lg mb-2">No anime yet</p>
          <p className="text-sm">Add some above or import from MyAnimeList in Settings.</p>
        </div>
      ) : (
        <div className="space-y-8 mb-8">
          {STATUS_SECTIONS.map(({ label, value }) => {
            const items = grouped[value];
            if (items.length === 0) return null;
            return (
              <div key={value}>
                <h3 className="text-xs font-semibold text-[#7c7291] mb-3 uppercase tracking-wider flex items-center gap-2">
                  {label}
                  <span className="text-[10px] text-[#b0a8c4] font-normal">({items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {items.map(fav => (
                    <FavoriteCard
                      key={fav.id}
                      favorite={fav}
                      rating={ratings[fav.id]}
                      onDelete={handleDelete}
                      onRate={handleRate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show more */}
      {hasMore && (
        <div className="text-center mb-8">
          <button
            onClick={() => fetchFavorites(true)}
            className="px-6 py-2 text-xs border-2 border-[#e9e4f5] text-[#7c7291] rounded-xl hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
          >
            Show more ({favorites.length}/{total})
          </button>
        </div>
      )}
    </main>
  );
}
