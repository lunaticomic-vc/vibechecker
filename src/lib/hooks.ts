import { useRef } from 'react';
import useSWR from 'swr';
import type { Favorite, Rating, ContentType } from '@/types/index';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useLongPress(
  callback: (x: number, y: number) => void,
  options: { delay?: number; preventDefault?: boolean } = {}
) {
  const { delay = 500, preventDefault = false } = options;
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const didLongPress = useRef(false);

  function onPointerDown(e: React.MouseEvent | React.TouchEvent) {
    if (preventDefault) e.preventDefault();
    didLongPress.current = false;
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    holdTimer.current = setTimeout(() => {
      didLongPress.current = true;
      callback(x, y);
    }, delay);
  }

  function onPointerUp() {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
  }

  return { onPointerDown, onPointerUp, didLongPress };
}

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
