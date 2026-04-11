import type { WatchProgress, ContentType } from '@/types/index';

export type StatusGroup = 'Todo' | 'In Progress' | 'On Hold' | 'Completed';

export const PROGRESS_STATUS_MAP: Record<WatchProgress['status'], StatusGroup> = {
  todo: 'Todo',
  watching: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  dropped: 'Completed',
};

export const SECTION_ORDER: StatusGroup[] = ['Todo', 'In Progress', 'On Hold', 'Completed'];

export const statusGroupToApi: Record<StatusGroup, string> = {
  'Todo': 'todo',
  'In Progress': 'watching',
  'On Hold': 'on_hold',
  'Completed': 'completed',
};

export const TYPE_COLORS: Record<string, string> = {
  movie: 'bg-[#f3f0ff] text-[#7c3aed]',
  tv: 'bg-[#f0f7ef] text-[#6b9a65]',
  anime: 'bg-[#f5f3ff] text-[#8b5cf6]',
  youtube: 'bg-[#fef2f2] text-[#dc2626]',
  substack: 'bg-[#fff7ed] text-[#c2410c]',
  kdrama: 'bg-[#fdf2f8] text-[#db2777]',
  research: 'bg-[#f0f4ff] text-[#2563eb]',
  poetry: 'bg-[#fdf2f8] text-[#be185d]',
  short_story: 'bg-[#fffbeb] text-[#b45309]',
  book: 'bg-[#f0fdfa] text-[#0f766e]',
  essay: 'bg-[#f1f5f9] text-[#475569]',
  podcast: 'bg-[#fff1f2] text-[#e11d48]',
  manga: 'bg-[#fef3f2] text-[#c2410c]',
  comic: 'bg-[#eff6ff] text-[#1d4ed8]',
  game: 'bg-[#f0fdf4] text-[#15803d]',
};

export const TYPE_BORDER_COLORS: Record<string, string> = {
  movie: 'border-[#c4b5fd]',
  tv: 'border-[#a7c4a0]',
  anime: 'border-[#c4b5fd]',
  youtube: 'border-[#fca5a5]',
  substack: 'border-[#fdba74]',
  kdrama: 'border-[#f9a8d4]',
  research: 'border-[#93c5fd]',
  poetry: 'border-[#f9a8d4]',
  short_story: 'border-[#fcd34d]',
  book: 'border-[#99f6e4]',
  essay: 'border-[#cbd5e1]',
  podcast: 'border-[#fda4af]',
  manga: 'border-[#fdba74]',
  comic: 'border-[#93c5fd]',
  game: 'border-[#86efac]',
};

export const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  anime: 'Anime',
  youtube: 'YouTube',
  substack: 'Substack',
  kdrama: 'K-Drama',
  research: 'Research',
  poetry: 'Poetry',
  short_story: 'Short Story',
  book: 'Book',
  essay: 'Essay',
  podcast: 'Podcast',
  manga: 'Manga',
  comic: 'Comic',
  game: 'Game',
};

export const TYPE_LABELS_PLURAL: Record<string, string> = {
  movie: 'Movies',
  tv: 'TV Shows',
  anime: 'Anime',
  youtube: 'YouTube',
  substack: 'Substack',
  kdrama: 'K-Drama',
  research: 'Research',
  poetry: 'Poetry',
  short_story: 'Short Stories',
  book: 'Books',
  essay: 'Essays',
  podcast: 'Podcasts',
  manga: 'Manga',
  comic: 'Comics',
  game: 'Games',
};

export const TYPE_EMPTY_MESSAGES: Record<string, string> = {
  movie: 'Nothing in your todo list. Add some!',
  tv: 'Nothing in your todo list.',
  anime: 'Nothing in your todo list. Add some or import from MAL in Settings!',
  youtube: 'Nothing in your todo list. Add some or import from YouTube in Settings!',
  kdrama: 'Nothing in your list. Add some K-dramas!',
  substack: 'Nothing here yet. Add some Substack articles!',
  research: 'Nothing here yet. Add some research topics!',
  poetry: 'Nothing here yet. Add some poems!',
  short_story: 'Nothing here yet. Add some short stories!',
  book: 'Nothing here yet. Add some books!',
  essay: 'Nothing here yet. Add some essays!',
  podcast: 'Nothing here yet. Add some podcasts!',
  manga: 'Nothing here yet. Add some manga!',
  comic: 'Nothing here yet. Add some comics or browse the DC Reading Guide!',
  game: 'Nothing here yet. Add some games!',
};

export const WATCH_TYPES: ContentType[] = ['movie', 'tv', 'anime', 'youtube', 'kdrama'];
export const READ_TYPES: ContentType[] = ['substack', 'book', 'manga', 'comic', 'poetry', 'short_story', 'essay'];
export const DO_TYPES: ContentType[] = ['research', 'podcast', 'game'];

export const RATING_ORDER: Record<string, number> = {
  felt_things: 0,
  enjoyed: 1,
  watched: 2,
  not_my_thing: 3,
};
