'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import useSWR from 'swr';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
import type { ContentType } from '@/types/index';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import AddFavoriteForm from '@/components/favorites/AddFavoriteForm';
import StatusDragProvider from '@/components/StatusDragOverlay';
import LoadingMouse from '@/components/LoadingMouse';
import GlassTabs from '@/components/GlassTabs';
import { useAuth } from '@/components/AuthProvider';
import {
  PROGRESS_STATUS_MAP,
  SECTION_ORDER,
  statusGroupToApi,
  RATING_ORDER,
  TYPE_LABELS_PLURAL,
  TYPE_EMPTY_MESSAGES,
} from '@/lib/constants';
import type { StatusGroup } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface ContentLibraryPageProps {
  contentType: ContentType;
}

export default function ContentLibraryPage({ contentType }: ContentLibraryPageProps) {
  const { isOwner } = useAuth();
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<Favorite[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState('');
  const [activeTab, setActiveTab] = useState<StatusGroup>('Todo');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  // SWR hooks — dedupe across tab switches, revalidate on focus
  const apiStatus = statusGroupToApi[activeTab] ?? 'todo';
  const favKey = `/api/favorites?type=${contentType}&status=${apiStatus}&limit=25&offset=0`;
  const { data: favData, mutate: mutateFavs, isLoading: favsLoading } = useSWR<{ favorites: Favorite[]; total: number; hasMore: boolean }>(
    favKey, fetcher, { revalidateOnFocus: true, dedupingInterval: 5000 }
  );
  const { data: ratings, mutate: mutateRatings } = useSWR<Rating[]>(
    `/api/ratings?type=${contentType}`, fetcher, { revalidateOnFocus: true, dedupingInterval: 10000 }
  );
  const { data: progressData, mutate: mutateProgress } = useSWR<WatchProgress[]>(
    `/api/progress?type=${contentType}`, fetcher, { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  // Derive maps from SWR data
  const ratingsMap = useMemo(() => {
    const map: Record<number, { rating: RatingValue; reasoning?: string }> = {};
    for (const r of ratings ?? []) map[r.favorite_id] = { rating: r.rating, reasoning: r.reasoning };
    return map;
  }, [ratings]);

  const progressMap = useMemo(() => {
    const map: Record<number, WatchProgress> = {};
    for (const p of progressData ?? []) map[p.favorite_id] = p;
    return map;
  }, [progressData]);

  // Accumulate page chunks from "Show more". Reset when the base fav key (tab/type) changes.
  useEffect(() => {
    setAccumulated([]);
    setOffset(0);
  }, [favKey]);

  const firstPage = favData?.favorites ?? [];
  const favorites = useMemo(() => {
    if (accumulated.length === 0) return firstPage;
    return [...firstPage, ...accumulated];
  }, [firstPage, accumulated]);

  const hasMore = (favData?.hasMore ?? false) && offset + firstPage.length + accumulated.length < (favData?.total ?? 0);
  const loading = favsLoading;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cat-chase', { detail: loading || adding }));
  }, [loading, adding]);

  async function loadMore() {
    const nextOffset = offset + 25 + accumulated.length;
    const res = await fetch(`/api/favorites?type=${contentType}&status=${apiStatus}&limit=25&offset=${nextOffset}`);
    if (!res.ok) return;
    const data: { favorites: Favorite[] } = await res.json();
    setAccumulated(prev => [...prev, ...(data.favorites ?? [])]);
    setOffset(nextOffset);
  }

  const getGroup = useCallback((fav: Favorite): StatusGroup => {
    const progress = progressMap[fav.id];
    if (progress) return PROGRESS_STATUS_MAP[progress.status];
    if (fav.metadata) {
      try {
        const meta = JSON.parse(fav.metadata);
        if (meta.status) {
          return PROGRESS_STATUS_MAP[meta.status as WatchProgress['status']] ?? 'Todo';
        }
      } catch { /* plain-text notes; treat as Todo */ }
    }
    return 'Todo';
  }, [progressMap]);

  async function handleAdd(data: { type: string; title: string; metadata?: string; external_id?: string }) {
    setShowAddForm(false);
    setAdding(true);
    setAddError('');
    try {
      let image_url: string | undefined;
      try {
        const imgRes = await fetch(`/api/image?title=${encodeURIComponent(data.title)}&type=${contentType}`);
        const imgData = await imgRes.json();
        if (imgData.image_url) image_url = imgData.image_url;
      } catch { /* image lookup is best-effort */ }

      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image_url }),
      });
      if (!res.ok) { setAddError('Failed to add. Please try again.'); return; }
      setAccumulated([]);
      setOffset(0);
      await mutateFavs();
    } catch {
      setAddError('Failed to add. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/favorites?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    // Optimistic prune across page cache + accumulated chunks
    setAccumulated(prev => prev.filter(f => f.id !== id));
    mutateFavs(
      prev => prev ? { ...prev, favorites: prev.favorites.filter(f => f.id !== id), total: Math.max(0, prev.total - 1) } : prev,
      { revalidate: false }
    );
  }

  async function handleRate(favoriteId: number, rating: RatingValue, reasoning?: string) {
    const res = await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite_id: favoriteId, rating, reasoning }),
    });
    if (!res.ok) return;
    // Optimistic update in local cache
    mutateRatings(
      prev => {
        const next = (prev ?? []).filter(r => r.favorite_id !== favoriteId);
        next.push({ id: 0, favorite_id: favoriteId, rating, reasoning, created_at: new Date().toISOString() });
        return next;
      },
      { revalidate: false }
    );
  }

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    const status = newStatus as WatchProgress['status'];

    // Optimistic — re-group the card immediately. getGroup() reads progressMap,
    // so injecting/updating a row here moves the card to the new section before
    // the network round-trip completes.
    mutateProgress(
      prev => {
        const arr = prev ?? [];
        const existing = arr.find(p => p.favorite_id === favoriteId);
        if (existing) {
          return arr.map(p => p.favorite_id === favoriteId ? { ...p, status } : p);
        }
        return [
          ...arr,
          {
            id: 0,
            favorite_id: favoriteId,
            current_season: 1,
            current_episode: 1,
            status,
            updated_at: new Date().toISOString(),
          } as WatchProgress,
        ];
      },
      { revalidate: false },
    );

    let res: Response;
    try {
      res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite_id: favoriteId, status }),
      });
    } catch (err) {
      console.error('progress POST network error', err);
      mutateProgress();
      return;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`progress POST ${res.status}:`, text);
    }

    mutateProgress();
  }

  // Compute grouped + filtered + sorted once per render
  const { grouped, activeItems } = useMemo(() => {
    const g = SECTION_ORDER.reduce<Record<StatusGroup, Favorite[]>>((acc, s) => {
      acc[s] = [];
      return acc;
    }, {} as Record<StatusGroup, Favorite[]>);
    for (const fav of favorites) g[getGroup(fav)].push(fav);

    let items: Favorite[] = g[activeTab] ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(f => f.title.toLowerCase().includes(q));
    }
    if (ratingFilter !== 'all' && activeTab !== 'Todo') {
      items = items.filter(f => ratingsMap[f.id]?.rating === ratingFilter);
    }
    if (activeTab !== 'Todo') {
      items = [...items].sort((a, b) => {
        const oa = RATING_ORDER[ratingsMap[a.id]?.rating] ?? 4;
        const ob = RATING_ORDER[ratingsMap[b.id]?.rating] ?? 4;
        return oa - ob;
      });
    }
    return { grouped: g, activeItems: items };
  }, [favorites, activeTab, search, ratingFilter, ratingsMap, getGroup]);

  function getCurrentStatus(fav: Favorite): string {
    return statusGroupToApi[getGroup(fav)];
  }

  const pageTitle = TYPE_LABELS_PLURAL[contentType] ?? contentType;
  const emptyTodoMsg = TYPE_EMPTY_MESSAGES[contentType] ?? 'Nothing in your todo list.';
  const layoutId = `${contentType}-tab`;

  return (
    <StatusDragProvider onStatusChange={handleStatusChange}>
    <div className="min-h-dvh overflow-y-auto relative z-10">
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
              setAccumulated([]);
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
                  onClick={loadMore}
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
