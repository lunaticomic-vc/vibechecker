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
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState<ContentType>('movie');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');

  // MAL import state
  const [malUsername, setMalUsername] = useState('');
  const [malLoading, setMalLoading] = useState(false);
  const [malMessage, setMalMessage] = useState('');

  // Letterboxd import state
  const [lbCsv, setLbCsv] = useState('');
  const [lbLoading, setLbLoading] = useState(false);
  const [lbMessage, setLbMessage] = useState('');

  // YouTube OAuth state
  const [ytConnected, setYtConnected] = useState(false);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytMessage, setYtMessage] = useState('');

  // Check YouTube connection status + URL params on mount
  useEffect(() => {
    fetch('/api/auth/google/status').then(r => r.json()).then(d => setYtConnected(d.connected)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === '1') {
      setYtConnected(true);
      setYtMessage('YouTube connected successfully!');
      window.history.replaceState({}, '', '/favorites');
      setTimeout(() => setYtMessage(''), 5000);
    } else if (params.get('yt_error')) {
      setYtMessage('Failed to connect YouTube. Try again.');
      window.history.replaceState({}, '', '/favorites');
      setTimeout(() => setYtMessage(''), 5000);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    const url = filter === 'all' ? '/api/favorites' : `/api/favorites?type=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setFavorites(Array.isArray(data) ? data : []);
    setLoading(false);
    // Fetch ratings
    fetch('/api/ratings').then(r => r.json()).then(all => {
      const map: Record<number, Rating> = {};
      if (Array.isArray(all)) for (const r of all) map[r.favorite_id] = r;
      setRatings(map);
    }).catch(() => {});
  }, [filter]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function handleAdd(data: { type: ContentType; title: string; image_url?: string; metadata?: string }) {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowForm(false);
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

  async function handleBulkImport() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBulkLoading(true);
    setBulkMessage('');
    let added = 0;
    for (const title of lines) {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: bulkType, title }),
      });
      added++;
    }
    setBulkText('');
    setBulkLoading(false);
    setBulkMessage(`Added ${added} favorite${added !== 1 ? 's' : ''}.`);
    fetchFavorites();
    setTimeout(() => setBulkMessage(''), 3000);
  }

  async function handleMALImport() {
    if (!malUsername.trim()) return;
    setMalLoading(true);
    setMalMessage('');
    try {
      const res = await fetch('/api/imports/mal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: malUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMalMessage(data.error || 'Import failed');
      } else {
        setMalMessage(data.message);
        setMalUsername('');
        fetchFavorites();
      }
    } catch {
      setMalMessage('Network error — try again');
    }
    setMalLoading(false);
    setTimeout(() => setMalMessage(''), 5000);
  }

  async function handleYouTubeImport(mode: 'liked' | 'subscriptions' | 'both') {
    setYtLoading(true);
    setYtMessage('');
    try {
      const res = await fetch('/api/imports/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setYtMessage(data.error || 'Import failed');
      } else {
        setYtMessage(data.message);
        fetchFavorites();
      }
    } catch {
      setYtMessage('Network error — try again');
    }
    setYtLoading(false);
    setTimeout(() => setYtMessage(''), 5000);
  }

  async function handleYouTubeDisconnect() {
    await fetch('/api/auth/google/status', { method: 'DELETE' });
    setYtConnected(false);
    setYtMessage('YouTube disconnected.');
    setTimeout(() => setYtMessage(''), 3000);
  }

  async function handleLetterboxdImport() {
    if (!lbCsv.trim()) return;
    setLbLoading(true);
    setLbMessage('');
    try {
      const res = await fetch('/api/imports/letterboxd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: lbCsv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLbMessage(data.error || 'Import failed');
      } else {
        setLbMessage(data.message);
        setLbCsv('');
        fetchFavorites();
      }
    } catch {
      setLbMessage('Network error — try again');
    }
    setLbLoading(false);
    setTimeout(() => setLbMessage(''), 5000);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed] px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Favorites</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Your saved movies, shows, and more</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-sm text-zinc-100 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Favorite'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6">
          <AddFavoriteForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              filter === tab.value
                ? 'border-zinc-400 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-zinc-600 py-16">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="text-center text-zinc-600 py-16">
          <p className="text-lg mb-2">No favorites yet</p>
          <p className="text-sm">Add some using the button above or the import section below.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
          {favorites.map(fav => (
            <FavoriteCard key={fav.id} favorite={fav} rating={ratings[fav.id]} onDelete={handleDelete} onRate={handleRate} />
          ))}
        </div>
      )}

      {/* Import Section */}
      <div className="mt-12 border-t border-zinc-800 pt-8 space-y-10">
        <h2 className="text-lg font-semibold text-zinc-200">Import</h2>

        {/* MAL Import */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎌</span>
            <h3 className="text-sm font-semibold text-zinc-200">MyAnimeList</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Enter your MAL username to auto-import your anime list. Your list must be set to public.
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={malUsername}
              onChange={e => setMalUsername(e.target.value)}
              placeholder="Your MAL username"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              onKeyDown={e => e.key === 'Enter' && handleMALImport()}
            />
            <button
              onClick={handleMALImport}
              disabled={malLoading || !malUsername.trim()}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {malLoading ? 'Importing...' : 'Import from MAL'}
            </button>
          </div>
          {malMessage && (
            <p className={`text-xs mt-2 ${malMessage.includes('Import') || malMessage.includes('import') ? 'text-green-400' : 'text-red-400'}`}>
              {malMessage}
            </p>
          )}
        </div>

        {/* YouTube Import */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">▶️</span>
            <h3 className="text-sm font-semibold text-zinc-200">YouTube</h3>
            {ytConnected && (
              <span className="text-[10px] font-medium bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">Connected</span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Connect your Google account to import liked videos and subscriptions.
          </p>

          {!ytConnected ? (
            <a
              href="/api/auth/google"
              className="inline-block px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
            >
              Connect YouTube Account
            </a>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleYouTubeImport('liked')}
                disabled={ytLoading}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {ytLoading ? 'Importing...' : 'Import Liked Videos'}
              </button>
              <button
                onClick={() => handleYouTubeImport('subscriptions')}
                disabled={ytLoading}
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {ytLoading ? 'Importing...' : 'Import Subscriptions'}
              </button>
              <button
                onClick={() => handleYouTubeImport('both')}
                disabled={ytLoading}
                className="px-4 py-2 text-sm bg-red-800 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {ytLoading ? 'Importing...' : 'Import Both'}
              </button>
              <button
                onClick={handleYouTubeDisconnect}
                className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}
          {ytMessage && (
            <p className={`text-xs mt-2 ${ytMessage.includes('Import') || ytMessage.includes('import') || ytMessage.includes('connected') ? 'text-green-400' : 'text-red-400'}`}>
              {ytMessage}
            </p>
          )}
        </div>

        {/* Letterboxd Import */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎬</span>
            <h3 className="text-sm font-semibold text-zinc-200">Letterboxd</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Go to <a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">letterboxd.com/settings/data/</a> → Export Your Data → open <code className="text-zinc-400">watched.csv</code> and paste the contents below.
          </p>
          <textarea
            value={lbCsv}
            onChange={e => setLbCsv(e.target.value)}
            placeholder={"Date,Name,Year,Letterboxd URI,Rating\n2024-01-15,Inception,2010,https://letterboxd.com/film/inception/,4.5\n..."}
            rows={5}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none font-mono mb-3"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleLetterboxdImport}
              disabled={lbLoading || !lbCsv.trim()}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {lbLoading ? 'Importing...' : 'Import from Letterboxd'}
            </button>
            {lbMessage && (
              <span className={`text-xs ${lbMessage.includes('Import') || lbMessage.includes('import') ? 'text-green-400' : 'text-red-400'}`}>
                {lbMessage}
              </span>
            )}
          </div>
        </div>

        {/* Bulk Import */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h3 className="text-sm font-semibold text-zinc-200">Bulk Import</h3>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Paste one title per line for any content type.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <select
                value={bulkType}
                onChange={e => setBulkType(e.target.value as ContentType)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500 shrink-0"
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
                <option value="anime">Anime</option>
                <option value="youtube">YouTube</option>
              </select>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={"Inception\nBreaking Bad\nAttack on Titan\n..."}
                rows={4}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleBulkImport}
                disabled={bulkLoading || !bulkText.trim()}
                className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-100 rounded-lg transition-colors"
              >
                {bulkLoading ? 'Importing...' : 'Import'}
              </button>
              {bulkMessage && <span className="text-xs text-green-400">{bulkMessage}</span>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
