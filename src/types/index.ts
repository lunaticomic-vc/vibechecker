export const CONTENT_TYPES = ['movie', 'tv', 'anime', 'youtube', 'substack', 'kdrama'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export type FavoriteMetadata =
  | { source: 'recommendation'; description?: string; reasoning?: string; interests?: string[]; actors?: string[]; year?: string }
  | { source: 'manual'; year?: string; description?: string; actors?: string[] }
  | { status?: string }
  | { notes: string };

export function parseFavoriteMetadata(raw: string | undefined): FavoriteMetadata | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FavoriteMetadata;
  } catch {
    // Plain text metadata stored as notes
    return { notes: raw };
  }
}

export interface Favorite {
  id: number;
  type: ContentType;
  title: string;
  external_id?: string;
  metadata?: string;
  image_url?: string;
  created_at: string;
}

export interface WatchProgress {
  id: number;
  favorite_id: number;
  current_season: number;
  current_episode: number;
  total_seasons?: number;
  total_episodes?: number;
  status: 'todo' | 'watching' | 'completed' | 'dropped' | 'on_hold';
  stopped_at?: string;
  updated_at: string;
}

export interface Account {
  id: number;
  platform: 'letterboxd' | 'youtube' | 'myanimelist';
  username: string;
  connected_at: string;
}

export type RatingValue = 'felt_things' | 'enjoyed' | 'watched' | 'not_my_thing';

export interface Rating {
  id: number;
  favorite_id: number;
  rating: RatingValue;
  reasoning?: string;
  created_at: string;
}

export const RATING_OPTIONS: { value: RatingValue; label: string; symbol: string; hasReasoning: boolean }[] = [
  { value: 'felt_things', label: 'felt things', symbol: '♡', hasReasoning: true },
  { value: 'enjoyed', label: 'enjoyed', symbol: '✦', hasReasoning: false },
  { value: 'watched', label: 'okayish', symbol: '◎', hasReasoning: false },
  { value: 'not_my_thing', label: 'not my thing', symbol: '✕', hasReasoning: true },
];

export type DiscoveryMode = 'from_library' | 'something_new';

export interface RedditInsight {
  subreddit: string;
  comment: string;
  score: number;
}

export interface Recommendation {
  title: string;
  type: ContentType;
  description: string;
  reasoning: string;
  actionUrl: string;
  actionLabel: string;
  thumbnailUrl?: string;
  imageUrls?: string[];
  actors?: string[];
  year?: string;
  episodeInfo?: string;
  redditInsights?: RedditInsight[];
  interests?: string[];
  tropes?: string[];
  channelName?: string;
}

export interface VibeRequest {
  contentType: ContentType;
  vibe: string;
}
