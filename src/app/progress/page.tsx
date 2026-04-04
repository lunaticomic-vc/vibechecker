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
    <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#2d2640] mb-1">Watch Progress</h1>
      <p className="text-sm text-[#7c7291] mb-8">Track what you're watching, completed, or dropped.</p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#e9e4f5] pb-0">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              filter === f.value
                ? 'border-[#8b5cf6] text-[#7c3aed]'
                : 'border-transparent text-[#7c7291] hover:text-[#2d2640]'
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
            <div key={i} className="bg-white border-2 border-[#e9e4f5] rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-[#7c7291]">
          <div className="text-5xl mb-4">
            {filter === 'watching' ? '📺' : filter === 'completed' ? '✅' : '🗑'}
          </div>
          <p className="text-lg font-medium text-[#2d2640]">
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
