'use client';

import { useState } from 'react';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import VibeInput from '@/components/VibeInput';
import RecommendationCard from '@/components/RecommendationCard';
import { ContentType, Recommendation } from '@/types/index';
import { useIsOwner } from '@/lib/useIsOwner';
import { useAuth } from '@/components/AuthProvider';
import LoadingMouse from '@/components/LoadingMouse';
import { WATCH_TYPES, READ_TYPES, DO_TYPES } from '@/lib/constants';

type Screen = 'pick' | 'type' | 'vibe' | 'result';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('pick');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [activeTab, setActiveTab] = useState<'watch' | 'read' | 'do'>('watch');

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastVibe, setLastVibe] = useState('');
  const isOwner = useIsOwner();
  const { setRemaining } = useAuth();
  const [showRejectReasons, setShowRejectReasons] = useState(false);

  const handlePickType = (type: ContentType) => {
    setSelectedType(type);
    setError(null);
    setRecommendation(null);
    setTimeout(() => setScreen('vibe'), 150);
  };

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

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to get recommendation');
      }

      const data = await res.json();
      if (data.remaining !== undefined) setRemaining(data.remaining);
      setRecommendation(data);
      setScreen('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
      window.dispatchEvent(new CustomEvent('cat-chase', { detail: false }));
    }
  };

  const startOver = () => {
    setScreen('pick');
    setSelectedType(null);
    setRecommendation(null);
    setError(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen relative flex items-center justify-center">
        <LoadingMouse />
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-y-auto">


      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen py-16">

        {/* Screen 1: Watch or Read */}
        {screen === 'pick' && (
          <div className="animate-[fadeIn_0.5s_ease-out] flex flex-row items-center gap-10">
            {(['watch', 'read', 'do'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setScreen('type'); }}
                className="group w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] flex items-center justify-center rounded-3xl border-2 border-[#e8e3f3]/80 bg-white/40 hover:bg-white/70 hover:border-[#d4cee6] hover:shadow-lg hover:shadow-purple-50/40 transition-all duration-500 active:scale-95"
              >
                <span className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-light text-[#d0cadc] group-hover:text-[#b0a8c4] transition-colors duration-500">
                  something to {tab}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Screen 2: Type selector */}
        {screen === 'type' && (
          <div className="animate-[fadeIn_0.5s_ease-out] flex flex-col items-center gap-6 relative">
            <button
              onClick={() => setScreen('pick')}
              aria-label="Go back"
              className="absolute -top-12 w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <ContentTypeSelector
              selected={null}
              onSelect={handlePickType}
              types={activeTab === 'watch' ? WATCH_TYPES : activeTab === 'read' ? READ_TYPES : DO_TYPES}
            />
          </div>
        )}

        {/* Screen 2: Vibe input */}
        {screen === 'vibe' && (
          <div className="w-full flex flex-col items-center gap-8 animate-[fadeIn_0.4s_ease-out]">
            <button
              onClick={() => setScreen('type')}
              aria-label="Go back"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-full max-w-sm">
              <VibeInput onSubmit={handleSubmit} loading={loading} isOwner={isOwner} contentType={selectedType} />
            </div>

            {error && (
              <div className="w-full max-w-sm rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Screen 4: Recommendation */}
        {screen === 'result' && recommendation && (
          <div className="w-full flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out]">
            {loading ? null : (
              <div className="w-full max-w-sm">
                <RecommendationCard recommendation={recommendation} onAccept={startOver} />
              </div>
            )}

            <div className="flex gap-3 mt-2 items-center">
              {/* Save to todo + regenerate */}
              <button
                onClick={async () => {
                  if (!recommendation || loading) return;
                  await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: recommendation.type,
                      title: recommendation.title,
                      external_id: recommendation.actionUrl,
                      image_url: recommendation.thumbnailUrl ?? recommendation.imageUrls?.[0],
                      metadata: JSON.stringify({ year: recommendation.year, source: 'recommendation', description: recommendation.description, reasoning: recommendation.reasoning, interests: recommendation.interests, actors: recommendation.actors, redditInsights: recommendation.redditInsights }),
                    }),
                  });
                  if (lastVibe) handleSubmit(lastVibe);
                }}
                disabled={loading}
                aria-label="Save to todo and show another"
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all disabled:opacity-40"
                title="Save to todo and show another"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* Reject with reason */}
              <div className="relative">
                <button
                  onClick={() => setShowRejectReasons(v => !v)}
                  disabled={loading}
                  aria-label="Reject and never show again"
                  className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-red-300 hover:text-red-400 transition-all disabled:opacity-40"
                  title="Reject and never show again"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {showRejectReasons && !loading && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col gap-1 bg-white/95 backdrop-blur-sm border-2 border-[#e9e4f5] rounded-xl p-2 shadow-lg z-20 min-w-[140px] animate-[fadeIn_0.15s_ease-out]">
                    {[
                      { value: 'wrong_vibe', label: 'Wrong vibe' },
                      { value: 'already_seen', label: 'Already seen' },
                      { value: 'too_mainstream', label: 'Too mainstream' },
                      { value: 'not_interested', label: 'Not interested' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={async () => {
                          if (!recommendation) return;
                          setShowRejectReasons(false);
                          try {
                            await fetch('/api/rejected', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: recommendation.title, type: recommendation.type, reason: value }),
                            });
                          } catch { /* best effort */ }
                          if (lastVibe) handleSubmit(lastVibe);
                        }}
                        className="text-[11px] text-[#5a5270] hover:bg-[#f5f3ff] hover:text-[#7c3aed] px-3 py-1.5 rounded-lg transition-colors text-left whitespace-nowrap"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Regenerate */}
              <button
                onClick={() => { if (lastVibe && !loading) handleSubmit(lastVibe); }}
                disabled={loading}
                aria-label="Regenerate with same vibe"
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all disabled:opacity-40"
                title="Regenerate with same vibe"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {/* Start over */}
              <button
                onClick={startOver}
                aria-label="Start over"
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
                title="Start over"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
                </svg>
              </button>
            </div>
          </div>
        )}
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
