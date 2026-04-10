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

    const isMobile = window.innerWidth < 768;
    let animationId: number;
    let time = 0;
    let dots: Dot[] = [];
    let ripples: { x: number; y: number; time: number }[] = [];
    let frameCount = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initDots();
    }

    function initDots() {
      const w = canvas!.width;
      const h = canvas!.height;
      const spacing = isMobile ? 14 : 7;
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
      frameCount++;
      // On mobile, only draw every other frame to save CPU
      if (isMobile && frameCount % 2 !== 0) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      const w = canvas!.width;
      const h = canvas!.height;
      time += 0.006;

      // Clear with shore color
      ctx!.fillStyle = '#1a1025';
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
            ctx!.strokeStyle = `rgba(255, 255, 255, ${fade * 0.3 * (1 - ring * 0.3)})`;
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

    resize();
    draw();

    window.addEventListener('resize', resize);
    if (!isMobile) {
      window.addEventListener('click', handleClick);
      window.addEventListener('touchstart', handleTouch);
    }

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (!isMobile) {
        window.removeEventListener('click', handleClick);
        window.removeEventListener('touchstart', handleTouch);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
