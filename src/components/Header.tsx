'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setContentOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Dithered moon canvas — static on mobile, animated on desktop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = isMobile ? 44 : 52;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    let animId: number;
    let time = 0;

    function draw() {
      const s = size;
      const cx = s / 2;
      const cy = s / 2;
      const r = s / 2 - 2;
      ctx!.clearRect(0, 0, s, s);
      time += 0.015;
      const isActive = hovering || open;

      for (let y = 0; y < s; y += 1) {
        for (let x = 0; x < s; x += 1) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r + 1) continue;

          const crescentFade = Math.max(0, Math.min(1, (dx + r * 0.3) / (r * 1.2)));
          const nx = x / s;
          const ny = y / s;
          const wave = isMobile ? 0 : Math.sin(nx * 10 + time * 2) * 0.1 + Math.sin(ny * 12 - time * 1.5) * 0.08;
          const lightAngle = Math.atan2(dy, dx);
          const lightFade = (Math.cos(lightAngle + 2.4) + 1) * 0.5;
          const base = 0.6 + lightFade * 0.3 + crescentFade * 0.1 + wave;
          const glow = isActive ? 0.15 : 0;
          const dither = (Math.random() - 0.5) * 0.08;
          const val = Math.max(0, Math.min(1, base + dither + glow));
          const edgeFade = dist > r - 1.5 ? Math.max(0, (r + 1 - dist) / 2.5) : 1;

          const rr = Math.round(195 + val * 55);
          const gg = Math.round(185 + val * 60);
          const bb = Math.round(215 + val * 38);
          const alpha = edgeFade * (isActive ? 1 : 0.85);

          ctx!.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${alpha})`;
          ctx!.fillRect(x, y, 1, 1);

          const c1 = Math.sqrt((x - cx + 4) ** 2 + (y - cy - 5) ** 2);
          const c2 = Math.sqrt((x - cx - 6) ** 2 + (y - cy + 3) ** 2);
          const c3 = Math.sqrt((x - cx + 2) ** 2 + (y - cy + 8) ** 2);
          if ((c1 < 4 || c2 < 3 || c3 < 2.5) && Math.random() > 0.5) {
            ctx!.fillStyle = `rgba(170, 160, 195, ${0.15 * edgeFade})`;
            ctx!.fillRect(x, y, 1, 1);
          }
        }
      }

      if (isActive) {
        const gradient = ctx!.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.8);
        gradient.addColorStop(0, 'rgba(196, 181, 253, 0.15)');
        gradient.addColorStop(0.5, 'rgba(196, 181, 253, 0.06)');
        gradient.addColorStop(1, 'rgba(196, 181, 253, 0)');
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, s, s);
      }

      // On mobile, only re-render when active state changes (no continuous animation)
      if (isMobile) return;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, [hovering, open, isMobile]);

  function navClick() {
    setOpen(false);
    setContentOpen(false);
  }

  const linkClass = "px-3 py-2 rounded-lg text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors whitespace-nowrap";

  const moonSize = isMobile ? 44 : 52;

  return (
    <div ref={menuRef} className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      {/* Moon — top left */}
      <div className={`transition-all duration-500 ease-out absolute left-4 sm:left-5 ${open ? 'top-3' : 'top-4 sm:top-5'}`}>
        <button
          onClick={() => { setOpen(v => !v); setContentOpen(false); }}
          onMouseEnter={() => !isMobile && setHovering(true)}
          onMouseLeave={() => !isMobile && setHovering(false)}
          className="pointer-events-auto relative rounded-full focus:outline-none"
          style={{
            width: moonSize,
            height: moonSize,
            filter: hovering || open ? 'drop-shadow(0 0 20px rgba(196,181,253,0.5))' : 'drop-shadow(0 0 8px rgba(196,181,253,0.15))',
            transition: 'filter 0.7s ease',
          }}
          aria-label="Menu"
        >
          <canvas ref={canvasRef} className="w-full h-full rounded-full" />
        </button>
      </div>

      {/* Navigation — horizontal pill on desktop, vertical panel on mobile */}
      <div
        className={`transition-all duration-500 ease-out absolute ${
          isMobile
            ? `left-3 right-3 top-[56px] ${open ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-4'}`
            : `left-[75px] top-5 ${open ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none -translate-x-4'}`
        }`}
      >
        <div
          className="bg-white/50 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 rounded-2xl shadow-lg shadow-purple-200/10"
          style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
        >
          {isMobile ? (
            /* Mobile: vertical stacked nav, full width */
            <div className="flex flex-col gap-0.5 px-4 py-3">
              <Link href="/" onClick={navClick} className={linkClass}>Home</Link>

              {/* Content section */}
              <button
                onClick={() => setContentOpen(v => !v)}
                className={`${linkClass} flex items-center justify-between gap-1 w-full text-left`}
              >
                Content
                <svg className={`w-3 h-3 transition-transform duration-200 ${contentOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {contentOpen && (
                <div className="grid grid-cols-2 gap-0.5 pl-2">
                  <Link href="/movies" onClick={navClick} className={linkClass}>Movies</Link>
                  <Link href="/tv" onClick={navClick} className={linkClass}>TV Shows</Link>
                  <Link href="/anime" onClick={navClick} className={linkClass}>Anime</Link>
                  <Link href="/youtube" onClick={navClick} className={linkClass}>YouTube</Link>
                  <Link href="/substack" onClick={navClick} className={linkClass}>Substack</Link>
                  <Link href="/kdrama" onClick={navClick} className={linkClass}>K-Drama</Link>
                </div>
              )}

              <div className="grid grid-cols-2 gap-0.5">
                <Link href="/progress" onClick={navClick} className={linkClass}>Current</Link>
                <Link href="/interests" onClick={navClick} className={linkClass}>Interests</Link>
                <Link href="/people" onClick={navClick} className={linkClass}>People</Link>
                <Link href="/settings" onClick={navClick} className={linkClass}>Settings</Link>
              </div>
            </div>
          ) : (
            /* Desktop: horizontal pill */
            <div className="flex items-center justify-center gap-1 px-5 py-2.5">
              <Link href="/" onClick={navClick} className={linkClass}>Home</Link>

              {/* Content dropdown */}
              <div className="relative">
                <button
                  onClick={() => setContentOpen(v => !v)}
                  className={`${linkClass} flex items-center gap-1`}
                >
                  Content
                  <svg className={`w-3 h-3 transition-transform duration-200 ${contentOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {contentOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/30 rounded-xl shadow-lg shadow-purple-200/15 py-1.5 min-w-[120px] z-[70]"
                    style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <Link href="/movies" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Movies</Link>
                    <Link href="/tv" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">TV Shows</Link>
                    <Link href="/anime" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Anime</Link>
                    <Link href="/youtube" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">YouTube</Link>
                    <Link href="/substack" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Substack</Link>
                    <Link href="/kdrama" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">K-Drama</Link>
                  </div>
                )}
              </div>

              <Link href="/progress" onClick={navClick} className={linkClass}>Current</Link>
              <Link href="/interests" onClick={navClick} className={linkClass}>Interests</Link>
              <Link href="/people" onClick={navClick} className={linkClass}>People</Link>
              <Link href="/settings" onClick={navClick} className={linkClass}>Settings</Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
