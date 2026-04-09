'use client';

import { useState, useEffect } from 'react';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
import type { ContentType } from '@/types/index';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import AddFavoriteForm from '@/components/favorites/AddFavoriteForm';
import StatusDragProvider from '@/components/StatusDragOverlay';
import LoadingMouse from '@/components/LoadingMouse';
import GlassTabs from '@/components/GlassTabs';
import { useIsOwner } from '@/lib/useIsOwner';
import {
  PROGRESS_STATUS_MAP,
  SECTION_ORDER,
  statusGroupToApi,
  RATING_ORDER,
  TYPE_LABELS,
} from '@/lib/constants';
import type { StatusGroup } from '@/lib/constants';

const PAGE_TITLES: Record<string, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
  anime: 'Anime',
  kdrama: 'K-Drama',
  research: 'Research',
  poetry: 'Poetry',
  short_story: 'Short Stories',
  book: 'Books',
  essay: 'Essays',
  podcast: 'Podcasts',
  manga: 'Manga',
  comic: 'Comics',
};

const EMPTY_TODO_MESSAGES: Record<string, string> = {
  movie: 'Nothing in your todo list. Add some!',
  tv: 'Nothing in your todo list.',
  anime: 'Nothing in your todo list. Add some or import from MAL in Settings!',
  kdrama: 'Nothing in your list. Add some K-dramas!',
  research: 'Nothing here yet. Add some research topics!',
  poetry: 'Nothing here yet. Add some poems!',
  short_story: 'Nothing here yet. Add some short stories!',
  book: 'Nothing here yet. Add some books!',
  essay: 'Nothing here yet. Add some essays!',
  podcast: 'Nothing here yet. Add some podcasts!',
  manga: 'Nothing here yet. Add some manga!',
  comic: 'Nothing here yet. Add some comics!',
};

const IMAGE_LOOKUP_TYPE: Record<string, string> = {
  movie: 'movie',
  tv: 'tv',
  anime: 'tv',
  kdrama: 'tv',
  book: 'book',
  poetry: 'poetry',
  short_story: 'short_story',
  essay: 'essay',
  podcast: 'podcast',
  research: 'research',
  substack: 'substack',
  manga: 'manga',
  comic: 'comic',
};

interface ContentLibraryPageProps {
  contentType: ContentType;
}

