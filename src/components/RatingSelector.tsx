'use client';

import { useState, useEffect } from 'react';
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
  felt_things: 'border-[#c4b5fd] bg-[#f5f3ff] text-[#7c3aed]',
  enjoyed: 'border-[#a7c4a0] bg-[#f0f7ef] text-[#6b9a65]',
  watched: 'border-[#d4d0dc] bg-[#f5f4f7] text-[#7c7291]',
  not_my_thing: 'border-[#fca5a5] bg-[#fef2f2] text-[#dc2626]',
};

export default function RatingSelector({ favoriteId, currentRating, currentReasoning, onRate, compact }: Props) {
  const [selected, setSelected] = useState<RatingValue | undefined>(currentRating);
  const [reasoning, setReasoning] = useState(currentReasoning ?? '');
  const [showReasoning, setShowReasoning] = useState(false);

  useEffect(() => { setSelected(currentRating); }, [currentRating]);

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
        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${RATING_COLORS[current.value]}`}>
          {current.symbol} {current.label}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {RATING_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
              selected === option.value
                ? RATING_COLORS[option.value]
                : 'border-[#e9e4f5] bg-white text-[#7c7291] hover:border-[#c4b5fd]'
            }`}
          >
            {option.symbol} {option.label}
          </button>
        ))}
      </div>

      {showReasoning && needsReasoning && (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={reasoning}
            onChange={e => setReasoning(e.target.value)}
            placeholder={selected === 'felt_things' ? 'What made it special?' : 'What didn\'t work?'}
            className="w-full border border-[#e9e4f5] rounded-lg px-2 py-1 text-[10px] text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]"
            onKeyDown={e => e.key === 'Enter' && handleSubmitReasoning()}
          />
          <button
            onClick={handleSubmitReasoning}
            className="w-full px-2 py-1 text-[10px] bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
