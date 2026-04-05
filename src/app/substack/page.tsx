'use client';

import { useState, useEffect, useCallback } from 'react';
import RatingSelector from '@/components/RatingSelector';
import type { Favorite, Rating, RatingValue } from '@/types/index';

const PAGE_SIZE = 25;

export default function SubstackPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Add form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchFavorites = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    const offset = append ? favorites.length : 0;
    const params = new URLSearchParams({ type: 'substack', limit: String(PAGE_SIZE), offset: String(offset) });
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

  useEffect(() => { fetchFavorites(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Extract title from URL: use pathname segments as a fallback
  function extractTitleFromUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        return parts[parts.length - 1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
    } catch { /* ignore */ }
    return '';
  }

  function handleUrlChange(val: string) {
    setUrl(val);
    setAddError('');
    if (!title) {
      const extracted = extractTitleFromUrl(val);
      if (extracted) setTitle(extracted);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { setAddError('Title is required.'); return; }
    setAddLoading(true);
    setAddError('');
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'substack', title: trimmedTitle, external_id: trimmedUrl || undefined }),
    });
    if (!res.ok) {
      setAddError('Failed to add article.');
    } else {
      setUrl('');
      setTitle('');
      fetchFavorites();
    }
    setAddLoading(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    setFavorites(prev => prev.filter(f => f.id !== id));
    setTotal(prev => prev - 1);
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

  function isCompleted(fav: Favorite): boolean {
    try {
      const meta = fav.metadata ? JSON.parse(fav.metadata) : null;
      return meta?.status === 'completed';
    } catch { return false; }
  }

  const wantToRead = favorites.filter(f => !isCompleted(f));
  const haveRead = favorites.filter(f => isCompleted(f));

  const inputClass = "bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd] w-full";

  function ArticleItem({ fav }: { fav: Favorite }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
      <div className="flex items-start gap-3 py-3 border-b border-[#f0edf8] last:border-0">
        <div className="flex-1 min-w-0">
          {fav.external_id ? (
            <a
              href={fav.external_id}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#2d2640] hover:text-[#7c3aed] hover:underline line-clamp-2 block"
            >
              {fav.title}
            </a>
          ) : (
            <p className="text-sm font-medium text-[#2d2640] line-clamp-2">{fav.title}</p>
          )}
          {fav.external_id && (
            <p className="text-[10px] text-[#b0a8c4] mt-0.5 truncate">{fav.external_id}</p>
          )}
          <div className="mt-2">
            <RatingSelector
              favoriteId={fav.id}
              currentRating={ratings[fav.id]?.rating}
              currentReasoning={ratings[fav.id]?.reasoning}
              onRate={handleRate}
              compact
            />
          </div>
        </div>
        <button
          onClick={() => {
            if (!confirmDelete) { setConfirmDelete(true); return; }
            handleDelete(fav.id);
          }}
          onBlur={() => setConfirmDelete(false)}
          className={`shrink-0 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors ${
            confirmDelete
              ? 'bg-red-500 text-white'
              : 'bg-[#f5f3ff] text-[#7c7291] hover:bg-red-500 hover:text-white'
          }`}
          title={confirmDelete ? 'Click again to confirm' : 'Delete'}
        >
          {confirmDelete ? '!' : '×'}
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto overflow-y-auto" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2d2640]">Substack</h1>
        <p className="text-xs text-[#7c7291] mt-0.5">{total} articles</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white border-2 border-[#e9e4f5] rounded-xl p-4 mb-8 space-y-3">
        <h3 className="text-sm font-semibold text-[#2d2640]">Add Article</h3>
        <div className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="Paste article URL..."
            className={inputClass}
          />
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setAddError(''); }}
            placeholder="Article title *"
            className={inputClass}
          />
        </div>
        {addError && <p className="text-xs text-red-500">{addError}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addLoading || !title.trim()}
            className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            {addLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {/* Content */}
      {loading ? (
        <div className="text-center text-[#b8b0c8] py-16">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-[#b8b0c8] py-16">
          <p className="text-lg mb-2">No articles yet</p>
          <p className="text-sm">Paste a URL above to start your reading list.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Want to Read */}
          {wantToRead.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#7c7291] mb-2 uppercase tracking-wider flex items-center gap-2">
                Want to Read
                <span className="text-[10px] text-[#b0a8c4] font-normal">({wantToRead.length})</span>
              </h3>
              <div className="bg-white border-2 border-[#e9e4f5] rounded-xl px-4 py-1">
                {wantToRead.map(fav => (
                  <ArticleItem key={fav.id} fav={fav} />
                ))}
              </div>
            </div>
          )}

          {/* Have Read */}
          {haveRead.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#7c7291] mb-2 uppercase tracking-wider flex items-center gap-2">
                Have Read
                <span className="text-[10px] text-[#b0a8c4] font-normal">({haveRead.length})</span>
              </h3>
              <div className="bg-white border-2 border-[#e9e4f5] rounded-xl px-4 py-1">
                {haveRead.map(fav => (
                  <ArticleItem key={fav.id} fav={fav} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show more */}
      {hasMore && (
        <div className="text-center mt-8">
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