export default function ContentLibraryPage({ contentType }: ContentLibraryPageProps) {
  const isOwner = useIsOwner();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, { rating: RatingValue; reasoning?: string }>>({});
  const [progressMap, setProgressMap] = useState<Record<number, WatchProgress>>({});
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState('');
  const [activeTab, setActiveTab] = useState<StatusGroup>('Todo');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');
  const [search, setSearch] = useState('');

  async function fetchFavorites(currentOffset: number, append = false, status?: string) {
    const apiStatus = status ?? statusGroupToApi[activeTab] ?? 'todo';
    const res = await fetch(`/api/favorites?type=${contentType}&status=${apiStatus}&limit=25&offset=${currentOffset}`);
    if (!res.ok) return;
    const data = await res.json();
    const items: Favorite[] = data.favorites ?? [];
    setFavorites(prev => append ? [...prev, ...items] : items);
    setHasMore(data.hasMore ?? false);
    setOffset(currentOffset + items.length);
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
    window.dispatchEvent(new CustomEvent('cat-chase', { detail: true }));
    Promise.all([fetchFavorites(0), fetchRatings(), fetchProgress()]).finally(() => {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('cat-chase', { detail: false }));
    });
  }, []);

  function getGroup(fav: Favorite): StatusGroup {
    const progress = progressMap[fav.id];
    if (progress) return PROGRESS_STATUS_MAP[progress.status];
    if (fav.metadata) {
      try {
        const meta = JSON.parse(fav.metadata);
        if (meta.status) {
          return PROGRESS_STATUS_MAP[meta.status as WatchProgress['status']] ?? 'Todo';
        }
      } catch (error) { console.warn('Failed to parse favorite metadata JSON', error); }
    }
    return 'Todo';
  }

  async function handleAdd(data: { type: string; title: string; metadata?: string }) {
    setShowAddForm(false);
    setLoading(true);
    setAddError('');
    window.dispatchEvent(new CustomEvent('cat-chase', { detail: true }));

    try {
      let image_url: string | undefined;
      try {
        const lookupType = IMAGE_LOOKUP_TYPE[contentType] ?? 'tv';
        const imgRes = await fetch(`/api/image?title=${encodeURIComponent(data.title)}&type=${lookupType}`);
        const imgData = await imgRes.json();
        if (imgData.image_url) image_url = imgData.image_url;
      } catch { /* image lookup is best-effort */ }

      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image_url }),
      });
      if (!res.ok) { setAddError('Failed to add. Please try again.'); return; }
      await fetchFavorites(0);
    } catch {
      setAddError('Failed to add. Please try again.');
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('cat-chase', { detail: false }));
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return;
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

  function getCurrentStatus(fav: Favorite): string {
    return statusGroupToApi[getGroup(fav)];
  }

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite_id: favoriteId, status: newStatus }),
    });
    await fetchProgress();
  }

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
      const oa = RATING_ORDER[ratingsMap[a.id]?.rating] ?? 4;
      const ob = RATING_ORDER[ratingsMap[b.id]?.rating] ?? 4;
      return oa - ob;
    });
  }

  const pageTitle = PAGE_TITLES[contentType] ?? TYPE_LABELS[contentType] ?? contentType;
  const emptyTodoMsg = EMPTY_TODO_MESSAGES[contentType] ?? 'Nothing in your todo list.';
  const layoutId = `${contentType}-tab`;

  return (
    <StatusDragProvider onStatusChange={handleStatusChange}>
    <div className="min-h-screen overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#2d2640]">{pageTitle}</h1>
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

        {/* Add form */}
        {isOwner && showAddForm && (
          <div className="mb-8">
            <AddFavoriteForm
              type={contentType}
              onAdd={handleAdd}
              onCancel={() => setShowAddForm(false)}
            />
            {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          aria-label="Search"
          className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-4"
        />

        {/* Status tabs */}
        <div className="mb-4">
          <GlassTabs
            tabs={SECTION_ORDER}
            active={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setOffset(0);
              fetchFavorites(0, false, statusGroupToApi[tab]);
            }}
            layoutId={layoutId}
          />
        </div>

        {/* Rating filter — hidden on Todo tab */}
        {activeTab !== 'Todo' && (
          <div className="flex gap-1.5 mb-6 flex-wrap items-center">
            {(['all', 'felt_things', 'enjoyed', 'watched', 'not_my_thing'] as const).map(v => (
              <button
                key={v}
                onClick={() => setRatingFilter(v)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                  ratingFilter === v
                    ? 'border-[#8b5cf6] bg-[#f5f3ff] text-[#7c3aed]'
                    : 'border-[#e9e4f5] text-[#b0a8c4] hover:text-[#7c7291]'
                }`}
              >
                {v === 'all' ? 'all' : v === 'felt_things' ? '♡ felt things' : v === 'enjoyed' ? '✦ enjoyed' : v === 'watched' ? '◎ okayish' : '✕ not my thing'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center">
            <LoadingMouse />
          </div>
        ) : (
          <div>
            {activeItems.length === 0 ? (
              <p className="text-center text-[#7c7291] py-16 text-sm">
                {activeTab === 'Todo'
                  ? emptyTodoMsg
                  : `No ${activeTab.toLowerCase()} ${pageTitle.toLowerCase()}.`}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {activeItems.map(fav => (
                  <FavoriteCard
                    key={fav.id}
                    favorite={fav}
                    rating={ratingsMap[fav.id]}
                    currentStatus={getCurrentStatus(fav)}
                    showDirectLink={activeTab === 'In Progress'}
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
