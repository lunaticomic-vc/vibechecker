export type ContentType = 'movie' | 'tv' | 'anime' | 'youtube' | 'substack';

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
  status: 'watching' | 'completed' | 'dropped' | 'on_hold';
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

export const RATING_OPTIONS: { value: RatingValue; label: string; emoji: string; hasReasoning: boolean }[] = [
  { value: 'felt_things', label: 'It made me feel things', emoji: '💜', hasReasoning: true },
  { value: 'enjoyed', label: 'I enjoyed it', emoji: '👍', hasReasoning: false },
  { value: 'watched', label: 'I watched it', emoji: '👁', hasReasoning: false },
  { value: 'not_my_thing', label: 'Not my thing', emoji: '👎', hasReasoning: true },
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
}

export interface VibeRequest {
  contentType: ContentType;
  vibe: string;
}
