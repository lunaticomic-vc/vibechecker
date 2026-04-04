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

      const step = 2; // skip pixels for performance
      time += 0.008;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          // Smooth wave distortion
          const nx = x / w;
          const ny = y / h;

          // Base wave layers
          let wave = Math.sin(nx * 6 + time * 1.2) * 0.3
            + Math.sin(ny * 8 - time * 0.9) * 0.25
            + Math.sin((nx + ny) * 5 + time * 0.7) * 0.2
            + Math.sin(Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) * 12 - time * 1.5) * 0.15;

          // Mouse interaction: ripple from cursor
          if (mouse.active) {
            const mx = mouse.x / w;
            const my = mouse.y / h;
            const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
            wave += Math.sin(dist * 30 - time * 4) * Math.max(0, 0.4 - dist) * 1.2;
          }

          // Normalize to 0-1
          const v = (wave + 1) * 0.5;

          // Dithering: add subtle noise
          const dither = (Math.random() - 0.5) * 0.06;
          const val = Math.max(0, Math.min(1, v + dither));

          // Lilac to white gradient
          // lilac: rgb(210, 195, 250) → white: rgb(252, 250, 255)
          const r = Math.round(210 + val * 42);
          const g = Math.round(195 + val * 55);
          const b = Math.round(250 + val * 5);

          // Fill stepped pixels
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
