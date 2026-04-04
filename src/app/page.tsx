'use client';

import { useState } from 'react';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import VibeInput from '@/components/VibeInput';
import RecommendationCard from '@/components/RecommendationCard';
import Particles from '@/components/Particles';
import { ContentType, Recommendation } from '@/types/index';

type Screen = 'pick' | 'vibe' | 'result';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('pick');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickType = (type: ContentType) => {
    setSelectedType(type);
    setError(null);
    setRecommendation(null);
    setTimeout(() => setScreen('vibe'), 150);
  };

  const handleSubmit = async (vibe: string) => {
    if (!selectedType) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: selectedType, vibe }),
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

  return (
    <main className="min-h-screen relative overflow-hidden">
      <Particles />

      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6 flex flex-col items-center justify-center min-h-screen">

        {/* Screen 1: Just the four squares */}
        {screen === 'pick' && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <ContentTypeSelector selected={null} onSelect={handlePickType} />
          </div>
        )}

        {/* Screen 2: Vibe input */}
        {screen === 'vibe' && (
          <div className="w-full flex flex-col items-center gap-8 animate-[fadeIn_0.4s_ease-out]">
            <button
              onClick={() => setScreen('pick')}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#e9e4f5] text-[#7c7291] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
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

        {/* Screen 3: Recommendation */}
        {screen === 'result' && recommendation && (
          <div className="w-full flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out] py-16">
            <div className="w-full max-w-sm">
              <RecommendationCard recommendation={recommendation} />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setScreen('vibe')}
                className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#e9e4f5] text-[#7c7291] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
                title="Try different vibe"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={startOver}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8b5cf6] text-white hover:bg-[#7c3aed] transition-all shadow-md shadow-purple-200/50"
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
