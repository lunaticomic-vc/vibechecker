'use client';

import { useState, useRef, useEffect } from 'react';
import RecommendationCard from '@/components/RecommendationCard';
import { ContentType, Recommendation } from '@/types/index';
import { useAuth } from '@/components/AuthProvider';
import LoadingMouse from '@/components/LoadingMouse';
import { WATCH_TYPES, READ_TYPES, DO_TYPES, TYPE_LABELS } from '@/lib/constants';

type TabletScreen = 'home' | 'app' | 'vibe' | 'result';
type AppTab = 'watch' | 'read' | 'do';

/* ─── Descriptions for category cards ─── */
const TYPE_DESC: Record<string, string> = {
  movie: 'Feature films',
  tv: 'Binge-worthy series',
  anime: 'Japanese animation',
  youtube: 'Videos & creators',
  kdrama: 'Korean dramas',
  substack: 'Newsletters & articles',
  book: 'Novels & non-fiction',
  manga: 'Japanese comics',
  comic: 'Western comics & GN',
  poetry: 'Poems & verse',
  short_story: 'Flash & short fiction',
  essay: 'Long-form essays',
  research: 'Deep dives & papers',
  podcast: 'Audio shows & episodes',
  game: 'Video games',
};

/* ─── Thumbnail colors per type (for placeholder cards) ─── */
const TYPE_THUMB: Record<string, string> = {
  movie: 'from-red-900 to-red-700',
  tv: 'from-blue-900 to-blue-700',
  anime: 'from-pink-900 to-pink-600',
  youtube: 'from-red-800 to-red-500',
  kdrama: 'from-rose-900 to-rose-600',
  substack: 'from-orange-800 to-orange-500',
  book: 'from-amber-900 to-amber-600',
  manga: 'from-violet-900 to-violet-600',
  comic: 'from-blue-800 to-blue-500',
  poetry: 'from-pink-800 to-pink-500',
  short_story: 'from-yellow-800 to-yellow-500',
  essay: 'from-slate-700 to-slate-500',
  research: 'from-cyan-800 to-cyan-500',
  podcast: 'from-emerald-800 to-emerald-500',
  game: 'from-green-800 to-green-500',
};

