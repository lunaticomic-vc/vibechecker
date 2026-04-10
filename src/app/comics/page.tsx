'use client';

import { useState, useEffect } from 'react';
import type { Favorite, Rating, RatingValue, WatchProgress } from '@/types/index';
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
} from '@/lib/constants';
import type { StatusGroup } from '@/lib/constants';
import {
  CHARACTER_GUIDES,
  CHARACTER_LABELS,
  CHARACTER_ICONS,
  MAJOR_EVENTS,
  STARTING_POINTS,
  ERA_LABELS,
  ERA_COLORS,
  type GuideCharacter,
  type ReadingGuideEntry,
  type EventEntry,
} from '@/lib/dc-reading-guide';

type ComicsView = 'library' | 'guide';
type GuideSection = 'start' | 'characters' | 'events';

export default function ComicsPage() {
  const isOwner = useIsOwner();
  const [view, setView] = useState<ComicsView>('library');

  return (
    <StatusDragProvider onStatusChange={handleLibraryStatusChange}>
      <div className="min-h-screen overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-[#2d2640]">Comics</h1>
          </div>

          {/* View toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('library')}
              className={`px-4 py-2 text-sm rounded-xl border transition-all ${
                view === 'library'
                  ? 'border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]'
                  : 'border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640] bg-white/40'
              }`}
            >
              My Library
            </button>
            <button
              onClick={() => setView('guide')}
              className={`px-4 py-2 text-sm rounded-xl border transition-all ${
                view === 'guide'
                  ? 'border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]'
                  : 'border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640] bg-white/40'
              }`}
            >
              DC Reading Guide
            </button>
          </div>

          {view === 'library' ? <ComicsLibrary isOwner={isOwner} /> : <DCReadingGuide isOwner={isOwner} />}
        </div>
      </div>
    </StatusDragProvider>
  );

  // Hoisted for StatusDragProvider — library handles its own state
  async function handleLibraryStatusChange(favoriteId: number, newStatus: string) {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite_id: favoriteId, status: newStatus }),
    });
  }
}

/* ─── Library Tab ─── */

function ComicsLibrary({ isOwner }: { isOwner: boolean }) {
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
    const res = await fetch(`/api/favorites?type=comic&status=${apiStatus}&limit=25&offset=${currentOffset}`);
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
        if (meta.status) return PROGRESS_STATUS_MAP[meta.status as WatchProgress['status']] ?? 'Todo';
      } catch {}
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
        const imgRes = await fetch(`/api/image?title=${encodeURIComponent(data.title)}&type=comic`);
        const imgData = await imgRes.json();
        if (imgData.image_url) image_url = imgData.image_url;
      } catch {}
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image_url }),
      });
      if (!res.ok) { setAddError('Failed to add. Please try again.'); return; }
      await fetchFavorites(0);
    } catch { setAddError('Failed to add. Please try again.'); }
    finally {
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

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite_id: favoriteId, status: newStatus }),
    });
    await fetchProgress();
  }

  function getCurrentStatus(fav: Favorite): string {
    return statusGroupToApi[getGroup(fav)];
  }

  const grouped = SECTION_ORDER.reduce<Record<StatusGroup, Favorite[]>>((acc, s) => {
    acc[s] = [];
    return acc;
  }, {} as Record<StatusGroup, Favorite[]>);
  for (const fav of favorites) grouped[getGroup(fav)].push(fav);

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

  return (
    <>
      {/* Add button */}
      {isOwner && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm"
          >
            {showAddForm ? 'Cancel' : '+ Add'}
          </button>
        </div>
      )}

      {isOwner && showAddForm && (
        <div className="mb-8">
          <AddFavoriteForm type="comic" onAdd={handleAdd} onCancel={() => setShowAddForm(false)} />
          {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search comics..."
        className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-4"
      />

      <div className="mb-4">
        <GlassTabs
          tabs={SECTION_ORDER}
          active={activeTab}
          onChange={(tab) => { setActiveTab(tab); setOffset(0); fetchFavorites(0, false, statusGroupToApi[tab]); }}
          layoutId="comic-tab"
        />
      </div>

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
        <div className="fixed inset-0 z-30 flex items-center justify-center"><LoadingMouse /></div>
      ) : (
        <div>
          {activeItems.length === 0 ? (
            <p className="text-center text-[#7c7291] py-16 text-sm">
              {activeTab === 'Todo' ? 'Nothing here yet. Add some comics or browse the DC Reading Guide!' : `No ${activeTab.toLowerCase()} comics.`}
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
    </>
  );
}

/* ─── DC Reading Guide Tab ─── */

function DCReadingGuide({ isOwner }: { isOwner: boolean }) {
  const [section, setSection] = useState<GuideSection>('start');
  const [selectedCharacter, setSelectedCharacter] = useState<GuideCharacter | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function addToLibrary(entry: ReadingGuideEntry | EventEntry) {
    const key = entry.title;
    if (adding === key) return;
    setAdding(key);
    try {
      const writer = 'writer' in entry ? entry.writer : '';
      const meta = JSON.stringify({
        source: 'manual',
        description: entry.description,
        reasoning: `From DC Reading Guide. ${writer ? `Written by ${writer}.` : ''} ${entry.era ? ERA_LABELS[entry.era] + ' era.' : ''}`,
      });
      let image_url: string | undefined;
      try {
        const imgRes = await fetch(`/api/image?title=${encodeURIComponent(entry.title)}&type=comic`);
        const imgData = await imgRes.json();
        if (imgData.image_url) image_url = imgData.image_url;
      } catch {}
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comic', title: entry.title, metadata: meta, image_url }),
      });
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
      {/* Guide section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'start' as const, label: 'Where to Start' },
          { key: 'characters' as const, label: 'By Character' },
          { key: 'events' as const, label: 'Major Events' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSection(key); setSelectedCharacter(null); }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              section === key
                ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'start' && <StartingPointsSection isOwner={isOwner} onAdd={addToLibrary} adding={adding} />}
      {section === 'characters' && (
        <CharacterGuideSection
          isOwner={isOwner}
          onAdd={addToLibrary}
          adding={adding}
          selected={selectedCharacter}
          onSelect={setSelectedCharacter}
        />
      )}
      {section === 'events' && <EventsSection isOwner={isOwner} onAdd={addToLibrary} adding={adding} />}
    </>
  );
}

/* ─── Guide Sub-sections ─── */

function StartingPointsSection({ isOwner, onAdd, adding }: { isOwner: boolean; onAdd: (e: ReadingGuideEntry) => void; adding: string | null }) {
  return (
    <div className="space-y-8">
      {STARTING_POINTS.map(sp => (
        <div key={sp.label}>
          <h3 className="text-lg font-medium text-[#2d2640] mb-1">{sp.label}</h3>
          <p className="text-xs text-[#7c7291] mb-4">{sp.description}</p>
          <div className="grid gap-3">
            {sp.entries.map(entry => (
              <GuideEntryCard key={entry.title} entry={entry} isOwner={isOwner} onAdd={() => onAdd(entry)} adding={adding === entry.title} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CharacterGuideSection({
  isOwner, onAdd, adding, selected, onSelect,
}: {
  isOwner: boolean;
  onAdd: (e: ReadingGuideEntry) => void;
  adding: string | null;
  selected: GuideCharacter | null;
  onSelect: (c: GuideCharacter | null) => void;
}) {
  const characters = Object.keys(CHARACTER_GUIDES) as GuideCharacter[];

  return (
    <div>
      {/* Character picker */}
      <div className="flex flex-wrap gap-2 mb-6">
        {characters.map(c => (
          <button
            key={c}
            onClick={() => onSelect(selected === c ? null : c)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
              selected === c
                ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640] bg-white/40'
            }`}
          >
            <span className="opacity-60">{CHARACTER_ICONS[c]}</span>
            {CHARACTER_LABELS[c]}
          </button>
        ))}
      </div>

      {selected ? (
        <div>
          <h3 className="text-lg font-medium text-[#2d2640] mb-1">{CHARACTER_LABELS[selected]} Reading Order</h3>
          <p className="text-xs text-[#7c7291] mb-4">Essential runs in recommended reading order</p>
          <div className="grid gap-3">
            {CHARACTER_GUIDES[selected].map((entry, i) => (
              <GuideEntryCard key={entry.title} entry={entry} index={i + 1} isOwner={isOwner} onAdd={() => onAdd(entry)} adding={adding === entry.title} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-[#b0a8c4] py-12 text-sm">Pick a character to see their reading order</p>
      )}
    </div>
  );
}

function EventsSection({ isOwner, onAdd, adding }: { isOwner: boolean; onAdd: (e: EventEntry) => void; adding: string | null }) {
  return (
    <div>
      <p className="text-xs text-[#7c7291] mb-4">Major crossover events that shaped the DC Universe, in chronological order</p>
      <div className="grid gap-3">
        {MAJOR_EVENTS.map(event => (
          <div
            key={event.title}
            className="rounded-xl border border-[#e9e4f5]/60 bg-white/30 backdrop-blur-sm p-4 hover:bg-white/50 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-medium text-[#2d2640] text-sm">{event.title}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ERA_COLORS[event.era]}`}>
                    {ERA_LABELS[event.era]}
                  </span>
                </div>
                <p className="text-[11px] text-[#7c7291] mb-1">{event.writer} · {event.year} · {event.issueCount}</p>
                <p className="text-xs text-[#5a5270] leading-relaxed">{event.description}</p>
                {event.essentialTieIns && (
                  <p className="text-[10px] text-[#b0a8c4] mt-2">
                    Essential tie-ins: {event.essentialTieIns.join(', ')}
                  </p>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => onAdd(event)}
                  disabled={adding === event.title}
                  className="shrink-0 px-3 py-1.5 text-[10px] rounded-lg border border-[#e9e4f5] text-[#7c7291] hover:border-[#93c5fd] hover:text-[#1d4ed8] transition-all disabled:opacity-50"
                >
                  {adding === event.title ? 'Adding...' : '+ Add'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared Guide Entry Card ─── */

function GuideEntryCard({
  entry,
  index,
  isOwner,
  onAdd,
  adding,
}: {
  entry: ReadingGuideEntry;
  index?: number;
  isOwner: boolean;
  onAdd: () => void;
  adding: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e9e4f5]/60 bg-white/30 backdrop-blur-sm p-4 hover:bg-white/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {index && <span className="text-[10px] text-[#b0a8c4] font-mono">{index}.</span>}
            <h4 className="font-medium text-[#2d2640] text-sm">{entry.title}</h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ERA_COLORS[entry.era]}`}>
              {ERA_LABELS[entry.era]}
            </span>
            {entry.imprint && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-600">
                {entry.imprint}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#7c7291] mb-1">
            {entry.writer}
            {entry.artist ? ` · ${entry.artist}` : ''}
            {' · '}{entry.year}
            {entry.issueCount ? ` · ${entry.issueCount}` : ''}
          </p>
          <p className="text-xs text-[#5a5270] leading-relaxed">{entry.description}</p>
        </div>
        {isOwner && (
          <button
            onClick={onAdd}
            disabled={adding}
            className="shrink-0 px-3 py-1.5 text-[10px] rounded-lg border border-[#e9e4f5] text-[#7c7291] hover:border-[#93c5fd] hover:text-[#1d4ed8] transition-all disabled:opacity-50"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>
        )}
      </div>
    </div>
  );
}
