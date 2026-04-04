'use client';

import type { ProgressWithFavorite } from '@/lib/progress';

interface ProgressCardProps {
  item: ProgressWithFavorite;
  onUpdate: () => void;
}

const STATUS_COLORS = {
  watching: 'bg-green-500/20 text-green-400 border border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  dropped: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const TYPE_COLORS = {
  movie: 'bg-purple-500/20 text-purple-400',
  tv: 'bg-yellow-500/20 text-yellow-400',
  anime: 'bg-pink-500/20 text-pink-400',
  youtube: 'bg-red-500/20 text-red-400',
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-40 bg-zinc-800">
        {item.favorite_image ? (
          <img
            src={item.favorite_image}
            alt={item.favorite_title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">
            🎬
          </div>
        )}
        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[item.favorite_type]}`}>
          {item.favorite_type.toUpperCase()}
        </span>
        <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[item.status]}`}>
          {item.status}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
          {item.favorite_title}
        </h3>

        {/* Season / Episode */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{item.current_season}</div>
            <div className="text-xs text-zinc-500">Season</div>
          </div>
          <div className="text-zinc-700 text-2xl font-light self-center">×</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{item.current_episode}</div>
            <div className="text-xs text-zinc-500">Episode</div>
          </div>
          {item.total_episodes && (
            <div className="text-zinc-500 text-xs self-end pb-1">/ {item.total_episodes}</div>
          )}
        </div>

        {/* Progress bar */}
        {progressPercent !== null && (
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => patch({ current_episode: item.current_episode + 1 })}
            className="flex-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1.5 rounded-lg transition-colors"
          >
            +1 Ep
          </button>
          <button
            onClick={() => patch({ status: 'completed' })}
            className="flex-1 text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-2 py-1.5 rounded-lg transition-colors"
          >
            Complete
          </button>
          <button
            onClick={() => patch({ status: 'dropped' })}
            className="flex-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 px-2 py-1.5 rounded-lg transition-colors"
          >
            Drop
          </button>
        </div>
      </div>
    </div>
  );
}
