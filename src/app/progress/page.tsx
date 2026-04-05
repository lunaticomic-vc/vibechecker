'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import ProgressCard from '@/components/progress/ProgressCard';
import StatusDragProvider from '@/components/StatusDragOverlay';
import type { ProgressWithFavorite } from '@/lib/progress';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProgressPage() {
  const [search, setSearch] = useState('');
  const { data: items = [], isLoading } = useSWR<ProgressWithFavorite[]>('/api/progress', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  });

  let filtered = items.filter((i) => i.status === 'watching');
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(i => i.favorite_title.toLowerCase().includes(q));
  }

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    await fetch(`/api/progress?id=${favoriteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    mutate('/api/progress');
  }

  function handleUpdate() {
    mutate('/api/progress');
  }

  return (
    <StatusDragProvider onStatusChange={handleStatusChange}>
    <div className="min-h-screen overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2d2640]">In Progress</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">Hold and drag to change status.</p>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-4" />

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border-2 border-[#e9e4f5] rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-[#7c7291]">
            <div className="text-[#c4b5fd] mb-4 flex justify-center">
              <svg width="48" height="48" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="12" y="14" width="48" height="34" rx="4" /><rect x="16" y="18" width="40" height="26" rx="2" strokeWidth="0.8" opacity="0.4" />
                <path d="M30 48 Q 30 54, 24 58" strokeWidth="1" /><path d="M42 48 Q 42 54, 48 58" strokeWidth="1" /><line x1="22" y1="58" x2="50" y2="58" />
              </svg>
            </div>
            <p className="text-lg font-medium text-[#2d2640]">Nothing in progress</p>
            <p className="text-sm mt-1">Start tracking by getting recommendations!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <ProgressCard key={item.id} item={item} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
    </StatusDragProvider>
  );
}
