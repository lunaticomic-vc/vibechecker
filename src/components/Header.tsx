'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-5 pointer-events-none">
      {/* Orb */}
      <button
        onClick={() => setOpen(v => !v)}
        className="pointer-events-auto relative w-10 h-10 rounded-full transition-all duration-500 ease-out focus:outline-none"
        aria-label="Menu"
        style={{
          background: open
            ? 'radial-gradient(circle, rgba(139,92,246,0.9) 0%, rgba(196,181,253,0.6) 60%, transparent 100%)'
            : 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, rgba(196,181,253,0.2) 60%, transparent 100%)',
          boxShadow: open
            ? '0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(139,92,246,0.2)'
            : '0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1)',
        }}
      >
        <span className="absolute inset-0 rounded-full animate-[orbPulse_3s_ease-in-out_infinite]"
          style={{
            background: 'radial-gradient(circle, rgba(196,181,253,0.4) 0%, transparent 70%)',
          }}
        />
      </button>

      {/* Nav dropdown */}
      <div
        className={`pointer-events-auto mt-3 flex flex-col items-center gap-1 transition-all duration-400 ease-out overflow-hidden ${
          open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/90 backdrop-blur-xl border border-[#e9e4f5] rounded-2xl px-6 py-3 shadow-lg shadow-purple-500/5 flex flex-col gap-0.5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center"
          >
            Home
          </Link>
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center"
          >
            Favorites
          </Link>
          <Link
            href="/progress"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center"
          >
            Progress
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
