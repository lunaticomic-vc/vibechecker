'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';

interface Person {
  id: number;
  name: string;
  photo_url: string | null;
  role: string | null;
  metadata: string | null;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ROLE_COLORS: Record<string, string> = {
  actor: 'bg-[#f3f0ff] text-[#7c3aed]',
  director: 'bg-[#f0f7ef] text-[#6b9a65]',
  writer: 'bg-[#fff7ed] text-[#c2410c]',
  musician: 'bg-[#fef2f2] text-[#dc2626]',
  youtuber: 'bg-[#fef2f2] text-[#dc2626]',
  animator: 'bg-[#f5f3ff] text-[#8b5cf6]',
  'voice actor': 'bg-[#f5f3ff] text-[#8b5cf6]',
  creator: 'bg-[#f5f4f7] text-[#7c7291]',
  unknown: 'bg-[#f5f4f7] text-[#7c7291]',
};

export default function PeoplePage() {
  const { data: people = [], isLoading } = useSWR<Person[]>('/api/people', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  async function addPerson() {
    if (!input.trim() || adding) return;
    setAdding(true);
    await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: input.trim() }) });
    setInput('');
    setAdding(false);
    mutate('/api/people');
  }

  async function removePerson(id: number) {
    await fetch(`/api/people?id=${id}`, { method: 'DELETE' });
    mutate('/api/people');
  }

  const filtered = search.trim()
    ? people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : people;

  // Group by role
  const grouped: Record<string, Person[]> = {};
  for (const p of filtered) {
    const role = p.role ?? 'unknown';
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(p);
  }

  return (
    <div className="min-h-screen overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2d2640]">People</h1>
          <p className="text-xs text-[#7c7291] mt-0.5">Creators, actors, and writers you love. Shapes your recommendations.</p>
        </div>

        <div className="flex gap-2 mb-6 max-w-lg">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPerson()}
            placeholder="Add a person..."
            className="flex-1 bg-transparent rounded-xl px-4 py-2.5 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none"
          />
          <button onClick={addPerson} disabled={!input.trim() || adding} className="px-5 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-40 text-white text-sm rounded-xl transition-colors">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>

        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-transparent rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none mb-6" />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#c4b5fd] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : people.length === 0 ? (
          <div className="text-center py-16 text-[#7c7291]">
            <p className="text-base mb-1">No people yet</p>
            <p className="text-xs">Add actors, directors, writers, YouTubers — anyone whose work you love.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([role, persons]) => (
              <div key={role}>
                <h3 className="text-xs font-semibold text-[#7c7291] uppercase tracking-wider mb-3">{role}s</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {persons.map(person => (
                    <div key={person.id} className="relative group bg-white border-2 border-[#e9e4f5] rounded-xl overflow-hidden hover:border-[#c4b5fd] transition-colors">
                      <div className="aspect-square bg-[#f5f3ff] overflow-hidden">
                        {person.photo_url ? (
                          <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#c4b5fd]">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                              <circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-[#2d2640] leading-snug line-clamp-1">{person.name}</p>
                        <span className={`inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${ROLE_COLORS[person.role ?? 'unknown'] ?? ROLE_COLORS.unknown}`}>
                          {person.role ?? 'unknown'}
                        </span>
                      </div>
                      <button
                        onClick={() => removePerson(person.id)}
                        className="absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 text-[#7c7291] hover:bg-red-500 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
