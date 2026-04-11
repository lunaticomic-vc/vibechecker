'use client';

import { useState } from 'react';
import ContentLibraryPage from '@/components/ContentLibraryPage';
import { useAuth } from '@/components/AuthProvider';
import {
  CHARACTER_GUIDES,
  CHARACTER_LABELS,
  CHARACTER_ICONS,
  MAJOR_EVENTS,
  STARTING_POINTS,
  ERA_LABELS,
  ERA_COLORS,
  type GuideCharacter,
  type ReadingGuideEntry,
  type EventEntry,
} from '@/lib/dc-reading-guide';

type ComicsView = 'library' | 'guide';
type GuideSection = 'start' | 'characters' | 'events';

export default function ComicsPage() {
  const { isOwner } = useAuth();
  const [view, setView] = useState<ComicsView>('library');

  if (view === 'library') {
    return (
      <div className="relative z-10">
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          <button
            onClick={() => setView('library')}
            className="px-4 py-2 text-sm rounded-xl border transition-all border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]"
          >
            My Library
          </button>
          <button
            onClick={() => setView('guide')}
            className="px-4 py-2 text-sm rounded-xl border transition-all border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640] bg-white/40"
          >
            DC Reading Guide
          </button>
        </div>
        <ContentLibraryPage contentType="comic" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-y-auto relative z-10">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#2d2640]">Comics</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('library')}
            className="px-4 py-2 text-sm rounded-xl border transition-all border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640] bg-white/40"
          >
            My Library
          </button>
          <button
            onClick={() => setView('guide')}
            className="px-4 py-2 text-sm rounded-xl border transition-all border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8]"
          >
            DC Reading Guide
          </button>
        </div>

        <DCReadingGuide isOwner={isOwner} />
      </div>
    </div>
  );
}

/* ─── DC Reading Guide ─── */

function DCReadingGuide({ isOwner }: { isOwner: boolean }) {
  const [section, setSection] = useState<GuideSection>('start');
  const [selectedCharacter, setSelectedCharacter] = useState<GuideCharacter | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  async function addToLibrary(entry: ReadingGuideEntry | EventEntry) {
    const key = entry.title;
    if (adding === key) return;
    setAdding(key);
    try {
      const writer = 'writer' in entry ? entry.writer : '';
      const meta = JSON.stringify({
        source: 'manual',
        description: entry.description,
        reasoning: `From DC Reading Guide. ${writer ? `Written by ${writer}.` : ''} ${entry.era ? ERA_LABELS[entry.era] + ' era.' : ''}`,
      });
      let image_url: string | undefined;
      try {
        const imgRes = await fetch(`/api/image?title=${encodeURIComponent(entry.title)}&type=comic`);
        const imgData = await imgRes.json();
        if (imgData.image_url) image_url = imgData.image_url;
      } catch { /* image lookup is best-effort */ }
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comic', title: entry.title, metadata: meta, image_url }),
      });
    } finally {
      setAdding(null);
    }
  }

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'start' as const, label: 'Where to Start' },
          { key: 'characters' as const, label: 'By Character' },
          { key: 'events' as const, label: 'Major Events' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSection(key); setSelectedCharacter(null); }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              section === key
                ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'start' && <StartingPointsSection isOwner={isOwner} onAdd={addToLibrary} adding={adding} />}
      {section === 'characters' && (
        <CharacterGuideSection
          isOwner={isOwner}
          onAdd={addToLibrary}
          adding={adding}
          selected={selectedCharacter}
          onSelect={setSelectedCharacter}
        />
      )}
      {section === 'events' && <EventsSection isOwner={isOwner} onAdd={addToLibrary} adding={adding} />}
    </>
  );
}

