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

      const step = window.innerWidth < 600 ? 4 : 3;
      time += 0.004;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const nx = x / w;
          const ny = y / h;

          // --- Top half: soft lilac-white gradient (sky/shore) ---
          // --- Bottom half: grey dithered waves rocking like water ---

          const shoreY = 0.45 + Math.sin(time * 0.8 + nx * 3) * 0.03; // undulating shore line

          let r, g, b;

          if (ny < shoreY - 0.05) {
            // Sky / upper area: soft lilac to white
            const t = ny / shoreY;
            r = Math.round(248 - t * 8);
            g = Math.round(246 - t * 12);
            b = Math.round(255 - t * 2);

            // Subtle lilac bloom
            const bloom = Math.sin(nx * 5 + time) * 0.5 + 0.5;
            r = Math.round(r - bloom * 6);
            g = Math.round(g - bloom * 10);
          } else {
            // Water area: rocking grey waves with dither
            const waterNy = (ny - shoreY) / (1 - shoreY); // 0 at shore, 1 at bottom

            // Multiple wave layers rocking back and forth
            const wave1 = Math.sin(nx * 8 - time * 2.5 + waterNy * 3) * 0.5;
            const wave2 = Math.sin(nx * 12 + time * 1.8 - waterNy * 5) * 0.3;
            const wave3 = Math.sin((nx + waterNy) * 6 + time * 3.2) * 0.2;
            const wave4 = Math.sin(nx * 20 - time * 4 + waterNy * 8) * 0.1; // fine ripples
            const wave5 = Math.cos(nx * 5 + time * 1.2) * Math.sin(waterNy * 4 - time * 2) * 0.15;

            let wave = wave1 + wave2 + wave3 + wave4 + wave5;

            // Shore foam: bright line near the shore
            const foamDist = Math.max(0, 1 - waterNy * 8);
            const foam = foamDist * (0.5 + 0.5 * Math.sin(nx * 15 - time * 3));
            wave += foam * 0.4;

            // Mouse ripple in water
            if (mouse.active && mouse.y / h > shoreY - 0.1) {
              const mx = mouse.x / w;
              const my = mouse.y / h;
              const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
              if (dist < 0.3) {
                wave += Math.sin(dist * 35 - time * 6) * Math.max(0, 0.3 - dist) * 2;
              }
            }

            const v = (wave + 1.5) / 3; // normalize roughly to 0-1

            // Dither
            const dither = (Math.random() - 0.5) * 0.07;
            const val = Math.max(0, Math.min(1, v + dither));

            // Water colors: light grey with lilac tint
            // Deeper water = slightly darker
            const depth = waterNy * 0.15;
            r = Math.round(225 - depth * 40 + val * 25);
            g = Math.round(222 - depth * 42 + val * 26);
            b = Math.round(235 - depth * 30 + val * 18);
          }

          // Clamp
          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));

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
