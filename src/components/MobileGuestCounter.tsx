'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { usePathname } from 'next/navigation';

export default function MobileGuestCounter() {
  const { isOwner, remaining, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  if (!isMobile || isLoading || isOwner || remaining === null || pathname === '/login') return null;

  return (
    <div className="fixed top-4 right-4 z-[60] bg-white/70 backdrop-blur-md border border-[#e9e4f5]/60 rounded-full px-3 py-1 shadow-sm">
      <span className="text-[11px] text-[#7c7291]">
        {remaining === 0 ? 'no recs left' : `${remaining} rec${remaining !== 1 ? 's' : ''} left`}
      </span>
    </div>
  );
}
