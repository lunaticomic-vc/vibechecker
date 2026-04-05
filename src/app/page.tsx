'use client';

import { useState } from 'react';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import VibeInput from '@/components/VibeInput';
import RecommendationCard from '@/components/RecommendationCard';
import Particles from '@/components/Particles';
import { ContentType, DiscoveryMode, Recommendation } from '@/types/index';

type Screen = 'pick' | 'discover' | 'vibe' | 'result';

interface LastWatching {
  favorite_id: number;
  favorite_title: string;
  current_season: number;
  current_episode: number;
  status: string;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('pick');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('something_new');
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWatching, setLastWatching] = useState<LastWatching | null>(null);
  const [lastDismissed, setLastDismissed] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Fetch last watching item on mount
  useState(() => {
    fetch('/api/progress').then(r => r.json()).then((items: LastWatching[]) => {
      const watching = items.find((i: LastWatching) => i.status === 'watching');
      if (watching) setLastWatching(watching);
    }).catch(() => {});
  });

  async function handleMarkCompleted() {
    if (!lastWatching) return;
    await fetch(`/api/progress?id=${lastWatching.favorite_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    setLastDismissed(true);
  }

  async function handleAcceptRec() {
    if (!recommendation || accepting) return;
    setAccepting(true);
    try {
      // Add as favorite
      const favRes = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: recommendation.type,
          title: recommendation.title,
          image_url: recommendation.thumbnailUrl ?? recommendation.imageUrls?.[0],
          metadata: JSON.stringify({ year: recommendation.year, source: 'recommendation' }),
        }),
      });
      const fav = await favRes.json();

      // Add to progress as watching
      if (fav.id) {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            favorite_id: fav.id,
            current_season: 1,
            current_episode: 1,
            status: 'watching',
          }),
        });
      }
    } catch {
      // best effort
    }
    setAccepting(false);
    startOver();
  }

  const handlePickType = (type: ContentType) => {
    setSelectedType(type);
    setError(null);
    setRecommendation(null);
    setTimeout(() => setScreen('discover'), 150);
  };

  const handleDiscovery = (mode: DiscoveryMode) => {
    setDiscoveryMode(mode);
    setScreen('vibe');
  };

  const handleSubmit = async (vibe: string) => {
    if (!selectedType) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: selectedType, vibe, discoveryMode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to get recommendation');
      }

      const data = await res.json();
      setRecommendation(data);
      setScreen('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setScreen('pick');
    setSelectedType(null);
    setRecommendation(null);
    setError(null);
  };

  const libraryLabel = selectedType === 'youtube' ? 'from your subscriptions' : 'from your library';
  const newLabel = selectedType === 'youtube' ? 'new channels' : 'something new';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <Particles />

      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen">

        {/* Screen 1: Just the four squares */}
        {screen === 'pick' && (
          <div className="animate-[fadeIn_0.5s_ease-out] flex flex-col items-center gap-6">
            {/* Last watching banner */}
            {lastWatching && !lastDismissed && (
              <div className="w-full max-w-[340px] sm:max-w-[440px] bg-white/70 backdrop-blur-sm border-2 border-[#e9e4f5] rounded-2xl px-4 py-3 flex items-center gap-3 animate-[fadeIn_0.3s_ease-out]">
                <p className="text-xs text-[#7c7291] flex-1">
                  Add <span className="font-medium text-[#2d2640]">{lastWatching.favorite_title}</span> to completed?
                </p>
                <button
                  onClick={handleMarkCompleted}
                  className="text-[10px] px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors shrink-0"
                >
                  Yes
                </button>
                <button
                  onClick={() => setLastDismissed(true)}
                  className="text-[#c8c2d6] hover:text-[#7c7291] transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <ContentTypeSelector selected={null} onSelect={handlePickType} />
          </div>
        )}

        {/* Screen 2: New or from library */}
        {screen === 'discover' && (
          <div className="w-full flex flex-col items-center gap-6 animate-[fadeIn_0.4s_ease-out]">
            <button
              onClick={() => setScreen('pick')}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <p className="text-sm text-[#b0a8c4] tracking-wide">feel like starting something new?</p>

            <div className="flex flex-col gap-3 w-full max-w-[260px]">
              <button
                onClick={() => handleDiscovery('from_library')}
                className="py-4 px-6 rounded-2xl border-2 border-[#e8e3f3]/80 bg-white/40 text-[#7c7291] text-sm hover:bg-white/70 hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all duration-300"
              >
                {libraryLabel}
              </button>
              <button
                onClick={() => handleDiscovery('something_new')}
                className="py-4 px-6 rounded-2xl border-2 border-[#e8e3f3]/80 bg-white/40 text-[#7c7291] text-sm hover:bg-white/70 hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all duration-300"
              >
                {newLabel}
              </button>
            </div>
          </div>
        )}

        {/* Screen 3: Vibe input */}
        {screen === 'vibe' && (
          <div className="w-full flex flex-col items-center gap-8 animate-[fadeIn_0.4s_ease-out]">
            <button
              onClick={() => setScreen('discover')}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="w-full max-w-sm">
              <VibeInput onSubmit={handleSubmit} loading={loading} />
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
          <div className="w-full flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out] py-16">
            <div className="w-full max-w-sm">
              <RecommendationCard recommendation={recommendation} />
            </div>

            <div className="flex gap-3 mt-2 items-center">
              <button
                onClick={() => setScreen('vibe')}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
                title="Try different vibe"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={startOver}
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
