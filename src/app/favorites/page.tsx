'use client';

import { useState, useEffect, useCallback } from 'react';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import AddFavoriteForm from '@/components/favorites/AddFavoriteForm';
import type { Favorite, ContentType, Rating, RatingValue } from '@/types/index';

const TABS: { label: string; value: ContentType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Movies', value: 'movie' },
  { label: 'TV Shows', value: 'tv' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Anime', value: 'anime' },
  { label: 'Substack', value: 'substack' },
];

type WatchStatus = 'not_seen' | 'watching' | 'on_hold' | 'completed';
const STATUS_SECTIONS: { label: string; value: WatchStatus }[] = [
  { label: "Haven't seen", value: 'not_seen' },
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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [progressMap, setProgressMap] = useState<Map<number, ProgressInfo>>(new Map());
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingValue | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 25;

  // Import states
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState<ContentType>('movie');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [malUsername, setMalUsername] = useState('');
  const [malLoading, setMalLoading] = useState(false);
  const [malMessage, setMalMessage] = useState('');
  const [lastMalUser, setLastMalUser] = useState('');
  const [lbCsv, setLbCsv] = useState('');
  const [lbLoading, setLbLoading] = useState(false);
  const [lbMessage, setLbMessage] = useState('');
  const [ytConnected, setYtConnected] = useState(false);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytMessage, setYtMessage] = useState('');

  // Load saved MAL username
  useEffect(() => {
    fetch('/api/accounts/mal').then(r => r.json()).then(d => { if (d.username) setLastMalUser(d.username); }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/auth/google/status').then(r => r.json()).then(d => setYtConnected(d.connected)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === '1') {
      setYtConnected(true);
      setYtMessage('YouTube connected!');
      window.history.replaceState({}, '', '/favorites');
      setTimeout(() => setYtMessage(''), 5000);
    } else if (params.get('yt_error')) {
      setYtMessage('Failed to connect YouTube.');
      window.history.replaceState({}, '', '/favorites');
      setTimeout(() => setYtMessage(''), 5000);
    }
  }, []);

  const fetchFavorites = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    const offset = append ? favorites.length : 0;
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (filter !== 'all') params.set('type', filter);
    const res = await fetch(`/api/favorites?${params}`);
    const data = await res.json();
    const items = data.favorites ?? (Array.isArray(data) ? data : []);
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
  }, [filter]);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  async function handleAdd(data: { type: ContentType; title: string; image_url?: string; metadata?: string }) {
    await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowForm(false);
    fetchFavorites();
  }

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

  async function handleBulkImport() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBulkLoading(true); setBulkMessage('');
    let added = 0;
    for (const title of lines) {
      await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: bulkType, title }) });
      added++;
    }
    setBulkText(''); setBulkLoading(false);
    setBulkMessage(`Added ${added} favorite${added !== 1 ? 's' : ''}.`);
    fetchFavorites();
    setTimeout(() => setBulkMessage(''), 3000);
  }

  async function handleMALImport() {
    if (!malUsername.trim()) return;
    setMalLoading(true); setMalMessage('');
    try {
      const res = await fetch('/api/imports/mal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: malUsername.trim() }) });
      const data = await res.json();
      if (!res.ok) { setMalMessage(data.error || 'Import failed'); }
      else {
        setMalMessage(data.message);
        const user = malUsername.trim();
        setLastMalUser(user);
        setMalUsername('');
        fetch('/api/accounts/mal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user }) });
        fetchFavorites();
      }
    } catch { setMalMessage('Network error'); }
    setMalLoading(false);
    setTimeout(() => setMalMessage(''), 5000);
  }

  async function handleMALSync() {
    if (!lastMalUser) return;
    setMalLoading(true); setMalMessage('Syncing...');
    try {
      const res = await fetch('/api/imports/mal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: lastMalUser }) });
      const data = await res.json();
      if (!res.ok) { setMalMessage(data.error || 'Sync failed'); }
      else { setMalMessage(data.message); fetchFavorites(); }
    } catch { setMalMessage('Network error'); }
    setMalLoading(false);
    setTimeout(() => setMalMessage(''), 5000);
  }

  async function handleYouTubeImport(mode: 'liked' | 'subscriptions' | 'both') {
    setYtLoading(true); setYtMessage('');
    try {
      const res = await fetch('/api/imports/youtube', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) });
      const data = await res.json();
      if (!res.ok) { setYtMessage(data.error || 'Import failed'); }
      else { setYtMessage(data.message); fetchFavorites(); }
    } catch { setYtMessage('Network error'); }
    setYtLoading(false);
    setTimeout(() => setYtMessage(''), 5000);
  }

  async function handleYouTubeDisconnect() {
    await fetch('/api/auth/google/status', { method: 'DELETE' });
    setYtConnected(false); setYtMessage('Disconnected.');
    setTimeout(() => setYtMessage(''), 3000);
  }

  async function handleLetterboxdImport() {
    if (!lbCsv.trim()) return;
    setLbLoading(true); setLbMessage('');
    try {
      const res = await fetch('/api/imports/letterboxd', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: lbCsv }) });
      const data = await res.json();
      if (!res.ok) { setLbMessage(data.error || 'Import failed'); }
      else { setLbMessage(data.message); setLbCsv(''); fetchFavorites(); }
    } catch { setLbMessage('Network error'); }
    setLbLoading(false);
    setTimeout(() => setLbMessage(''), 5000);
  }

  // Group favorites by status
  const grouped = { not_seen: [] as Favorite[], watching: [] as Favorite[], on_hold: [] as Favorite[], completed: [] as Favorite[] };
  for (const fav of favorites) {
    const status = getStatus(fav, progressMap);
    // Apply rating filter for in_progress and completed
    if (ratingFilter !== 'all' && (status === 'watching' || status === 'completed')) {
      const r = ratings[fav.id];
      if (!r || r.rating !== ratingFilter) continue;
    }
    grouped[status].push(fav);
  }

  const inputClass = "bg-[#f5f3ff] border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]";
  const msgClass = (msg: string) => msg.toLowerCase().includes('import') || msg.toLowerCase().includes('added') || msg.toLowerCase().includes('connected') ? 'text-[#6b9a65]' : 'text-red-500';

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto overflow-y-auto" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2d2640]">Favorites</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">{total} items</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-sm text-white rounded-lg transition-colors">
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && <div className="mb-6"><AddFavoriteForm onAdd={handleAdd} onCancel={() => setShowForm(false)} /></div>}

      {/* Category tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#e9e4f5] pb-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => { setFilter(tab.value); setFavorites([]); }}
            className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-colors -mb-px border-b-2 whitespace-nowrap ${
              filter === tab.value ? 'border-[#8b5cf6] text-[#2d2640]' : 'border-transparent text-[#7c7291]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rating filter for in progress / completed */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <span className="text-[10px] text-[#b0a8c4] uppercase tracking-wider self-center mr-1">filter by rating:</span>
        {(['all', 'felt_things', 'enjoyed', 'watched', 'not_my_thing'] as const).map(v => (
          <button key={v} onClick={() => setRatingFilter(v)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
              ratingFilter === v ? 'border-[#8b5cf6] bg-[#f5f3ff] text-[#7c3aed]' : 'border-[#e9e4f5] text-[#b0a8c4]'
            }`}>
            {v === 'all' ? 'all' : v === 'felt_things' ? '💜 felt things' : v === 'enjoyed' ? '👍 enjoyed' : v === 'watched' ? '👁 watched' : '👎 not my thing'}
          </button>
        ))}
      </div>

      {/* Content grouped by status */}
      {loading ? (
        <div className="text-center text-[#b8b0c8] py-16">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-[#b8b0c8] py-16">
          <p className="text-lg mb-2">No favorites yet</p>
          <p className="text-sm">Import or add some below.</p>
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
                    <FavoriteCard key={fav.id} favorite={fav} rating={ratings[fav.id]} onDelete={handleDelete} onRate={handleRate} />
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
          <button onClick={() => fetchFavorites(true)} className="px-6 py-2 text-xs border-2 border-[#e9e4f5] text-[#7c7291] rounded-xl hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all">
            Show more ({favorites.length}/{total})
          </button>
        </div>
      )}

      {/* Import Section */}
      <div className="border-t border-[#e9e4f5] pt-8 space-y-8">
        <h2 className="text-base font-semibold text-[#2d2640]">Import</h2>

        {/* MAL */}
        <div className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎌</span>
            <h3 className="text-sm font-semibold text-[#2d2640]">MyAnimeList</h3>
          </div>

          {lastMalUser ? (
            <>
              <p className="text-xs text-[#7c7291] mb-3">
                Linked to <span className="font-medium text-[#2d2640]">{lastMalUser}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={handleMALSync} disabled={malLoading}
                  className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg transition-colors">
                  {malLoading ? 'Syncing...' : 'Sync'}
                </button>
                <button onClick={async () => {
                  const res = await fetch('/api/accounts/mal', { method: 'DELETE' });
                  const data = await res.json();
                  setLastMalUser('');
                  setMalMessage(`Removed account and ${data.removed} anime`);
                  fetchFavorites();
                  setTimeout(() => setMalMessage(''), 5000);
                }} className="px-4 py-2 text-sm bg-[#fef2f2] hover:bg-[#fecaca] text-red-500 rounded-lg transition-colors">
                  Remove
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-[#7c7291] mb-3">Import your full anime list. List must be public.</p>
              <div className="flex gap-3 items-center">
                <input type="text" value={malUsername} onChange={e => setMalUsername(e.target.value)} placeholder="MAL username" className={`flex-1 ${inputClass}`} onKeyDown={e => e.key === 'Enter' && handleMALImport()} />
                <button onClick={handleMALImport} disabled={malLoading || !malUsername.trim()} className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap">
                  {malLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </>
          )}
          {malMessage && <p className={`text-xs mt-2 ${msgClass(malMessage)}`}>{malMessage}</p>}
        </div>

        {/* YouTube */}
        <div className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">▶️</span>
            <h3 className="text-sm font-semibold text-[#2d2640]">YouTube</h3>
            {ytConnected && <span className="text-[10px] font-medium bg-[#f0f7ef] text-[#6b9a65] px-2 py-0.5 rounded-full border border-[#a7c4a0]">Connected</span>}
          </div>
          <p className="text-xs text-[#7c7291] mb-3">Connect Google to import liked videos and subscriptions.</p>
          {!ytConnected ? (
            <a href="/api/auth/google" className="inline-block px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">Connect YouTube</a>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleYouTubeImport('liked')} disabled={ytLoading} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg transition-colors">Liked Videos</button>
              <button onClick={() => handleYouTubeImport('subscriptions')} disabled={ytLoading} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg transition-colors">Subscriptions</button>
              <button onClick={() => handleYouTubeImport('both')} disabled={ytLoading} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white rounded-lg transition-colors">Both</button>
              <button onClick={handleYouTubeDisconnect} className="px-3 py-1.5 text-xs bg-[#e9e4f5] hover:bg-[#ddd8ee] text-[#7c7291] rounded-lg transition-colors">Disconnect</button>
            </div>
          )}
          {ytMessage && <p className={`text-xs mt-2 ${msgClass(ytMessage)}`}>{ytMessage}</p>}
        </div>

        {/* Letterboxd */}
        <div className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎬</span>
            <h3 className="text-sm font-semibold text-[#2d2640]">Letterboxd</h3>
          </div>
          <p className="text-xs text-[#7c7291] mb-3">
            Export from <a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener noreferrer" className="text-[#7c3aed] hover:underline">letterboxd.com/settings/data/</a> and paste <code className="text-[#7c7291]">watched.csv</code> contents.
          </p>
          <textarea value={lbCsv} onChange={e => setLbCsv(e.target.value)} placeholder="Date,Name,Year,Letterboxd URI,Rating..." rows={4} className={`w-full font-mono mb-3 resize-none ${inputClass}`} />
          <div className="flex items-center gap-3">
            <button onClick={handleLetterboxdImport} disabled={lbLoading || !lbCsv.trim()} className="px-4 py-2 text-sm bg-[#6b9a65] hover:bg-[#5a8956] disabled:opacity-40 text-white rounded-lg transition-colors">
              {lbLoading ? 'Importing...' : 'Import'}
            </button>
            {lbMessage && <span className={`text-xs ${msgClass(lbMessage)}`}>{lbMessage}</span>}
          </div>
        </div>

        {/* Bulk */}
        <div className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h3 className="text-sm font-semibold text-[#2d2640]">Bulk Import</h3>
          </div>
          <p className="text-xs text-[#7c7291] mb-3">One title per line.</p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <select value={bulkType} onChange={e => setBulkType(e.target.value as ContentType)} className={`shrink-0 ${inputClass}`}>
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
                <option value="anime">Anime</option>
                <option value="youtube">YouTube</option>
              </select>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"Title 1\nTitle 2\n..."} rows={3} className={`flex-1 resize-none ${inputClass}`} />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleBulkImport} disabled={bulkLoading || !bulkText.trim()} className="px-4 py-2 text-sm bg-[#e9e4f5] hover:bg-[#ddd8ee] disabled:opacity-40 text-[#2d2640] rounded-lg transition-colors">
                {bulkLoading ? 'Importing...' : 'Import'}
              </button>
              {bulkMessage && <span className="text-xs text-[#6b9a65]">{bulkMessage}</span>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
