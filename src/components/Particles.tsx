'use client';

import { useEffect, useRef } from 'react';

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let mouse = { x: -1000, y: -1000, active: false };

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      const imageData = ctx!.createImageData(w, h);
      const data = imageData.data;
      const step = window.innerWidth < 600 ? 3 : 2;
      time += 0.003;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const nx = x / w;
          const ny = y / h;

          // Layered waves — like looking at ocean surface from above
          const wave1 = Math.sin(nx * 5 + ny * 3 + time * 1.5) * 0.15;
          const wave2 = Math.sin(nx * 8 - ny * 4 + time * 2.2) * 0.1;
          const wave3 = Math.sin((nx + ny) * 6 - time * 1.8) * 0.08;
          const wave4 = Math.sin(nx * 12 + ny * 8 + time * 2.8) * 0.04;
          const wave5 = Math.cos(nx * 3 - ny * 7 + time * 1.2) * 0.06;
          // Slow large swell
          const swell = Math.sin(ny * 2 + time * 0.6) * 0.08 + Math.sin(nx * 1.5 - time * 0.4) * 0.05;

          let wave = wave1 + wave2 + wave3 + wave4 + wave5 + swell;

          // Mouse ripple
          if (mouse.active) {
            const mx = mouse.x / w;
            const my = mouse.y / h;
            const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
            if (dist < 0.25) {
              wave += Math.sin(dist * 30 - time * 6) * Math.max(0, 0.25 - dist) * 1.5;
            }
          }

          const v = (wave + 0.6);
          const dither = (Math.random() - 0.5) * 0.04;
          const val = Math.max(0, Math.min(1, v + dither));

          // Lilac-purple ocean palette
          // Light lilac-white at wave peaks, deeper purple in troughs
          const r = Math.round(218 + val * 35);
          const g = Math.round(208 + val * 38);
          const b = Math.round(240 + val * 15);

          for (let dy = 0; dy < step && y + dy < h; dy++) {
            for (let dx = 0; dx < step && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4;
              data[idx] = Math.min(255, r);
              data[idx + 1] = Math.min(255, g);
              data[idx + 2] = Math.min(255, b);
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx!.putImageData(imageData, 0, 0);
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

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" />;
}
