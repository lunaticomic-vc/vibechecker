'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
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
      {/* Moon orb */}
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="pointer-events-auto relative w-12 h-12 rounded-full transition-all duration-700 ease-out focus:outline-none group"
        aria-label="Menu"
      >
        {/* Moon body */}
        <span
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 35% 35%,
              ${hovering || open ? '#f5f0ff' : '#ebe5f5'} 0%,
              ${hovering || open ? '#e0d6f5' : '#d8d0e8'} 40%,
              ${hovering || open ? '#c8baed' : '#c4bbd8'} 70%,
              ${hovering || open ? '#b5a3e0' : '#b0a6c8'} 100%)`,
            boxShadow: hovering || open
              ? '0 0 40px rgba(196,181,253,0.7), 0 0 80px rgba(196,181,253,0.3), 0 0 120px rgba(196,181,253,0.15), inset -3px -3px 8px rgba(139,92,246,0.15)'
              : '0 0 15px rgba(196,181,253,0.2), 0 0 30px rgba(196,181,253,0.08), inset -3px -3px 8px rgba(139,92,246,0.1)',
          }}
        />

        {/* Craters */}
        <span className="absolute top-2 left-3 w-2 h-2 rounded-full opacity-[0.08]" style={{ background: '#8b5cf6' }} />
        <span className="absolute top-5 right-3 w-1.5 h-1.5 rounded-full opacity-[0.06]" style={{ background: '#8b5cf6' }} />
        <span className="absolute bottom-3 left-5 w-1 h-1 rounded-full opacity-[0.07]" style={{ background: '#8b5cf6' }} />

        {/* Shine glow on hover */}
        <span
          className="absolute inset-[-8px] rounded-full transition-all duration-700 pointer-events-none"
          style={{
            opacity: hovering || open ? 1 : 0,
            background: 'radial-gradient(circle, rgba(196,181,253,0.3) 0%, rgba(196,181,253,0.1) 40%, transparent 70%)',
          }}
        />

        {/* Outer pulse ring */}
        <span
          className="absolute inset-[-4px] rounded-full animate-[moonPulse_4s_ease-in-out_infinite] pointer-events-none"
          style={{
            border: '1px solid rgba(196,181,253,0.15)',
          }}
        />

        {/* Sparkle on hover */}
        <span
          className="absolute -top-1 -right-1 transition-all duration-500 pointer-events-none"
          style={{
            opacity: hovering || open ? 1 : 0,
            transform: hovering || open ? 'scale(1)' : 'scale(0)',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 0L5 10M0 5L10 5" stroke="rgba(196,181,253,0.6)" strokeWidth="1" />
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="rgba(196,181,253,0.3)" strokeWidth="0.5" />
          </svg>
        </span>
      </button>

      {/* Nav dropdown */}
      <div
        className={`pointer-events-auto mt-4 flex flex-col items-center transition-all duration-500 ease-out overflow-hidden ${
          open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/85 backdrop-blur-xl border border-[#e9e4f5] rounded-2xl px-6 py-3 shadow-lg shadow-purple-100/20 flex flex-col gap-0.5">
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
        @keyframes moonPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
