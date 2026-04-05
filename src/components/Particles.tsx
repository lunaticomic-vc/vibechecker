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

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let dots: Dot[] = [];
    let mouse = { x: -1000, y: -1000, active: false };

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initDots();
    }

    function initDots() {
      const w = canvas!.width;
      const h = canvas!.height;
      const spacing = window.innerWidth < 600 ? 10 : 7;
      dots = [];

      for (let y = 0; y < h; y += spacing) {
        for (let x = 0; x < w; x += spacing) {
          // Only create dots for potential sea area (right ~40% of screen + margin)
          if (x < w * 0.3) continue;

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

    function shorelineX(y: number, h: number, t: number): number {
      const ny = y / h;
      const base = 0.45;
      const curve1 = Math.sin(ny * 4 + t * 0.4) * 0.04;
      const curve2 = Math.sin(ny * 7 - t * 0.6) * 0.02;
      const curve3 = Math.sin(ny * 2 + t * 0.2) * 0.03;
      const lap = Math.sin(t * 2.0) * 0.03 + Math.sin(t * 3.2) * 0.015;
      return base + curve1 + curve2 + curve3 + lap;
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      time += 0.006;

      // Clear with shore color
      ctx!.fillStyle = '#d8cfe8';
      ctx!.fillRect(0, 0, w, h);

      for (const dot of dots) {
        const shore = shorelineX(dot.baseY, h, time) * w;
        const distFromShore = dot.baseX - shore;
        const foamWidth = 25 + Math.sin(dot.baseY * 0.02 + time * 2) * 8;

        // Skip if on shore side
        if (distFromShore < -foamWidth) continue;

        const nx = dot.baseX / w;
        const ny = dot.baseY / h;

        // Wave displacement
        const waveX = Math.sin(ny * 3 + time * 1.2 + dot.phase) * 4;
        const waveY = Math.cos(nx * 4 + time * 0.9 + dot.phase) * 2;

        const drawX = dot.baseX + dot.jitterX + waveX;
        const drawY = dot.baseY + dot.jitterY + waveY;

        // Mouse ripple
        let rippleOffset = 0;
        if (mouse.active) {
          const mdx = drawX - mouse.x;
          const mdy = drawY - mouse.y;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (dist < 120) {
            rippleOffset = Math.sin(dist * 0.1 - time * 5) * (120 - dist) * 0.08;
          }
        }

        if (distFromShore < 0) {
          // Foam
          const foamIntensity = 1 - Math.abs(distFromShore) / foamWidth;
          const alpha = 0.15 + foamIntensity * 0.4;
          const v = dot.brightness + 30;
          ctx!.beginPath();
          ctx!.arc(drawX + rippleOffset, drawY, dot.radius * 0.8, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx!.fill();
        } else {
          // Sea
          const seaDepth = Math.min(1, distFromShore / (w * 0.5));

          const wave1 = Math.sin(nx * 6 + ny * 3 + time * 1.2) * 0.12;
          const wave2 = Math.sin(nx * 4 - ny * 5 + time * 0.9) * 0.08;
          const waveVal = wave1 + wave2;

          // Fade out particles that are too sparse
          const density = 0.2 + seaDepth * 0.35 + waveVal;
          if ((dot.phase / (Math.PI * 2)) > density) continue;

          const v = dot.brightness + waveVal * 20 + rippleOffset;
          const alpha = 0.15 + seaDepth * 0.35 + waveVal * 0.15;
          const r = dot.radius + seaDepth;

          ctx!.beginPath();
          ctx!.arc(drawX + rippleOffset, drawY, r, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255, 255, 255, ${Math.min(0.65, Math.max(0.08, alpha))})`;
          ctx!.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }
    function handleTouchMove(e: TouchEvent) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.active = true; }
    function handleLeave() { mouse.active = false; }

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseleave', handleLeave);
    window.addEventListener('touchend', handleLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handleLeave);
      window.removeEventListener('touchend', handleLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
