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

      // Use larger step for performance, finer for quality
      const step = window.innerWidth < 600 ? 4 : 3;
      time += 0.006;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const nx = x / w;
          const ny = y / h;

          // Layered smooth waves — always moving
          let wave = Math.sin(nx * 4.5 + time * 1.4) * 0.25
            + Math.sin(ny * 6 - time * 1.1) * 0.2
            + Math.sin((nx * 3 + ny * 4) + time * 0.8) * 0.2
            + Math.sin(Math.sqrt((nx - 0.5) ** 2 + (ny - 0.3) ** 2) * 10 - time * 1.8) * 0.15
            + Math.sin((nx - ny) * 7 + time * 0.5) * 0.1;

          // Mouse ripple
          if (mouse.active) {
            const mx = mouse.x / w;
            const my = mouse.y / h;
            const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
            if (dist < 0.35) {
              wave += Math.sin(dist * 25 - time * 5) * Math.max(0, 0.35 - dist) * 1.5;
            }
          }

          const v = (wave + 1) * 0.5;

          // Dither noise
          const dither = (Math.random() - 0.5) * 0.04;
          const val = Math.max(0, Math.min(1, v + dither));

          // Lilac → white → light grey palette
          // Low val (0): soft lilac rgb(220, 210, 245)
          // Mid val (0.5): white rgb(250, 248, 255)
          // High val (1): light grey-lilac rgb(235, 232, 242)
          let r, g, b;
          if (val < 0.5) {
            const t = val * 2;
            r = Math.round(220 + t * 30);
            g = Math.round(210 + t * 38);
            b = Math.round(245 + t * 10);
          } else {
            const t = (val - 0.5) * 2;
            r = Math.round(250 - t * 15);
            g = Math.round(248 - t * 16);
            b = Math.round(255 - t * 13);
          }

          for (let dy = 0; dy < step && y + dy < h; dy++) {
            for (let dx = 0; dx < step && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx!.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(draw);
    }

    function handleMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }

    function handleTouchMove(e: TouchEvent) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }

    function handleLeave() {
      mouse.active = false;
    }

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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
    />
  );
}
