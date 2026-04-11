'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/components/AuthProvider';
import LoadingMouse from '@/components/LoadingMouse';

interface Interest {
  id: number;
  name: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function InterestsPage() {
  const { isOwner } = useAuth();
  const { data: interests = [], isLoading } = useSWR<Interest[]>('/api/interests', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const [input, setInput] = useState('');

  async function addInterest() {
    if (!input.trim()) return;
    const res = await fetch('/api/interests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: input.trim() }) });
    if (!res.ok) return;
    setInput('');
    mutate('/api/interests');
  }

  async function removeInterest(id: number) {
    const res = await fetch(`/api/interests?id=${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    mutate('/api/interests');
  }

  return (
    <div className="min-h-screen overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2d2640]">Interests</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">These shape all your recommendations.</p>
        </div>

        {isOwner && (
        <div className="flex gap-2 mb-8 max-w-lg">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addInterest()}
            placeholder="e.g., dark humor, philosophy, visual storytelling..."
            className="flex-1 bg-transparent rounded-xl px-4 py-2.5 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none"
          />
          <button onClick={addInterest} disabled={!input.trim()} className="px-5 py-2.5 text-[#7c3aed] text-sm rounded-xl transition-all backdrop-blur-md bg-white/40 border border-white/50 hover:bg-white/60 shadow-sm disabled:opacity-40">
            Add
          </button>
        </div>
        )}

        {isLoading ? (
          <div className="fixed inset-0 z-30 flex items-center justify-center">
            <LoadingMouse />
          </div>
        ) : interests.length === 0 ? (
          <div className="text-center py-16 text-[#7c7291]">
            <p className="text-base mb-1">No interests yet</p>
            <p className="text-xs">Add what you care about — it makes recommendations smarter.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map(interest => (
              <span key={interest.id} className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#e9e4f5] rounded-full text-sm text-[#5a5270] hover:border-[#c4b5fd] transition-colors">
                {interest.name}
                {isOwner && (
                <button onClick={() => removeInterest(interest.id)} className="w-4 h-4 flex items-center justify-center rounded-full text-[#c8c2d6] hover:text-red-400 hover:bg-red-50 transition-colors text-xs">
                  ×
                </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
