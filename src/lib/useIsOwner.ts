import { useAuth } from '@/components/AuthProvider';

export function useIsOwner() {
  const { isOwner } = useAuth();
  return isOwner;
}
