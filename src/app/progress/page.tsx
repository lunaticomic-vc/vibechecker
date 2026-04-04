'use client';

import { useState, useEffect, useCallback } from 'react';
import ProgressCard from '@/components/progress/ProgressCard';
import type { ProgressWithFavorite } from '@/lib/progress';

type Filter = 'watching' | 'completed' | 'dropped';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'Currently Watching', value: 'watching' },
  { label: 'Completed', value: 'completed' },
  { label: 'Dropped', value: 'dropped' },
];

export default function ProgressPage() {
  const [items, setItems] = useState<ProgressWithFavorite[]>([]);
  const [filter, setFilter] = useState<Filter>('watching');
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const filtered = items.filter((i) => i.status === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Watch Progress</h1>
      <p className="text-zinc-400 mb-8">Track what you&apos;re watching, completed, or dropped.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-0">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              filter === f.value
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {f.label}
            {!loading && (
              <span className="ml-2 text-xs opacity-60">
                ({items.filter((i) => i.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-zinc-500">
          <div className="text-5xl mb-4">
            {filter === 'watching' ? '📺' : filter === 'completed' ? '✅' : '🗑️'}
          </div>
          <p className="text-lg font-medium text-zinc-400">
            {filter === 'watching' ? 'Nothing in progress' : `No ${filter} items`}
          </p>
          <p className="text-sm mt-1">Start tracking by getting recommendations!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ProgressCard key={item.id} item={item} onUpdate={fetchProgress} />
          ))}
        </div>
      )}
    </div>
  );
}
