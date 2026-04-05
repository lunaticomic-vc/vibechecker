'use client';

import { useState, useEffect } from 'react';
import type { ContentType } from '@/types/index';

export default function SettingsPage() {
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

  useEffect(() => {
    fetch('/api/accounts/mal').then(r => r.json()).then(d => { if (d.username) setLastMalUser(d.username); }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/auth/google/status').then(r => r.json()).then(d => setYtConnected(d.connected)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === '1') {
      setYtConnected(true);
      setYtMessage('YouTube connected!');
      window.history.replaceState({}, '', '/settings');
      setTimeout(() => setYtMessage(''), 5000);
    } else if (params.get('yt_error')) {
      setYtMessage('Failed to connect YouTube.');
      window.history.replaceState({}, '', '/settings');
      setTimeout(() => setYtMessage(''), 5000);
    }
  }, []);

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
      else { setMalMessage(data.message); }
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
      else { setYtMessage(data.message); }
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
      else { setLbMessage(data.message); setLbCsv(''); }
    } catch { setLbMessage('Network error'); }
    setLbLoading(false);
    setTimeout(() => setLbMessage(''), 5000);
  }

  const inputClass = "bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]";
  const msgClass = (msg: string) => msg.toLowerCase().includes('import') || msg.toLowerCase().includes('added') || msg.toLowerCase().includes('connected') || msg.toLowerCase().includes('sync') ? 'text-[#6b9a65]' : 'text-red-500';

  const SectionIcon = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[#c4b5fd] shrink-0">{children}</span>
  );

  return (
    <div className="min-h-screen overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2d2640]">Settings</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">Manage integrations and imports</p>
        </div>

        <div className="space-y-6 max-w-2xl">
          <h2 className="text-base font-semibold text-[#2d2640]">Import</h2>

          {/* MAL */}
          <div className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <SectionIcon>
                <svg width="18" height="18" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M42 12 Q 22 18, 22 36 Q 22 54, 42 60 Q 30 54, 30 36 Q 30 18, 42 12 Z" />
                  <path d="M48 24 L50 30 L56 30 L51 34 L53 40 L48 36 L43 40 L45 34 L40 30 L46 30 Z" />
                </svg>
              </SectionIcon>
              <h3 className="text-sm font-semibold text-[#2d2640]">MyAnimeList</h3>
            </div>

            {lastMalUser ? (
              <>
                <p className="text-xs text-[#7c7291] mb-3">
                  Linked to <span className="font-medium text-[#2d2640]">{lastMalUser}</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={handleMALSync} disabled={malLoading}
                    className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40">
                    {malLoading ? 'Syncing...' : 'Sync'}
                  </button>
                  <button onClick={async () => {
                    const res = await fetch('/api/accounts/mal', { method: 'DELETE' });
                    const data = await res.json();
                    setLastMalUser('');
                    setMalMessage(`Removed account and ${data.removed} anime`);
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
                  <button onClick={handleMALImport} disabled={malLoading || !malUsername.trim()} className="px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40 whitespace-nowrap">
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
              <SectionIcon>
                <svg width="18" height="18" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="36" cy="36" r="22" />
                  <path d="M30 24 L48 36 L30 48 Z" />
                </svg>
              </SectionIcon>
              <h3 className="text-sm font-semibold text-[#2d2640]">YouTube</h3>
              {ytConnected && <span className="text-[10px] font-medium bg-[#f0f7ef] text-[#6b9a65] px-2 py-0.5 rounded-full border border-[#a7c4a0]">Connected</span>}
            </div>
            <p className="text-xs text-[#7c7291] mb-3">Connect Google to import liked videos and subscriptions.</p>
            {!ytConnected ? (
              <a href="/api/auth/google" className="inline-block px-4 py-2 text-sm text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm">Connect YouTube</a>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleYouTubeImport('liked')} disabled={ytLoading} className="px-3 py-1.5 text-xs text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40">Liked Videos</button>
                <button onClick={() => handleYouTubeImport('subscriptions')} disabled={ytLoading} className="px-3 py-1.5 text-xs text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40">Subscriptions</button>
                <button onClick={() => handleYouTubeImport('both')} disabled={ytLoading} className="px-3 py-1.5 text-xs text-[#7c3aed] rounded-lg transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40">Both</button>
                <button onClick={handleYouTubeDisconnect} className="px-3 py-1.5 text-xs bg-[#e9e4f5] hover:bg-[#ddd8ee] text-[#7c7291] rounded-lg transition-colors">Disconnect</button>
              </div>
            )}
            {ytMessage && <p className={`text-xs mt-2 ${msgClass(ytMessage)}`}>{ytMessage}</p>}
          </div>

          {/* Letterboxd */}
          <div className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <SectionIcon>
                <svg width="18" height="18" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="36" cy="36" r="22" />
                  <circle cx="36" cy="36" r="7" />
                  <circle cx="36" cy="36" r="2.5" fill="currentColor" stroke="none" />
                  <line x1="36" y1="14" x2="36" y2="29" /><line x1="36" y1="43" x2="36" y2="58" />
                  <line x1="14" y1="36" x2="29" y2="36" /><line x1="43" y1="36" x2="58" y2="36" />
                </svg>
              </SectionIcon>
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
              <SectionIcon>
                <svg width="18" height="18" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="16" y="12" width="40" height="48" rx="3" />
                  <line x1="24" y1="24" x2="48" y2="24" /><line x1="24" y1="32" x2="48" y2="32" />
                  <line x1="24" y1="40" x2="40" y2="40" />
                </svg>
              </SectionIcon>
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
      </div>
    </div>
  );
}
