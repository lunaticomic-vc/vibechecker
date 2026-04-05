'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';

interface Interest {
  id: number;
  name: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function InterestsPage() {
  const { data: interests = [], isLoading } = useSWR<Interest[]>('/api/interests', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const [input, setInput] = useState('');

  async function addInterest() {
    if (!input.trim()) return;
    await fetch('/api/interests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: input.trim() }) });
    setInput('');
    mutate('/api/interests');
  }

  async function removeInterest(id: number) {
    await fetch(`/api/interests?id=${id}`, { method: 'DELETE' });
    mutate('/api/interests');
  }

  return (
    <main className="min-h-screen px-4 pt-20 pb-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#2d2640] mb-1">Interests</h1>
      <p className="text-xs text-[#7c7291] mb-8">These shape all your recommendations.</p>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addInterest()}
          placeholder="e.g., dark humor, philosophy, visual storytelling..."
          className="flex-1 bg-white border-2 border-[#e9e4f5] rounded-xl px-4 py-2.5 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]"
        />
        <button onClick={addInterest} disabled={!input.trim()} className="px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white text-sm rounded-xl transition-colors">
          Add
        </button>
      </div>

      {isLoading ? (
        <p className="text-[#b8b0c8] text-sm">Loading...</p>
      ) : interests.length === 0 ? (
        <div className="text-center py-16 text-[#b8b0c8]">
          <p className="text-base mb-1">No interests yet</p>
          <p className="text-xs">Add what you care about — it makes recommendations smarter.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interests.map(interest => (
            <span key={interest.id} className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f3ff] border-2 border-[#e9e4f5] rounded-full text-sm text-[#5a5270] hover:border-[#c4b5fd] transition-colors">
              {interest.name}
              <button onClick={() => removeInterest(interest.id)} className="w-4 h-4 flex items-center justify-center rounded-full text-[#c8c2d6] hover:text-red-400 hover:bg-red-50 transition-colors text-xs">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
