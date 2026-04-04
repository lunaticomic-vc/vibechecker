'use client';

import type { ProgressWithFavorite } from '@/lib/progress';

interface ProgressCardProps {
  item: ProgressWithFavorite;
  onUpdate: () => void;
}

const STATUS_COLORS = {
  watching: 'bg-[#f0f7ef] text-[#6b9a65] border border-[#a7c4a0]',
  completed: 'bg-[#f3f0ff] text-[#7c3aed] border border-[#c4b5fd]',
  dropped: 'bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]',
};

const TYPE_COLORS = {
  movie: 'bg-[#f3f0ff] text-[#7c3aed]',
  tv: 'bg-[#f0f7ef] text-[#6b9a65]',
  anime: 'bg-[#f5f3ff] text-[#8b5cf6]',
  youtube: 'bg-[#fef2f2] text-[#dc2626]',
};

export default function ProgressCard({ item, onUpdate }: ProgressCardProps) {
  const progressPercent =
    item.total_episodes
      ? Math.round((item.current_episode / item.total_episodes) * 100)
      : null;

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/progress?id=${item.favorite_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    onUpdate();
  }

  return (
    <div className="bg-white border-2 border-[#e9e4f5] rounded-xl overflow-hidden flex flex-col hover:border-[#c4b5fd] hover:shadow-sm transition-all">
      {/* Thumbnail */}
      <div className="relative h-40 bg-[#f5f3ff]">
        {item.favorite_image ? (
          <img src={item.favorite_image} alt={item.favorite_title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#c4b5fd] text-4xl">🎬</div>
        )}
        <span className={`absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[item.favorite_type]}`}>
          {item.favorite_type.toUpperCase()}
        </span>
        <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-2.5 flex-1">
        <h3 className="text-[#2d2640] font-semibold text-sm leading-tight line-clamp-2">
          {item.favorite_title}
        </h3>

        <div className="flex gap-3 items-center">
          <div className="text-center">
            <div className="text-xl font-bold text-[#2d2640]">{item.current_season}</div>
            <div className="text-[10px] text-[#7c7291]">Season</div>
          </div>
          <div className="text-[#c4b5fd] text-lg font-light">×</div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#2d2640]">{item.current_episode}</div>
            <div className="text-[10px] text-[#7c7291]">Episode</div>
          </div>
          {item.total_episodes && (
            <div className="text-[#7c7291] text-[10px] self-end pb-0.5">/ {item.total_episodes}</div>
          )}
        </div>

        {progressPercent !== null && (
          <div className="w-full bg-[#e9e4f5] rounded-full h-1.5">
            <div className="bg-[#8b5cf6] h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        <div className="flex gap-1.5 mt-auto pt-1">
          <button onClick={() => patch({ current_episode: item.current_episode + 1 })} className="flex-1 text-[10px] bg-[#f5f3ff] hover:bg-[#e9e4f5] text-[#7c3aed] font-medium px-2 py-1.5 rounded-lg transition-colors">
            +1 Ep
          </button>
          <button onClick={() => patch({ status: 'completed' })} className="flex-1 text-[10px] bg-[#f0f7ef] hover:bg-[#d4e6d1] text-[#6b9a65] font-medium px-2 py-1.5 rounded-lg transition-colors">
            Done
          </button>
          <button onClick={() => patch({ status: 'dropped' })} className="flex-1 text-[10px] bg-[#fef2f2] hover:bg-[#fecaca] text-[#dc2626] font-medium px-2 py-1.5 rounded-lg transition-colors">
            Drop
          </button>
        </div>
      </div>
    </div>
  );
}