export default function Home() {
  const [screen, setScreen] = useState<TabletScreen>('home');
  const [activeApp, setActiveApp] = useState<AppTab>('watch');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVibe, setLastVibe] = useState('');
  const { isOwner, setRemaining } = useAuth();
  const [showRejectReasons, setShowRejectReasons] = useState(false);

  const openApp = (app: AppTab) => { setActiveApp(app); setScreen('app'); };
  const pickType = (type: ContentType) => { setSelectedType(type); setError(null); setRecommendation(null); setScreen('vibe'); };

  const handleSubmit = async (vibe: string, useInterests: boolean = true) => {
    if (!selectedType) return;
    setLastVibe(vibe);
    setLoading(true);
    setError(null);
    setShowRejectReasons(false);
    window.dispatchEvent(new CustomEvent('cat-chase', { detail: true }));
    try {
      const res = await fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: selectedType, vibe, useInterests }) });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error ?? 'Failed'); }
      const data = await res.json();
      if (data.remaining !== undefined) setRemaining(data.remaining);
      setRecommendation(data);
      setScreen('result');
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setLoading(false); window.dispatchEvent(new CustomEvent('cat-chase', { detail: false })); }
  };

  const goHome = () => { setScreen('home'); setSelectedType(null); setRecommendation(null); setError(null); };

  return (
    <main className="min-h-screen relative overflow-y-auto">
      <div className="relative z-10 mx-auto flex items-center justify-center min-h-screen py-6 px-4">

        {/* iPad Frame */}
        <div className="w-full max-w-[720px] rounded-[2rem] border-[3px] border-[#d1cdd8] bg-[#0e0e0e] shadow-2xl shadow-black/30 overflow-hidden" style={{ minHeight: '520px', maxHeight: '82vh' }}>

          {/* Camera dot */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-2 h-2 rounded-full bg-[#2a2a2a] border border-[#3a3a3a]" />
          </div>

          {/* Screen content */}
          <div className="flex flex-col bg-[#0e0e0e]" style={{ height: 'calc(82vh - 56px)', minHeight: '480px' }}>

            {/* Loading overlay */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0e0e0e]">
                <LoadingMouse />
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#666]">finding your vibe</p>
              </div>
            )}

            {/* ═══ HOME SCREEN ═══ */}
            {!loading && screen === 'home' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8 bg-gradient-to-b from-[#1a1025] to-[#0e0e0e] animate-[fadeIn_0.4s_ease-out]">
                <p className="text-[11px] tracking-[0.25em] uppercase text-[#666] font-light">consumption corner</p>

                <div className="flex gap-12">
                  {/* Watch — Netflix red */}
                  <button onClick={() => openApp('watch')} className="flex flex-col items-center gap-3 group">
                    <div className="w-20 h-20 rounded-[1.2rem] bg-gradient-to-br from-[#e50914] to-[#831010] flex items-center justify-center shadow-lg shadow-red-900/40 group-hover:scale-105 group-active:scale-95 transition-transform">
                      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-[#888]">Watch</span>
                  </button>

                  {/* Read — Wattpad orange */}
                  <button onClick={() => openApp('read')} className="flex flex-col items-center gap-3 group">
                    <div className="w-20 h-20 rounded-[1.2rem] bg-gradient-to-br from-[#FF6122] to-[#cc4e1b] flex items-center justify-center shadow-lg shadow-orange-900/40 group-hover:scale-105 group-active:scale-95 transition-transform">
                      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-[#888]">Read</span>
                  </button>

                  {/* Do — Game green */}
                  <button onClick={() => openApp('do')} className="flex flex-col items-center gap-3 group">
                    <div className="w-20 h-20 rounded-[1.2rem] bg-gradient-to-br from-[#107C10] to-[#1a9c1a] flex items-center justify-center shadow-lg shadow-green-900/40 group-hover:scale-105 group-active:scale-95 transition-transform">
                      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <span className="text-[11px] text-[#888]">Do</span>
                  </button>
                </div>
              </div>
            )}

            {/* ═══ WATCH APP — Netflix-style ═══ */}
            {!loading && screen === 'app' && activeApp === 'watch' && (
              <div className="flex-1 flex flex-col bg-[#141414] animate-[fadeIn_0.3s_ease-out] overflow-y-auto">
                {/* Top nav */}
                <div className="flex items-center gap-4 px-6 pt-4 pb-3">
                  <button onClick={goHome} className="text-white/60 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-lg font-bold text-white tracking-tight">Watch</h1>
                </div>

                {/* Featured hero banner — first type */}
                <div className="px-6 mb-5">
                  <button onClick={() => pickType(WATCH_TYPES[0])} className="w-full relative rounded-xl overflow-hidden group">
                    <div className={`h-40 bg-gradient-to-r ${TYPE_THUMB[WATCH_TYPES[0]]} flex items-end p-5`}>
                      <div>
                        <p className="text-white text-xl font-bold">{TYPE_LABELS[WATCH_TYPES[0]]}</p>
                        <p className="text-white/60 text-xs mt-1">{TYPE_DESC[WATCH_TYPES[0]]}</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                  </button>
                </div>

                {/* Category rows */}
                <div className="px-6 space-y-5 pb-6">
                  <p className="text-[#999] text-xs font-medium uppercase tracking-wider">Categories</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {WATCH_TYPES.slice(1).map(type => (
                      <button key={type} onClick={() => pickType(type)} className="group rounded-lg overflow-hidden">
                        <div className={`h-24 bg-gradient-to-br ${TYPE_THUMB[type]} flex items-end p-3 group-hover:brightness-125 transition-all`}>
                          <div>
                            <p className="text-white text-sm font-semibold">{TYPE_LABELS[type]}</p>
                            <p className="text-white/50 text-[10px]">{TYPE_DESC[type]}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ READ APP — Wattpad-style ═══ */}
            {!loading && screen === 'app' && activeApp === 'read' && (
              <div className="flex-1 flex flex-col bg-white animate-[fadeIn_0.3s_ease-out] overflow-y-auto">
                {/* Nav bar */}
                <div className="flex items-center gap-4 px-6 pt-4 pb-3 border-b border-gray-100">
                  <button onClick={goHome} className="text-[#FF6122] hover:text-[#e0551e] transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <h1 className="text-lg font-bold text-[#222] tracking-tight">Read</h1>
                </div>

                {/* Featured */}
                <div className="px-6 pt-4 pb-3">
                  <p className="text-[11px] font-semibold text-[#FF6122] uppercase tracking-wider mb-3">Browse by category</p>
                </div>

                {/* Book cover grid */}
                <div className="flex-1 px-6 pb-6">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {READ_TYPES.map(type => (
                      <button key={type} onClick={() => pickType(type)} className="group flex flex-col items-center gap-2">
                        <div className={`w-full aspect-[3/4] rounded-lg bg-gradient-to-br ${TYPE_THUMB[type]} flex items-end justify-center pb-3 shadow-md group-hover:shadow-lg group-hover:scale-[1.03] transition-all`}>
                          <p className="text-white text-[11px] font-semibold text-center px-1">{TYPE_LABELS[type]}</p>
                        </div>
                        <p className="text-[10px] text-[#888]">{TYPE_DESC[type]}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ DO APP — Game launcher style ═══ */}
            {!loading && screen === 'app' && activeApp === 'do' && (
              <div className="flex-1 flex bg-gradient-to-br from-[#0a1a0a] to-[#0e2010] animate-[fadeIn_0.3s_ease-out] overflow-hidden">
                {/* Left nav */}
                <div className="w-48 sm:w-56 flex flex-col px-4 pt-5 pb-4 border-r border-[#1a3a1a]">
                  <button onClick={goHome} className="text-[#4ade80]/60 hover:text-[#4ade80] transition-colors self-start mb-6">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <p className="text-[10px] font-semibold text-[#4ade80]/40 uppercase tracking-widest mb-4">Activities</p>
                  <div className="flex flex-col gap-2">
                    {DO_TYPES.map(type => (
                      <button key={type} onClick={() => pickType(type)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-[#1a3a1a] transition-colors group">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${TYPE_THUMB[type]} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-lg">{type === 'game' ? '🎮' : type === 'podcast' ? '🎙' : '🔬'}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium group-hover:text-[#4ade80] transition-colors">{TYPE_LABELS[type]}</p>
                          <p className="text-[#4a6a4a] text-[10px]">{TYPE_DESC[type]}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right hero */}
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#107C10] to-[#1a9c1a] flex items-center justify-center shadow-lg shadow-green-900/30">
                      <svg className="w-16 h-16 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-xs">pick something to do</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ VIBE CHAT ═══ */}
            {!loading && screen === 'vibe' && selectedType && (
              <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease-out] bg-[#faf8ff]">
                <div className="flex items-center gap-3 px-5 pt-3 pb-2 border-b border-[#e9e4f5]/60 bg-white/80">
                  <button onClick={() => setScreen('app')} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f5f3ff]">
                    <svg className="w-3.5 h-3.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div>
                    <p className="text-sm font-medium text-[#2d2640]">vibe check</p>
                    <p className="text-[10px] text-[#b8b0c8]">{TYPE_LABELS[selectedType]}</p>
                  </div>
                </div>
                <InlineChat contentType={selectedType} onVibeReady={handleSubmit} loading={loading} isOwner={isOwner} />
                {error && <div className="mx-4 mb-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-600">{error}</div>}
              </div>
            )}

            {/* ═══ RESULT ═══ */}
            {!loading && screen === 'result' && recommendation && (
              <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease-out] bg-[#faf8ff] overflow-y-auto">
                <div className="flex items-center gap-3 px-5 pt-3 pb-2 border-b border-[#e9e4f5]/60 bg-white/80">
                  <button onClick={goHome} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f5f3ff]">
                    <svg className="w-3.5 h-3.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <p className="text-sm font-medium text-[#2d2640]">here you go</p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <RecommendationCard recommendation={recommendation} onAccept={goHome} compact />
                  <div className="flex justify-center gap-3 mt-4 pb-3">
                    <button onClick={async () => { if (!recommendation || loading) return; await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: recommendation.type, title: recommendation.title, external_id: recommendation.actionUrl, image_url: recommendation.thumbnailUrl ?? recommendation.imageUrls?.[0], metadata: JSON.stringify({ year: recommendation.year, source: 'recommendation', description: recommendation.description, reasoning: recommendation.reasoning, interests: recommendation.interests, actors: recommendation.actors, redditInsights: recommendation.redditInsights }) }) }); if (lastVibe) handleSubmit(lastVibe); }} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all disabled:opacity-40" title="Save + next">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowRejectReasons(v => !v)} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-red-300 hover:text-red-400 transition-all disabled:opacity-40" title="Reject">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      {showRejectReasons && !loading && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 bg-white/95 backdrop-blur-sm border-2 border-[#e9e4f5] rounded-xl p-1.5 shadow-lg z-20 min-w-[130px]">
                          {[{ value: 'wrong_vibe', label: 'Wrong vibe' }, { value: 'already_seen', label: 'Already seen' }, { value: 'too_mainstream', label: 'Too mainstream' }, { value: 'not_interested', label: 'Not interested' }].map(({ value, label }) => (
                            <button key={value} onClick={async () => { if (!recommendation) return; setShowRejectReasons(false); try { await fetch('/api/rejected', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: recommendation.title, type: recommendation.type, reason: value }) }); } catch {} if (lastVibe) handleSubmit(lastVibe); }} className="text-[11px] text-[#5a5270] hover:bg-[#f5f3ff] hover:text-[#7c3aed] px-3 py-1.5 rounded-lg transition-colors text-left whitespace-nowrap">{label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { if (lastVibe && !loading) handleSubmit(lastVibe); }} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all disabled:opacity-40" title="Regenerate">
                      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    <button onClick={goHome} className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all" title="Home">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Home bar */}
          <div className="flex justify-center py-1.5 bg-[#0e0e0e]">
            <div className="w-20 h-1 rounded-full bg-[#333]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

/* ─── Inline Chat (renders inside the tablet frame) ─── */

const VIBES_BY_TYPE: Partial<Record<ContentType, string[]>> = {
  movie: ['something light while i eat', 'need a good cry', 'rainy day, slow and pretty'],
  tv: ['sleepover binge', 'something addictive', 'cozy and feel-good'],
  anime: ['beautiful animation', 'unhinged and chaotic', 'emotional and bittersweet'],
  youtube: ['something light ~20 mins', 'deep dive niche', 'procrastinating, unhinged'],
  kdrama: ['enemies to lovers', 'funny and lighthearted', 'cozy romance'],
  substack: ['makes me think differently', 'personal essay, raw', 'sharp cultural criticism'],
  book: ['something immersive', 'short and beautiful', 'cozy like a warm blanket'],
  poetry: ['heartbreak but beautiful', 'nature and stillness', 'angry and raw'],
  short_story: ['surreal and dreamlike', 'twist ending', 'quiet and melancholy'],
  essay: ['philosophical and deep', 'vulnerable and real', 'sharp commentary'],
  podcast: ['true crime but thoughtful', 'funny for commute', 'deep conversation'],
  research: ['rabbit hole', 'mind-blowing', 'niche topic'],
  manga: ['beautiful art', 'dark psychological', 'wholesome slice of life'],
  comic: ['gritty noir', 'classic superhero', 'indie and artistic'],
  game: ['story-driven', 'cozy and relaxing', 'open world to explore'],
};

interface ChatMessage { role: 'user' | 'assistant'; content: string }

function InlineChat({ contentType, onVibeReady, loading, isOwner }: { contentType: ContentType; onVibeReady: (vibe: string, useInterests: boolean) => void; loading: boolean; isOwner: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [useInterests, setUseInterests] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, thinking]);
  useEffect(() => { inputRef.current?.focus(); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || thinking || loading) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setThinking(true);
    try {
      const res = await fetch('/api/vibe-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages, contentType }) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.type === 'question') setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      else if (data.type === 'ready') {
        setMessages([...newMessages, { role: 'assistant', content: 'ok i know exactly what to get you, one sec ✨' }]);
        setTimeout(() => onVibeReady(data.vibe, useInterests), 800);
      }
    } catch { onVibeReady(text, useInterests); }
    finally { setThinking(false); }
  }

  const examples = VIBES_BY_TYPE[contentType] ?? [];
  const hasSent = messages.some(m => m.role === 'user');

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex justify-start"><div className="max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2 bg-white border border-[#e9e4f5]/60 shadow-sm"><p className="text-[13px] text-[#2d2640]">hey! what are you in the mood for?</p></div></div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${msg.role === 'user' ? 'rounded-br-md bg-[#8b5cf6] text-white' : 'rounded-bl-md bg-white border border-[#e9e4f5]/60 text-[#2d2640]'}`}>
              <p className="text-[13px] leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-white border border-[#e9e4f5]/60 shadow-sm"><div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-bounce [animation-delay:0.15s]" /><span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-bounce [animation-delay:0.3s]" /></div></div></div>
        )}
      </div>
      {!hasSent && examples.length > 0 && (
        <div className="px-4 pt-1 pb-1 flex flex-wrap gap-1.5">
          {examples.map(ex => (
            <button key={ex} onClick={() => { setInput(ex); inputRef.current?.focus(); }} className="rounded-full border border-[#e9e4f5] bg-white/70 px-2.5 py-1 text-[10px] text-[#b8b0c8] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all">{ex}</button>
          ))}
        </div>
      )}
      <div className="border-t border-[#e9e4f5]/60 px-4 py-2.5 bg-white/50">
        {isOwner && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none mb-1.5 px-1">
            <input type="checkbox" checked={useInterests} onChange={e => setUseInterests(e.target.checked)} className="w-3.5 h-3.5 rounded accent-[#8b5cf6]" />
            <span className="text-[10px] text-[#b8b0c8]">use my interests</span>
          </label>
        )}
        <div className="flex gap-2 items-center">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder={!hasSent ? 'type your vibe...' : 'reply...'} disabled={loading} className="flex-1 rounded-full bg-[#f5f3ff] border border-[#e9e4f5] px-4 py-2 text-[13px] text-[#2d2640] placeholder-[#c4b5fd] focus:outline-none focus:border-[#c4b5fd] disabled:opacity-40" />
          <button onClick={send} disabled={!input.trim() || thinking || loading} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#8b5cf6] text-white shrink-0 transition-all hover:bg-[#7c3aed] active:scale-95 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
