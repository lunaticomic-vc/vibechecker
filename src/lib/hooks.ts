import useSWR from 'swr';
import type { Favorite, Rating, ContentType } from '@/types/index';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useFavorites(type: ContentType, status: string, limit = 25, offset = 0) {
  const key = `/api/favorites?type=${type}&status=${status}&limit=${limit}&offset=${offset}`;
  return useSWR<{ favorites: Favorite[]; total: number; hasMore: boolean }>(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });
}

export function useRatings() {
  return useSWR<Rating[]>('/api/ratings', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
}

export function useProgress() {
  return useSWR('/api/progress', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
}

export function useInterests() {
  return useSWR('/api/interests', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
}

export function useYouTubeStatus() {
  return useSWR('/api/auth/google/status', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}

export function useMALAccount() {
  return useSWR('/api/accounts/mal', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}
