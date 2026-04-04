'use client';

import { useState } from 'react';
import { RATING_OPTIONS } from '@/types/index';
import type { RatingValue } from '@/types/index';

interface Props {
  favoriteId: number;
  currentRating?: RatingValue;
  currentReasoning?: string;
  onRate: (favoriteId: number, rating: RatingValue, reasoning?: string) => void;
  compact?: boolean;
}

const RATING_COLORS: Record<RatingValue, string> = {
  felt_things: 'border-purple-500 bg-purple-500/20 text-purple-300',
  enjoyed: 'border-green-500 bg-green-500/20 text-green-300',
  watched: 'border-zinc-500 bg-zinc-500/20 text-zinc-300',
  not_my_thing: 'border-red-500 bg-red-500/20 text-red-300',
};

export default function RatingSelector({ favoriteId, currentRating, currentReasoning, onRate, compact }: Props) {
  const [selected, setSelected] = useState<RatingValue | undefined>(currentRating);
  const [reasoning, setReasoning] = useState(currentReasoning ?? '');
  const [showReasoning, setShowReasoning] = useState(false);

  const needsReasoning = selected === 'felt_things' || selected === 'not_my_thing';

  function handleSelect(value: RatingValue) {
    setSelected(value);
    const option = RATING_OPTIONS.find(o => o.value === value);
    if (option?.hasReasoning) {
      setShowReasoning(true);
    } else {
      setShowReasoning(false);
      setReasoning('');
      onRate(favoriteId, value);
    }
  }

  function handleSubmitReasoning() {
    if (selected) {
      onRate(favoriteId, selected, reasoning || undefined);
      setShowReasoning(false);
    }
  }

  if (compact) {
    const current = RATING_OPTIONS.find(o => o.value === currentRating);
    if (current) {
      return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${RATING_COLORS[current.value]}`}>
          {current.emoji} {current.label}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {RATING_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              selected === option.value
                ? RATING_COLORS[option.value]
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {option.emoji} {option.label}
          </button>
        ))}
      </div>

      {showReasoning && needsReasoning && (
        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            placeholder={selected === 'felt_things' ? 'What made it special?' : 'What didn\'t work for you?'}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            onKeyDown={e => e.key === 'Enter' && handleSubmitReasoning()}
          />
          <button
            onClick={handleSubmitReasoning}
            className="px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg transition-colors shrink-0"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