function StartingPointsSection({ isOwner, onAdd, adding }: { isOwner: boolean; onAdd: (e: ReadingGuideEntry) => void; adding: string | null }) {
  return (
    <div className="space-y-8">
      {STARTING_POINTS.map(sp => (
        <div key={sp.label}>
          <h3 className="text-lg font-medium text-[#2d2640] mb-1">{sp.label}</h3>
          <p className="text-xs text-[#7c7291] mb-4">{sp.description}</p>
          <div className="grid gap-3">
            {sp.entries.map(entry => (
              <GuideEntryCard key={entry.title} entry={entry} isOwner={isOwner} onAdd={() => onAdd(entry)} adding={adding === entry.title} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CharacterGuideSection({
  isOwner, onAdd, adding, selected, onSelect,
}: {
  isOwner: boolean;
  onAdd: (e: ReadingGuideEntry) => void;
  adding: string | null;
  selected: GuideCharacter | null;
  onSelect: (c: GuideCharacter | null) => void;
}) {
  const characters = Object.keys(CHARACTER_GUIDES) as GuideCharacter[];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {characters.map(c => (
          <button
            key={c}
            onClick={() => onSelect(selected === c ? null : c)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
              selected === c
                ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                : 'border-[#e9e4f5] text-[#7c7291] hover:text-[#2d2640] bg-white/40'
            }`}
          >
            <span className="opacity-60">{CHARACTER_ICONS[c]}</span>
            {CHARACTER_LABELS[c]}
          </button>
        ))}
      </div>

      {selected ? (
        <div>
          <h3 className="text-lg font-medium text-[#2d2640] mb-1">{CHARACTER_LABELS[selected]} Reading Order</h3>
          <p className="text-xs text-[#7c7291] mb-4">Essential runs in recommended reading order</p>
          <div className="grid gap-3">
            {CHARACTER_GUIDES[selected].map((entry, i) => (
              <GuideEntryCard key={entry.title} entry={entry} index={i + 1} isOwner={isOwner} onAdd={() => onAdd(entry)} adding={adding === entry.title} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-[#b0a8c4] py-12 text-sm">Pick a character to see their reading order</p>
      )}
    </div>
  );
}

function EventsSection({ isOwner, onAdd, adding }: { isOwner: boolean; onAdd: (e: EventEntry) => void; adding: string | null }) {
  return (
    <div>
      <p className="text-xs text-[#7c7291] mb-4">Major crossover events that shaped the DC Universe, in chronological order</p>
      <div className="grid gap-3">
        {MAJOR_EVENTS.map(event => (
          <div key={event.title} className="rounded-xl border border-[#e9e4f5]/60 bg-white/30 backdrop-blur-sm p-4 hover:bg-white/50 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-medium text-[#2d2640] text-sm">{event.title}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ERA_COLORS[event.era]}`}>{ERA_LABELS[event.era]}</span>
                </div>
                <p className="text-[11px] text-[#7c7291] mb-1">{event.writer} · {event.year} · {event.issueCount}</p>
                <p className="text-xs text-[#5a5270] leading-relaxed">{event.description}</p>
                {event.essentialTieIns && (
                  <p className="text-[10px] text-[#b0a8c4] mt-2">Essential tie-ins: {event.essentialTieIns.join(', ')}</p>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => onAdd(event)}
                  disabled={adding === event.title}
                  className="shrink-0 px-3 py-1.5 text-[10px] rounded-lg border border-[#e9e4f5] text-[#7c7291] hover:border-[#93c5fd] hover:text-[#1d4ed8] transition-all disabled:opacity-50"
                >
                  {adding === event.title ? 'Adding...' : '+ Add'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideEntryCard({
  entry, index, isOwner, onAdd, adding,
}: {
  entry: ReadingGuideEntry;
  index?: number;
  isOwner: boolean;
  onAdd: () => void;
  adding: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#e9e4f5]/60 bg-white/30 backdrop-blur-sm p-4 hover:bg-white/50 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {index && <span className="text-[10px] text-[#b0a8c4] font-mono">{index}.</span>}
            <h4 className="font-medium text-[#2d2640] text-sm">{entry.title}</h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ERA_COLORS[entry.era]}`}>{ERA_LABELS[entry.era]}</span>
            {entry.imprint && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-300 bg-zinc-100 text-zinc-600">{entry.imprint}</span>
            )}
          </div>
          <p className="text-[11px] text-[#7c7291] mb-1">
            {entry.writer}
            {entry.artist ? ` · ${entry.artist}` : ''}
            {' · '}{entry.year}
            {entry.issueCount ? ` · ${entry.issueCount}` : ''}
          </p>
          <p className="text-xs text-[#5a5270] leading-relaxed">{entry.description}</p>
        </div>
        {isOwner && (
          <button
            onClick={onAdd}
            disabled={adding}
            className="shrink-0 px-3 py-1.5 text-[10px] rounded-lg border border-[#e9e4f5] text-[#7c7291] hover:border-[#93c5fd] hover:text-[#1d4ed8] transition-all disabled:opacity-50"
          >
            {adding ? 'Adding...' : '+ Add'}
          </button>
        )}
      </div>
    </div>
  );
}
