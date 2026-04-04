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
    <main className="min-h-[calc(100vh-57px)] relative overflow-hidden">
      <Particles />

      <div className="relative z-10 mx-auto max-w-lg px-4 sm:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-57px)]">

        {/* Screen 1: Pick content type */}
        {screen === 'pick' && (
          <div className="w-full flex flex-col items-center gap-8 animate-[fadeIn_0.4s_ease-out]">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#2d2640]">
                What are you in the mood for?
              </h1>
              <p className="mt-2 text-sm text-[#7c7291]">Pick one and we'll find something perfect.</p>
            </div>
            <ContentTypeSelector selected={null} onSelect={handlePickType} />
          </div>
        )}

        {/* Screen 2: Vibe input */}
        {screen === 'vibe' && (
          <div className="w-full flex flex-col items-center gap-6 animate-[fadeIn_0.4s_ease-out]">
            <button
              onClick={() => setScreen('pick')}
              className="self-start text-sm text-[#7c7291] hover:text-[#7c3aed] transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2d2640]">
                Describe your vibe
              </h1>
              <p className="mt-2 text-sm text-[#7c7291]">
                Tell us how you're feeling and we'll match it.
              </p>
            </div>

            <div className="w-full">
              <VibeInput onSubmit={handleSubmit} loading={loading} />
            </div>

            {error && (
              <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Screen 3: Recommendation result */}
        {screen === 'result' && recommendation && (
          <div className="w-full flex flex-col items-center gap-4 animate-[fadeIn_0.4s_ease-out] py-8">
            <div className="text-center mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2d2640]">
                Here's your pick
              </h1>
            </div>

            <div className="w-full">
              <RecommendationCard recommendation={recommendation} />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setScreen('vibe')}
                className="px-5 py-2.5 text-sm border-2 border-[#e9e4f5] text-[#7c7291] hover:border-[#c4b5fd] hover:text-[#7c3aed] rounded-xl transition-all"
              >
                Try different vibe
              </button>
              <button
                onClick={startOver}
                className="px-5 py-2.5 text-sm bg-[#8b5cf6] text-white hover:bg-[#7c3aed] rounded-xl transition-all"
              >
                Start over
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
