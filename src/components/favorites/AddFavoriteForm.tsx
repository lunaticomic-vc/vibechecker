'use client';

import { useState, useEffect } from 'react';
import type { ContentType } from '@/types/index';

interface AddFavoriteFormProps {
  type: ContentType;
  onAdd: (data: { type: ContentType; title: string; metadata?: string }) => void;
  onCancel: () => void;
}

export default function AddFavoriteForm({ type, onAdd, onCancel }: AddFavoriteFormProps) {
  const [title, setTitle] = useState('');
  const [metadata, setMetadata] = useState('');
  const [error, setError] = useState('');
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  // For YouTube: detect URL and fetch video title
  useEffect(() => {
    if (type !== 'youtube') return;
    const ytMatch = title.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/);
    if (!ytMatch) {
      setResolvedTitle(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setResolving(true);
      try {
        const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(title)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title) setResolvedTitle(data.title);
        }
      } catch {}
      setResolving(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [title, type]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    // For YouTube URLs, use the resolved title as the title and keep the URL as metadata/external_id
    if (type === 'youtube' && resolvedTitle) {
      const notes = metadata.trim();
      const meta = notes ? `${title.trim()}\n${notes}` : title.trim();
      onAdd({ type, title: resolvedTitle, metadata: meta });
    } else {
      onAdd({ type, title: title.trim(), metadata: metadata.trim() || undefined });
    }
  }

  const inputClass = "bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]";

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5 space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#7c7291]">
          {type === 'youtube' ? 'Title or YouTube URL' : 'Title'}
        </label>
        <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError(''); setResolvedTitle(null); }} placeholder={type === 'youtube' ? 'Paste a YouTube link or enter a title...' : 'Enter title...'} className={inputClass} autoFocus />
        {type === 'youtube' && resolving && (
          <p className="text-[11px] text-[#b8b0c8]">Fetching video title...</p>
        )}
        {type === 'youtube' && resolvedTitle && (
          <p className="text-[11px] text-[#6b9a65]">Found: {resolvedTitle}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#7c7291]">Notes (optional)</label>
        <textarea value={metadata} onChange={e => setMetadata(e.target.value)} placeholder="Any notes..." rows={2} className={`${inputClass} resize-none`} />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-[#7c7291] hover:text-[#2d2640] transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors">Add</button>
      </div>
    </form>
  );
}
