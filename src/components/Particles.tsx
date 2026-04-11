'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  baseX: number;
  baseY: number;
  radius: number;
  brightness: number;
  phase: number;
  jitterX: number;
  jitterY: number;
}

// Pre-bucketed alpha strings — avoids ~1.7M string allocations/sec at 60fps
const ALPHA_BUCKETS = 20;
const FILL_STYLES: string[] = Array.from({ length: ALPHA_BUCKETS + 1 }, (_, i) => {
  const a = i / ALPHA_BUCKETS;
  return `rgba(180, 175, 195, ${a.toFixed(2)})`;
});
function styleForAlpha(alpha: number): string {
  const idx = Math.round(Math.max(0, Math.min(1, alpha)) * ALPHA_BUCKETS);
  return FILL_STYLES[idx];
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced-motion — static render only
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const dpr = window.devicePixelRatio || 1;

    let animationId: number | null = null;
    let time = 0;
    let dots: Dot[] = [];
    let ripples: { x: number; y: number; time: number }[] = [];
    let frameCount = 0;
    let logicalW = window.innerWidth;
    let logicalH = window.innerHeight;

    function resize() {
      logicalW = window.innerWidth;
      logicalH = window.innerHeight;
      // Apply devicePixelRatio scaling — fixes blurry canvas on retina
      canvas!.width = Math.floor(logicalW * dpr);
      canvas!.height = Math.floor(logicalH * dpr);
      canvas!.style.width = `${logicalW}px`;
      canvas!.style.height = `${logicalH}px`;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(dpr, dpr);
      initDots();
    }

    // Sea rectangle — full-width lower portion of the viewport, starting at
    // the dock's plank surface so the dock visually rests on the waves.
    const SEA_LEFT = 0;
    const SEA_RIGHT = 1;
    const SEA_TOP = 0.58;
    const SEA_BOTTOM = 1;

    function initDots() {
      const w = logicalW;
      const h = logicalH;
      const spacing = isMobile ? 14 : 7;
      dots = [];

      const x0 = w * SEA_LEFT;
      const x1 = w * SEA_RIGHT;
      const y0 = h * SEA_TOP;
      const y1 = h * SEA_BOTTOM;

      for (let y = y0; y < y1; y += spacing) {
        for (let x = x0; x < x1; x += spacing) {
          dots.push({
            baseX: x,
            baseY: y,
            radius: 2 + Math.random() * 2,
            brightness: 160 + Math.random() * 50,
            phase: Math.random() * Math.PI * 2,
            jitterX: (Math.random() - 0.5) * 3,
            jitterY: (Math.random() - 0.5) * 3,
          });
        }
      }
    }

    function draw() {
      frameCount++;
      // On mobile, only draw every other frame to save CPU
      if (isMobile && frameCount % 2 !== 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      const w = logicalW;
      const h = logicalH;
      time += 0.006;

      // Paint the dark night-sea background across the full canvas
      ctx!.fillStyle = '#1a1025';
      ctx!.fillRect(0, 0, w, h);

      for (const dot of dots) {
        const nx = dot.baseX / w;
        const ny = dot.baseY / h;

        // Per-dot fine wave displacement
        const waveX = Math.sin(ny * 3 + time * 1.2 + dot.phase) * 4;
        const waveY = Math.cos(nx * 4 + time * 0.9 + dot.phase) * 2;

        // Surface wave — the sea's top rises and falls like a real water line.
        // Stacked sines moving in opposite directions at different wavelengths
        // read as a natural undulating surface.
        const surfaceWave =
          Math.sin(nx * 6 + time * 1.5) * 5 +
          Math.sin(nx * 11 - time * 2.2) * 2.5 +
          Math.sin(nx * 3 + time * 0.8) * 2;
        // Depth falloff — full effect at the top of the sea, small residual
        // swell in the deep water. `^1.5` curve keeps the top band lively
        // without making deep dots jitter.
        const seaDepth01 = Math.max(0, Math.min(1, (ny - SEA_TOP) / (1 - SEA_TOP)));
        const surfaceFalloff = Math.pow(1 - seaDepth01, 1.5);
        const surfaceShift = surfaceWave * (0.25 + surfaceFalloff * 1.4);

        const drawX = dot.baseX + dot.jitterX + waveX;
        const drawY = dot.baseY + dot.jitterY + waveY + surfaceShift;

        // Click ripple effects (skip on mobile)
        let rippleOffset = 0;
        if (!isMobile) {
          for (const rip of ripples) {
            const mdx = drawX - rip.x;
            const mdy = drawY - rip.y;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            const age = time - rip.time;
            const waveRadius = age * 300;
            const ringDist = Math.abs(dist - waveRadius);
            if (ringDist < 40 && age < 2) {
              const fade = Math.max(0, 1 - age / 2);
              const ringFade = Math.max(0, 1 - ringDist / 40);
              rippleOffset += Math.sin(dist * 0.15 - age * 8) * 6 * fade * ringFade;
            }
          }
        }

        const wave1 = Math.sin(nx * 6 + ny * 3 + time * 1.2) * 0.12;
        const wave2 = Math.sin(nx * 4 - ny * 5 + time * 0.9) * 0.08;
        const waveVal = wave1 + wave2;

        // Dithered density — fade out dots whose phase bucket is too high
        const density = 0.45 + waveVal;
        if ((dot.phase / (Math.PI * 2)) > density) continue;

        const alpha = 0.3 + waveVal * 0.25;

        ctx!.beginPath();
        ctx!.arc(drawX + rippleOffset, drawY, dot.radius, 0, Math.PI * 2);
        ctx!.fillStyle = styleForAlpha(Math.min(0.7, Math.max(0.12, alpha)));
        ctx!.fill();
      }

      // Draw ripple rings (skip on mobile)
      if (!isMobile) {
        for (const rip of ripples) {
          const age = time - rip.time;
          if (age > 2) continue;
          const fade = Math.max(0, 1 - age / 2);
          for (let ring = 0; ring < 3; ring++) {
            const radius = age * 300 - ring * 30;
            if (radius < 0) continue;
            ctx!.beginPath();
            ctx!.arc(rip.x, rip.y, radius, 0, Math.PI * 2);
            ctx!.strokeStyle = styleForAlpha(fade * 0.3 * (1 - ring * 0.3));
            ctx!.lineWidth = 1.5 - ring * 0.4;
            ctx!.stroke();
          }
        }
        ripples = ripples.filter(r => time - r.time < 2);
      }

      animationId = requestAnimationFrame(draw);
    }

    function handleClick(e: MouseEvent) { ripples.push({ x: e.clientX, y: e.clientY, time }); }
    function handleTouch(e: TouchEvent) { ripples.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, time }); }

    function handleVisibility() {
      if (document.hidden) {
        // Pause the loop to stop burning CPU on a hidden tab
        if (animationId !== null) cancelAnimationFrame(animationId);
        animationId = null;
      } else if (animationId === null && !reducedMotion) {
        animationId = requestAnimationFrame(draw);
      }
    }

    resize();

    if (reducedMotion) {
      // Render a single static frame — no rAF loop
      draw();
      // Prevent the loop from being scheduled again
      if (animationId !== null) cancelAnimationFrame(animationId);
      animationId = null;
    } else {
      animationId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    if (!isMobile) {
      // passive: true lets the browser scroll without waiting on our handler
      window.addEventListener('click', handleClick);
      window.addEventListener('touchstart', handleTouch, { passive: true });
    }

    return () => {
      if (animationId !== null) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (!isMobile) {
        window.removeEventListener('click', handleClick);
        window.removeEventListener('touchstart', handleTouch);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
