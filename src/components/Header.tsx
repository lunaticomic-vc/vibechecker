'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Dithered moon canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 52;
    canvas.width = size;
    canvas.height = size;
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

      for (let y = 0; y < s; y += 2) {
        for (let x = 0; x < s; x += 2) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > r + 1) continue;

          // Crescent: darken the right side
          const crescentFade = Math.max(0, Math.min(1, (dx + r * 0.3) / (r * 1.2)));

          // Surface waves
          const nx = x / s;
          const ny = y / s;
          const wave = Math.sin(nx * 10 + time * 2) * 0.1
            + Math.sin(ny * 12 - time * 1.5) * 0.08
            + Math.sin((nx + ny) * 8 + time) * 0.06;

          // Light direction (top-left)
          const lightAngle = Math.atan2(dy, dx);
          const lightFade = (Math.cos(lightAngle + 2.4) + 1) * 0.5;

          const base = 0.6 + lightFade * 0.3 + crescentFade * 0.1 + wave;
          const glow = isActive ? 0.15 : 0;

          const dither = (Math.random() - 0.5) * 0.12;
          const val = Math.max(0, Math.min(1, base + dither + glow));

          // Edge softness
          const edgeFade = dist > r - 1.5 ? Math.max(0, (r + 1 - dist) / 2.5) : 1;

          // Colors: lilac-grey moon
          const rr = Math.round(195 + val * 55);
          const gg = Math.round(185 + val * 60);
          const bb = Math.round(215 + val * 38);
          const alpha = edgeFade * (isActive ? 1 : 0.85);

          ctx!.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${alpha})`;
          ctx!.fillRect(x, y, 2, 2);

          // Crater dots
          const craterDist1 = Math.sqrt((x - cx + 4) ** 2 + (y - cy - 5) ** 2);
          const craterDist2 = Math.sqrt((x - cx - 6) ** 2 + (y - cy + 3) ** 2);
          const craterDist3 = Math.sqrt((x - cx + 2) ** 2 + (y - cy + 8) ** 2);

          if ((craterDist1 < 4 || craterDist2 < 3 || craterDist3 < 2.5) && Math.random() > 0.5) {
            ctx!.fillStyle = `rgba(170, 160, 195, ${0.15 * edgeFade})`;
            ctx!.fillRect(x, y, 2, 2);
          }
        }
      }

      // Shine halo when active
      if (isActive) {
        const gradient = ctx!.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.8);
        gradient.addColorStop(0, 'rgba(196, 181, 253, 0.15)');
        gradient.addColorStop(0.5, 'rgba(196, 181, 253, 0.06)');
        gradient.addColorStop(1, 'rgba(196, 181, 253, 0)');
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, s, s);
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [hovering, open]);

  return (
    <div ref={menuRef} className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-5 pointer-events-none">
      {/* Moon */}
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="pointer-events-auto relative w-[52px] h-[52px] rounded-full focus:outline-none"
        aria-label="Menu"
        style={{
          filter: hovering || open ? 'drop-shadow(0 0 20px rgba(196,181,253,0.5))' : 'drop-shadow(0 0 8px rgba(196,181,253,0.15))',
          transition: 'filter 0.7s ease',
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-full"
        />
      </button>

      {/* Nav dropdown */}
      <div
        className={`mt-4 flex flex-col items-center transition-all duration-500 ease-out overflow-hidden ${
          open ? 'max-h-48 opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white/85 backdrop-blur-xl border border-[#e9e4f5] rounded-2xl px-6 py-3 shadow-lg shadow-purple-100/20 flex flex-col gap-0.5">
          <Link href="/" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center">
            Home
          </Link>
          <Link href="/favorites" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center">
            Favorites
          </Link>
          <Link href="/progress" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center">
            Progress
          </Link>
          <Link href="/interests" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-sm text-[#2d2640] hover:bg-[#f5f3ff] hover:text-[#7c3aed] transition-colors text-center">
            Interests
          </Link>
        </div>
      </div>
    </div>
  );
}
