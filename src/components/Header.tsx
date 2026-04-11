'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [readOpen, setReadOpen] = useState(false);
  const [doOpen, setDoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setWatchOpen(false);
        setReadOpen(false);
        setDoOpen(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Dithered moon canvas — ImageData-based, pauses when tab hidden, respects reduced-motion
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = isMobile ? 44 : 52;
    const dpr = window.devicePixelRatio || 1;
    const pxSize = Math.floor(size * dpr);
    canvas.width = pxSize;
    canvas.height = pxSize;
    // Pre-allocate one ImageData buffer — write RGBA directly, blit with putImageData.
    // Replaces ~10,816 fillRect(1,1) calls per frame with a single blit.
    const imageData = ctx.createImageData(pxSize, pxSize);
    const data = imageData.data;

    let animId: number | null = null;
    let hidden = false;
    let time = 0;

    function renderFrame() {
      const cxLogical = size / 2;
      const cyLogical = size / 2;
      const rLogical = size / 2 - 2;
      const isActive = hovering || open;

      // Clear buffer to transparent
      for (let i = 0; i < data.length; i += 4) { data[i + 3] = 0; }

      const moonCenters: Array<[number, number, number]> = [
        [4, -5, 4], [-6, 3, 3], [2, 8, 2.5],
      ];

      for (let py = 0; py < pxSize; py++) {
        const y = py / dpr;
        const dy = y - cyLogical;
        for (let px = 0; px < pxSize; px++) {
          const x = px / dpr;
          const dx = x - cxLogical;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > rLogical + 1) continue;

          const crescentFade = Math.max(0, Math.min(1, (dx + rLogical * 0.3) / (rLogical * 1.2)));
          const nx = x / size;
          const ny = y / size;
          const wave = isMobile ? 0 : Math.sin(nx * 10 + time * 2) * 0.1 + Math.sin(ny * 12 - time * 1.5) * 0.08;
          const lightAngle = Math.atan2(dy, dx);
          const lightFade = (Math.cos(lightAngle + 2.4) + 1) * 0.5;
          const base = 0.6 + lightFade * 0.3 + crescentFade * 0.1 + wave;
          const glow = isActive ? 0.15 : 0;
          const dither = (Math.random() - 0.5) * 0.08;
          const val = Math.max(0, Math.min(1, base + dither + glow));
          const edgeFade = dist > rLogical - 1.5 ? Math.max(0, (rLogical + 1 - dist) / 2.5) : 1;

          let rr = Math.round(195 + val * 55);
          let gg = Math.round(185 + val * 60);
          let bb = Math.round(215 + val * 38);
          let alpha = Math.round(edgeFade * (isActive ? 255 : 217));

          // Craters — blend the darker tone on top when random threshold met
          let inCrater = false;
          for (const [cX, cY, cR] of moonCenters) {
            const cd = Math.sqrt((x - cxLogical + cX) ** 2 + (y - cyLogical - cY) ** 2);
            if (cd < cR) { inCrater = true; break; }
          }
          if (inCrater && Math.random() > 0.5) {
            const a2 = 0.15 * edgeFade;
            rr = Math.round(rr * (1 - a2) + 170 * a2);
            gg = Math.round(gg * (1 - a2) + 160 * a2);
            bb = Math.round(bb * (1 - a2) + 195 * a2);
          }

          const i = (py * pxSize + px) * 4;
          data[i] = rr;
          data[i + 1] = gg;
          data[i + 2] = bb;
          data[i + 3] = alpha;
        }
      }

      ctx!.putImageData(imageData, 0, 0);

      // Overlay glow via the 2D canvas context (still efficient — one fillRect)
      if (isActive) {
        // Temporarily set transform to logical coordinates for the gradient
        ctx!.save();
        ctx!.scale(dpr, dpr);
        const gradient = ctx!.createRadialGradient(cxLogical, cyLogical, rLogical * 0.8, cxLogical, cyLogical, rLogical * 1.8);
        gradient.addColorStop(0, 'rgba(196, 181, 253, 0.15)');
        gradient.addColorStop(0.5, 'rgba(196, 181, 253, 0.06)');
        gradient.addColorStop(1, 'rgba(196, 181, 253, 0)');
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, size, size);
        ctx!.restore();
      }
    }

    function tick() {
      if (hidden) return;
      time += 0.015;
      renderFrame();
      if (!isMobile && !reducedMotion) {
        animId = requestAnimationFrame(tick);
      }
    }

    function onVis() {
      hidden = document.hidden;
      if (!hidden && !isMobile && !reducedMotion && animId === null) {
        animId = requestAnimationFrame(tick);
      }
    }

    // Kick off: render once then loop if appropriate
    renderFrame();
    if (!isMobile && !reducedMotion) {
      animId = requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', onVis);
    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [hovering, open, isMobile]);

  function navClick() {
    setOpen(false);
  }

  const linkClass = "px-3 py-1.5 rounded-lg text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors whitespace-nowrap";
  const mobileLinkClass = "px-3 py-2.5 rounded-xl text-sm text-[#2d2640] active:bg-[#f5f3ff] active:text-[#7c3aed] transition-colors";

  const moonSize = isMobile ? 44 : 52;

  return (
    <div ref={menuRef} className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      {/* Moon — top left */}
      <div className={`transition-all duration-500 ease-out absolute left-4 sm:left-5 ${open ? 'top-3' : 'top-4 sm:top-5'}`}>
        <button
          onClick={() => setOpen(v => !v)}
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
            /* Mobile: full-width vertical nav with large touch targets */
            <div className="flex flex-col py-2">
              <Link href="/" onClick={navClick} className={mobileLinkClass}>Home</Link>

              <div className="mx-3 my-1 border-t border-[#e9e4f5]/40" />

              {/* Watch — expandable */}
              <button onClick={() => setWatchOpen(v => !v)} className={`${mobileLinkClass} flex items-center gap-1 text-left`}>
                Watch
                <svg className={`w-3 h-3 transition-transform duration-200 ${watchOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {watchOpen && (
                <div className="grid grid-cols-2 pl-3">
                  <Link href="/movies" onClick={navClick} className={mobileLinkClass}>Movies</Link>
                  <Link href="/tv" onClick={navClick} className={mobileLinkClass}>TV Shows</Link>
                  <Link href="/anime" onClick={navClick} className={mobileLinkClass}>Anime</Link>
                  <Link href="/youtube" onClick={navClick} className={mobileLinkClass}>YouTube</Link>
                  <Link href="/kdrama" onClick={navClick} className={mobileLinkClass}>K-Drama</Link>
                </div>
              )}

              {/* Read — expandable */}
              <button onClick={() => setReadOpen(v => !v)} className={`${mobileLinkClass} flex items-center gap-1 text-left`}>
                Read
                <svg className={`w-3 h-3 transition-transform duration-200 ${readOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {readOpen && (
                <div className="grid grid-cols-2 pl-3">
                  <Link href="/substack" onClick={navClick} className={mobileLinkClass}>Substack</Link>
                  <Link href="/books" onClick={navClick} className={mobileLinkClass}>Books</Link>
                  <Link href="/manga" onClick={navClick} className={mobileLinkClass}>Manga</Link>
                  <Link href="/comics" onClick={navClick} className={mobileLinkClass}>Comics</Link>
                  <Link href="/poetry" onClick={navClick} className={mobileLinkClass}>Poetry</Link>
                  <Link href="/short-stories" onClick={navClick} className={mobileLinkClass}>Short Stories</Link>
                  <Link href="/essays" onClick={navClick} className={mobileLinkClass}>Essays</Link>
                </div>
              )}

              {/* Do — expandable */}
              <button onClick={() => { setWatchOpen(false); setReadOpen(false); }} className={`${mobileLinkClass} flex items-center gap-1 text-left`}>
                Do
              </button>
              <div className="grid grid-cols-2 pl-3">
                <Link href="/research" onClick={navClick} className={mobileLinkClass}>Research</Link>
                <Link href="/podcasts" onClick={navClick} className={mobileLinkClass}>Podcasts</Link>
                <Link href="/games" onClick={navClick} className={mobileLinkClass}>Games</Link>
              </div>

              <div className="mx-3 my-1 border-t border-[#e9e4f5]/40" />

              <div className="grid grid-cols-2">
                <Link href="/progress" onClick={navClick} className={mobileLinkClass}>Current</Link>
                <Link href="/interests" onClick={navClick} className={mobileLinkClass}>Interests</Link>
                <Link href="/people" onClick={navClick} className={mobileLinkClass}>People</Link>
                <Link href="/settings" onClick={navClick} className={mobileLinkClass}>Settings</Link>
              </div>
            </div>
          ) : (
            /* Desktop: horizontal pill */
            <div className="flex items-center justify-center gap-1 px-5 py-2.5">
              <Link href="/" onClick={navClick} className={linkClass}>Home</Link>

              {/* Watch — expandable dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setWatchOpen(v => !v); setReadOpen(false); }}
                  className={`${linkClass} flex items-center gap-1`}
                >
                  Watch
                  <svg className={`w-3 h-3 transition-transform duration-200 ${watchOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {watchOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/30 rounded-xl shadow-lg shadow-purple-200/15 py-1.5 min-w-[120px] z-[70]"
                    style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <Link href="/movies" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Movies</Link>
                    <Link href="/tv" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">TV Shows</Link>
                    <Link href="/anime" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Anime</Link>
                    <Link href="/youtube" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">YouTube</Link>
                    <Link href="/kdrama" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">K-Drama</Link>
                  </div>
                )}
              </div>

              {/* Read — expandable dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setReadOpen(v => !v); setWatchOpen(false); }}
                  className={`${linkClass} flex items-center gap-1`}
                >
                  Read
                  <svg className={`w-3 h-3 transition-transform duration-200 ${readOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {readOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/30 rounded-xl shadow-lg shadow-purple-200/15 py-1.5 min-w-[120px] z-[70]"
                    style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <Link href="/substack" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Substack</Link>
                    <Link href="/books" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Books</Link>
                    <Link href="/manga" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Manga</Link>
                    <Link href="/comics" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Comics</Link>
                    <Link href="/poetry" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Poetry</Link>
                    <Link href="/short-stories" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Short Stories</Link>
                    <Link href="/essays" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Essays</Link>
                  </div>
                )}
              </div>

              {/* Do — expandable dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setDoOpen(v => !v); setWatchOpen(false); setReadOpen(false); }}
                  className={`${linkClass} flex items-center gap-1`}
                >
                  Do
                  <svg className={`w-3 h-3 transition-transform duration-200 ${doOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {doOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/30 rounded-xl shadow-lg shadow-purple-200/15 py-1.5 min-w-[120px] z-[70]"
                    style={{ WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    <Link href="/research" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Research</Link>
                    <Link href="/podcasts" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Podcasts</Link>
                    <Link href="/games" onClick={navClick} className="block px-4 py-1.5 text-xs text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors">Games</Link>
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
