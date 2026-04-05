'use client';

import useSWR, { mutate } from 'swr';
import ProgressCard from '@/components/progress/ProgressCard';
import StatusDragProvider from '@/components/StatusDragOverlay';
import type { ProgressWithFavorite } from '@/lib/progress';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProgressPage() {
  const { data: items = [], isLoading } = useSWR<ProgressWithFavorite[]>('/api/progress', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  });

  const filtered = items.filter((i) => i.status === 'watching');

  async function handleStatusChange(favoriteId: number, newStatus: string) {
    await fetch(`/api/progress?id=${favoriteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    mutate('/api/progress');
  }

  function handleUpdate() {
    mutate('/api/progress');
  }

  return (
    <StatusDragProvider onStatusChange={handleStatusChange}>
    <div className="min-h-screen px-4 pt-20 pb-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#2d2640] mb-1">In Progress</h1>
      <p className="text-sm text-[#7c7291] mb-8">Hold and drag to change status.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border-2 border-[#e9e4f5] rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-[#7c7291]">
          <div className="text-5xl mb-4">📺</div>
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
    </StatusDragProvider>
  );
}
