'use client';

import { useState } from 'react';
import ChatVibeInput from '@/components/ChatVibeInput';
import RecommendationCard from '@/components/RecommendationCard';
import { ContentType, Recommendation } from '@/types/index';
import { useAuth } from '@/components/AuthProvider';
import LoadingMouse from '@/components/LoadingMouse';
import { WATCH_TYPES, READ_TYPES, DO_TYPES, TYPE_LABELS } from '@/lib/constants';

type PhoneScreen = 'home' | 'app' | 'vibe' | 'result';
type AppTab = 'watch' | 'read' | 'do';

const WATCH_ICONS: Record<string, string> = { movie: '🎬', tv: '📺', anime: '✧', youtube: '▶', kdrama: '🌸' };
const READ_ICONS: Record<string, string> = { substack: '✉', book: '📖', manga: '◈', comic: '💥', poetry: '🪶', short_story: '✎', essay: '§' };
const DO_ICONS: Record<string, string> = { research: '🔬', podcast: '🎙', game: '🎮' };

function getIcon(type: ContentType): string {
  return WATCH_ICONS[type] ?? READ_ICONS[type] ?? DO_ICONS[type] ?? '•';
}

export default function Home() {
  const [screen, setScreen] = useState<PhoneScreen>('home');
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
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: selectedType, vibe, useInterests }),
      });
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
      <div className="relative z-10 mx-auto flex items-center justify-center min-h-screen py-8 px-4">

        {/* Phone Frame */}
        <div className="w-[340px] sm:w-[375px] rounded-[2.8rem] border-2 border-[#e9e4f5]/80 bg-[#faf8ff] shadow-2xl shadow-purple-100/40 overflow-hidden" style={{ minHeight: '680px', maxHeight: '85vh' }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-7 pt-3 pb-1">
            <span className="text-[9px] text-[#b8b0c8] font-medium">9:41</span>
            <div className="w-20 h-1 rounded-full bg-[#e9e4f5]" />
            <div className="flex gap-1">
              <div className="w-3 h-2 rounded-sm border border-[#c8c2d6]" />
            </div>
          </div>

          {/* Screen content */}
          <div className="flex flex-col" style={{ height: 'calc(85vh - 80px)', minHeight: '600px' }}>

            {/* HOME SCREEN */}
            {screen === 'home' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 animate-[fadeIn_0.4s_ease-out]">
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#b8b0c8]">consumption corner</p>

                <div className="grid grid-cols-3 gap-6">
                  {/* Watch app */}
                  <button onClick={() => openApp('watch')} className="flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#581c87] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-300/30 group-hover:scale-105 group-active:scale-95 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#7c7291]">Watch</span>
                  </button>

                  {/* Read app */}
                  <button onClick={() => openApp('read')} className="flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f766e] to-[#5eead4] flex items-center justify-center shadow-lg shadow-teal-300/30 group-hover:scale-105 group-active:scale-95 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#7c7291]">Read</span>
                  </button>

                  {/* Do app */}
                  <button onClick={() => openApp('do')} className="flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b45309] to-[#fbbf24] flex items-center justify-center shadow-lg shadow-amber-300/30 group-hover:scale-105 group-active:scale-95 transition-transform">
                      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#7c7291]">Do</span>
                  </button>
                </div>
              </div>
            )}

            {/* APP SCREEN — content type selection themed per app */}
            {screen === 'app' && (
              <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease-out]">
                {/* App header */}
                <div className={`px-5 pt-4 pb-3 ${
                  activeApp === 'watch' ? 'bg-gradient-to-b from-[#1a0533] to-transparent' :
                  activeApp === 'read' ? 'bg-gradient-to-b from-[#f0fdfa] to-transparent' :
                  'bg-gradient-to-b from-[#451a03]/10 to-transparent'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={goHome} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                      <svg className={`w-3.5 h-3.5 ${activeApp === 'watch' ? 'text-white' : 'text-[#2d2640]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className={`text-sm font-semibold ${activeApp === 'watch' ? 'text-white' : 'text-[#2d2640]'}`}>
                      {activeApp === 'watch' ? 'What to Watch' : activeApp === 'read' ? 'What to Read' : 'What to Do'}
                    </h2>
                    <div className="w-7" />
                  </div>
                  <p className={`text-[10px] text-center ${activeApp === 'watch' ? 'text-white/50' : 'text-[#b8b0c8]'}`}>
                    {activeApp === 'watch' ? 'pick your poison' : activeApp === 'read' ? 'choose your escape' : 'pick your adventure'}
                  </p>
                </div>

                {/* Content type grid */}
                <div className="flex-1 px-4 pt-2 pb-4 overflow-y-auto">
                  <div className={`grid gap-3 ${
                    (activeApp === 'watch' ? WATCH_TYPES : activeApp === 'read' ? READ_TYPES : DO_TYPES).length <= 3
                      ? 'grid-cols-1'
                      : 'grid-cols-2'
                  }`}>
                    {(activeApp === 'watch' ? WATCH_TYPES : activeApp === 'read' ? READ_TYPES : DO_TYPES).map(type => (
                      <button
                        key={type}
                        onClick={() => pickType(type)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all active:scale-[0.97] ${
                          activeApp === 'watch'
                            ? 'bg-[#1a0533]/60 border-[#7c3aed]/30 hover:border-[#7c3aed]/60 hover:bg-[#1a0533]/80'
                            : activeApp === 'read'
                            ? 'bg-white border-[#e9e4f5] hover:border-[#5eead4] hover:bg-[#f0fdfa]'
                            : 'bg-white border-[#e9e4f5] hover:border-[#fbbf24] hover:bg-[#fffbeb]'
                        }`}
                      >
                        <span className="text-xl">{getIcon(type)}</span>
                        <div className="text-left">
                          <p className={`text-sm font-medium ${activeApp === 'watch' ? 'text-white' : 'text-[#2d2640]'}`}>
                            {TYPE_LABELS[type]}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIBE CHAT SCREEN — inside the phone */}
            {screen === 'vibe' && selectedType && (
              <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease-out]">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-[#e9e4f5]/60">
                  <button onClick={() => setScreen('app')} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f5f3ff]">
                    <svg className="w-3.5 h-3.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <p className="text-xs font-medium text-[#2d2640]">vibe check</p>
                    <p className="text-[9px] text-[#b8b0c8]">{TYPE_LABELS[selectedType]}</p>
                  </div>
                </div>

                {/* Inline chat — no nested phone frame */}
                <InlineChat contentType={selectedType} onVibeReady={handleSubmit} loading={loading} isOwner={isOwner} />

                {error && (
                  <div className="mx-4 mb-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-[11px] text-red-600">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* RESULT SCREEN — inside the phone */}
            {screen === 'result' && recommendation && (
              <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease-out] overflow-y-auto">
                <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-[#e9e4f5]/60">
                  <button onClick={goHome} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f5f3ff]">
                    <svg className="w-3.5 h-3.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <p className="text-xs font-medium text-[#2d2640]">here you go</p>
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center"><LoadingMouse /></div>
                ) : (
                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    <div className="transform scale-[0.92] origin-top">
                      <RecommendationCard recommendation={recommendation} onAccept={goHome} />
                    </div>

                    <div className="flex justify-center gap-3 mt-3 pb-2">
                      <button
                        onClick={async () => {
                          if (!recommendation || loading) return;
                          await fetch('/api/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              type: recommendation.type, title: recommendation.title,
                              external_id: recommendation.actionUrl,
                              image_url: recommendation.thumbnailUrl ?? recommendation.imageUrls?.[0],
                              metadata: JSON.stringify({ year: recommendation.year, source: 'recommendation', description: recommendation.description, reasoning: recommendation.reasoning, interests: recommendation.interests, actors: recommendation.actors, redditInsights: recommendation.redditInsights }),
                            }),
                          });
                          if (lastVibe) handleSubmit(lastVibe);
                        }}
                        disabled={loading}
                        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all disabled:opacity-40"
                        title="Save + next"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowRejectReasons(v => !v)}
                          disabled={loading}
                          className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-red-300 hover:text-red-400 transition-all disabled:opacity-40"
                          title="Reject"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        {showRejectReasons && !loading && (
                          <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 bg-white/95 backdrop-blur-sm border-2 border-[#e9e4f5] rounded-xl p-1.5 shadow-lg z-20 min-w-[120px]">
                            {[{ value: 'wrong_vibe', label: 'Wrong vibe' }, { value: 'already_seen', label: 'Already seen' }, { value: 'too_mainstream', label: 'Too mainstream' }, { value: 'not_interested', label: 'Not interested' }].map(({ value, label }) => (
                              <button key={value} onClick={async () => {
                                if (!recommendation) return;
                                setShowRejectReasons(false);
                                try { await fetch('/api/rejected', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: recommendation.title, type: recommendation.type, reason: value }) }); } catch {}
                                if (lastVibe) handleSubmit(lastVibe);
                              }} className="text-[10px] text-[#5a5270] hover:bg-[#f5f3ff] hover:text-[#7c3aed] px-2.5 py-1 rounded-lg transition-colors text-left whitespace-nowrap">{label}</button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={() => { if (lastVibe && !loading) handleSubmit(lastVibe); }} disabled={loading} className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all disabled:opacity-40" title="Regenerate">
                        <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>

                      <button onClick={goHome} className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all" title="Home">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Home bar */}
          <div className="flex justify-center py-2">
            <div className="w-16 h-1 rounded-full bg-[#e9e4f5]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}

/* ─── Inline Chat (no phone frame — it's already inside the phone) ─── */

import { useRef, useEffect } from 'react';

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
      if (data.type === 'question') {
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      } else if (data.type === 'ready') {
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
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2 bg-white border border-[#e9e4f5]/60 shadow-sm">
              <p className="text-[12px] text-[#2d2640] leading-relaxed">hey! what are you in the mood for?</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${msg.role === 'user' ? 'rounded-br-md bg-[#8b5cf6] text-white' : 'rounded-bl-md bg-white border border-[#e9e4f5]/60 text-[#2d2640]'}`}>
              <p className="text-[12px] leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white border border-[#e9e4f5]/60 shadow-sm">
              <div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-bounce [animation-delay:0.15s]" /><span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-bounce [animation-delay:0.3s]" /></div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {!hasSent && examples.length > 0 && (
        <div className="px-3 pt-1 pb-1 flex flex-wrap gap-1">
          {examples.map(ex => (
            <button key={ex} onClick={() => { setInput(ex); inputRef.current?.focus(); }} className="rounded-full border border-[#e9e4f5] bg-white/70 px-2 py-0.5 text-[9px] text-[#b8b0c8] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all">
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#e9e4f5]/60 px-3 py-2 bg-white/50">
        {isOwner && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none mb-1.5 px-1">
            <input type="checkbox" checked={useInterests} onChange={e => setUseInterests(e.target.checked)} className="w-3 h-3 rounded accent-[#8b5cf6]" />
            <span className="text-[9px] text-[#b8b0c8]">use my interests</span>
          </label>
        )}
        <div className="flex gap-2 items-center">
          <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder={!hasSent ? 'type your vibe...' : 'reply...'} disabled={loading} className="flex-1 rounded-full bg-[#f5f3ff] border border-[#e9e4f5] px-3 py-1.5 text-[12px] text-[#2d2640] placeholder-[#c4b5fd] focus:outline-none focus:border-[#c4b5fd] disabled:opacity-40" />
          <button onClick={send} disabled={!input.trim() || thinking || loading} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#8b5cf6] text-white shrink-0 transition-all hover:bg-[#7c3aed] active:scale-95 disabled:opacity-30">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
