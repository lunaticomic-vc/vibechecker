'use client';

import { useState, useEffect } from 'react';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import AddFavoriteForm from '@/components/favorites/AddFavoriteForm';

type StatusGroup = "Haven't seen" | 'In Progress' | 'On Hold' | 'Completed';

const PROGRESS_STATUS_MAP: Record<WatchProgress['status'], StatusGroup> = {
  watching: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  dropped: 'Completed',
};

const SECTION_ORDER: StatusGroup[] = ["Haven't seen", 'In Progress', 'On Hold', 'Completed'];

export default function TVPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, { rating: RatingValue; reasoning?: string }>>({});
  const [progressMap, setProgressMap] = useState<Record<number, WatchProgress>>({});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  async function fetchFavorites(currentOffset: number, append = false) {
    const res = await fetch(`/api/favorites?type=tv&limit=25&offset=${currentOffset}`);
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
          return PROGRESS_STATUS_MAP[meta.status as WatchProgress['status']] ?? "Haven't seen";
        }
      } catch { /* ignore */ }
    }
    return "Haven't seen";
  }

  async function handleAdd(data: { type: string; title: string; image_url?: string; metadata?: string }) {
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#2d2640]">TV Shows</h1>
            {!loading && (
              <p className="text-sm text-[#7c7291] mt-0.5">{total} {total === 1 ? 'show' : 'shows'}</p>
            )}
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
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#c4b5fd] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {SECTION_ORDER.map(section => {
              const items = grouped[section];
              if (items.length === 0) return null;
              return (
                <section key={section}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-[#7c7291] mb-4 border-b border-[#e9e4f5] pb-2">
                    {section} <span className="font-normal">({items.length})</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {items.map(fav => (
                      <FavoriteCard
                        key={fav.id}
                        favorite={fav}
                        rating={ratingsMap[fav.id]}
                        onDelete={handleDelete}
                        onRate={handleRate}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {favorites.length === 0 && (
              <p className="text-center text-[#7c7291] py-16 text-sm">No TV shows yet. Add one!</p>
            )}

            {hasMore && (
              <div className="flex justify-center pt-4">
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
  );
}
