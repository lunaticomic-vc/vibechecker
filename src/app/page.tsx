'use client';

import { useState } from 'react';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import VibeInput from '@/components/VibeInput';
import RecommendationCard from '@/components/RecommendationCard';
import { ContentType, Recommendation } from '@/types/index';

export default function Home() {
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (vibe: string) => {
    if (!selectedType) return;
    setLoading(true);
    setError(null);
    setRecommendation(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const step = !selectedType ? 1 : 2;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-2xl px-6 py-16 flex flex-col gap-12">

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            What&apos;s your{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              vibe
            </span>
            ?
          </h1>
          <p className="mt-3 text-gray-500">
            Tell us your mood and we&apos;ll find the perfect thing to watch.
          </p>
        </div>

        {/* Step 1: Content Type */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all ${
              selectedType ? 'bg-violet-500 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {selectedType ? '✓' : '1'}
            </span>
            <h2 className="font-semibold text-white">What do you want to watch?</h2>
          </div>
          <ContentTypeSelector selected={selectedType} onSelect={setSelectedType} />
        </section>

        {/* Step 2: Vibe Input */}
        {step >= 2 && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-all ${
                recommendation ? 'bg-violet-500 text-white' : 'bg-white/10 text-gray-400'
              }`}>
                {recommendation ? '✓' : '2'}
              </span>
              <h2 className="font-semibold text-white">Describe your vibe</h2>
            </div>
            <VibeInput onSubmit={handleSubmit} loading={loading} />
          </section>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Result */}
        {recommendation && (
          <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white">
                3
              </span>
              <h2 className="font-semibold text-white">Your recommendation</h2>
            </div>
            <RecommendationCard recommendation={recommendation} />
            <button
              onClick={() => { setRecommendation(null); setSelectedType(null); }}
              className="self-center text-sm text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              Start over
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
