'use client';

import { useState } from 'react';
import type { ContentType } from '@/types/index';

interface AddFavoriteFormProps {
  onAdd: (data: { type: ContentType; title: string; image_url?: string; metadata?: string }) => void;
  onCancel: () => void;
}

export default function AddFavoriteForm({ onAdd, onCancel }: AddFavoriteFormProps) {
  const [type, setType] = useState<ContentType>('movie');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [metadata, setMetadata] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    onAdd({ type, title: title.trim(), image_url: imageUrl.trim() || undefined, metadata: metadata.trim() || undefined });
  }

  const inputClass = "bg-white border-2 border-[#e9e4f5] rounded-lg px-3 py-2 text-sm text-[#2d2640] placeholder-[#b8b0c8] focus:outline-none focus:border-[#c4b5fd]";

  return (
    <form onSubmit={handleSubmit} className="bg-white border-2 border-[#e9e4f5] rounded-xl p-5 space-y-4">
      <h3 className="text-base font-semibold text-[#2d2640]">Add Favorite</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7c7291]">Type *</label>
          <select value={type} onChange={e => setType(e.target.value as ContentType)} className={inputClass}>
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
            <option value="anime">Anime</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[#7c7291]">Title *</label>
          <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError(''); }} placeholder="Enter title..." className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[#7c7291]">Image URL (optional)</label>
        <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className={inputClass} />
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
