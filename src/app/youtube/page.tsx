'use client';

import { useState, useEffect, useCallback } from 'react';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import type { Favorite, Rating, RatingValue } from '@/types/index';

function getYouTubeSource(fav: Favorite): 'video' | 'channel' {
  try {
    const meta = fav.metadata ? JSON.parse(fav.metadata) : null;
    if (meta?.source === 'youtube_subscription') return 'channel';
  } catch { /* ignore */ }
  return 'video';
}

export default function YouTubePage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const PAGE_SIZE = 25;

  const fetchFavorites = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    const offset = append ? favorites.length : 0;
    const params = new URLSearchParams({ type: 'youtube', limit: String(PAGE_SIZE), offset: String(offset) });
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
    }
  }, [favorites.length]);

  useEffect(() => { fetchFavorites(); }, []);

  async function handleDelete(id: number) {
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    fetchFavorites();
  }

  async function handleRate(favoriteId: number, rating: RatingValue, reasoning?: string) {
    await fetch('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorite_id: favoriteId, rating, reasoning }) });
    const res = await fetch(`/api/ratings?favorite_id=${favoriteId}`);
    const updated = await res.json();
    if (updated) setRatings(prev => ({ ...prev, [favoriteId]: updated }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addTitle.trim()) return;
    setAddLoading(true);
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'youtube', title: addTitle.trim(), external_id: addUrl.trim() || undefined }),
    });
    setAddTitle('');
    setAddUrl('');
    setAddLoading(false);
    setShowAdd(false);
    fetchFavorites();
  }

  const videos = favorites.filter(f => getYouTubeSource(f) === 'video');
  const channels = favorites.filter(f => getYouTubeSource(f) === 'channel');

  const inputClass = "bg-[#f5f3ff] border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]";

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto overflow-y-auto" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2d2640]">YouTube</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">{total} items</p>
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
        <form onSubmit={handleAdd} className="mb-6 bg-white border-2 border-[#e9e4f5] rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#2d2640]">Add YouTube Item</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#7c7291]">Title *</label>
              <input
                type="text"
                value={addTitle}
                onChange={e => setAddTitle(e.target.value)}
                placeholder="Video or channel title..."
                className={inputClass}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#7c7291]">YouTube URL (optional)</label>
              <input
                type="url"
                value={addUrl}
                onChange={e => setAddUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-[#7c7291] hover:text-[#2d2640] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={addLoading || !addTitle.trim()}
              className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {addLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-[#b8b0c8] py-16">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-[#b8b0c8] py-16">
          <p className="text-lg mb-2">No YouTube items yet</p>
          <p className="text-sm">Connect YouTube in settings to import liked videos and subscriptions.</p>
        </div>
      ) : (
        <div className="space-y-8 mb-8">
          {videos.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#7c7291] mb-3 uppercase tracking-wider flex items-center gap-2">
                Videos
                <span className="text-[10px] text-[#b0a8c4] font-normal">({videos.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {videos.map(fav => (
                  <FavoriteCard key={fav.id} favorite={fav} rating={ratings[fav.id]} onDelete={handleDelete} onRate={handleRate} />
                ))}
              </div>
            </div>
          )}

          {channels.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#7c7291] mb-3 uppercase tracking-wider flex items-center gap-2">
                Channels
                <span className="text-[10px] text-[#b0a8c4] font-normal">({channels.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {channels.map(fav => (
                  <FavoriteCard key={fav.id} favorite={fav} rating={ratings[fav.id]} onDelete={handleDelete} onRate={handleRate} />
                ))}
              </div>
            </div>
          )}
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
