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
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    onAdd({
      type,
      title: title.trim(),
      image_url: imageUrl.trim() || undefined,
      metadata: metadata.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 space-y-4">
      <h3 className="text-base font-semibold text-zinc-100">Add Favorite</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Type *</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as ContentType)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
          >
            <option value="movie">Movie</option>
            <option value="tv">TV Show</option>
            <option value="anime">Anime</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => { setTitle(e.target.value); setError(''); }}
            placeholder="Enter title..."
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-400">Image URL (optional)</label>
        <input
          type="url"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-400">Notes (optional)</label>
        <textarea
          value={metadata}
          onChange={e => setMetadata(e.target.value)}
          placeholder="Any notes about this title..."
          rows={2}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
    </form>
  );
}
