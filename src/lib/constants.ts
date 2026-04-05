import type { WatchProgress } from '@/types/index';

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
};

export const TYPE_BORDER_COLORS: Record<string, string> = {
  movie: 'border-[#c4b5fd]',
  tv: 'border-[#a7c4a0]',
  anime: 'border-[#c4b5fd]',
  youtube: 'border-[#fca5a5]',
  substack: 'border-[#fdba74]',
  kdrama: 'border-[#f9a8d4]',
  research: 'border-[#93c5fd]',
};

export const TYPE_LABELS: Record<string, string> = {
  movie: 'Movie',
  tv: 'TV Show',
  anime: 'Anime',
  youtube: 'YouTube',
  substack: 'Substack',
  kdrama: 'K-Drama',
  research: 'Research',
};

export const RATING_ORDER: Record<string, number> = {
  felt_things: 0,
  enjoyed: 1,
  watched: 2,
  not_my_thing: 3,
};
