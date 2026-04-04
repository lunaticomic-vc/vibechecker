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

      time += 0.004;

      // Shore line runs vertically — sand on left (~40%), water on right
      // Viewed from above like a bird's eye view of a beach

      for (let y = 0; y < h; y += step) {
        // Shore line undulates per row
        const shoreWave = Math.sin(y / h * 4 + time * 1.5) * 0.03
          + Math.sin(y / h * 8 - time * 0.8) * 0.015
          + Math.sin(y / h * 2 + time * 0.5) * 0.02;
        const shoreX = (0.38 + shoreWave) * w;

        for (let x = 0; x < w; x += step) {
          let r, g, b;

          if (x < shoreX - w * 0.06) {
            // === SAND ===
            const nx = x / w;
            const ny = y / h;
            // Sand texture: warm lilac-white with subtle grain
            const grain = (Math.random() - 0.5) * 6;
            const sandWave = Math.sin(nx * 20 + ny * 15) * 2 + Math.sin(ny * 30 + nx * 8) * 1.5;
            r = Math.round(245 + sandWave + grain);
            g = Math.round(240 + sandWave + grain);
            b = Math.round(248 + sandWave * 0.5 + grain);
          } else if (x < shoreX + w * 0.03) {
            // === FOAM / SHORE EDGE ===
            const foamPos = (x - (shoreX - w * 0.06)) / (w * 0.09);
            const foamWave = Math.sin(y / h * 12 - time * 3) * 0.3
              + Math.sin(y / h * 20 + time * 4) * 0.15;
            const foam = Math.max(0, 1 - Math.abs(foamPos - 0.5 + foamWave) * 3);
            const dither = (Math.random() - 0.5) * 8;

            // Wet sand to foam to water gradient
            const t = foamPos;
            r = Math.round(240 - t * 25 + foam * 15 + dither);
            g = Math.round(237 - t * 28 + foam * 15 + dither);
            b = Math.round(248 - t * 10 + foam * 10 + dither);
          } else {
            // === WATER ===
            const waterStart = shoreX + w * 0.03;
            const waterNx = (x - waterStart) / (w - waterStart); // 0=shore, 1=far right
            const ny = y / h;

            // Layered waves rocking back and forth
            const wave1 = Math.sin(ny * 5 - time * 2.2 + waterNx * 3) * 0.15;
            const wave2 = Math.sin(ny * 10 + time * 1.6 - waterNx * 5) * 0.1;
            const wave3 = Math.sin((ny + waterNx) * 7 + time * 2.8) * 0.08;
            const wave4 = Math.sin(ny * 18 - time * 3.5 + waterNx * 8) * 0.04; // fine ripples
            const wave5 = Math.cos(ny * 4 + time * 1) * Math.sin(waterNx * 6 - time * 1.5) * 0.06;

            let wave = wave1 + wave2 + wave3 + wave4 + wave5;

            // Mouse ripple
            if (mouse.active) {
              const mx = mouse.x / w;
              const my = mouse.y / h;
              const nx = x / w;
              const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
              if (dist < 0.25) {
                wave += Math.sin(dist * 30 - time * 6) * Math.max(0, 0.25 - dist) * 1.2;
              }
            }

            const v = (wave + 0.5);
            const dither = (Math.random() - 0.5) * 0.06;
            const val = Math.max(0, Math.min(1, v + dither));

            // Water color: light grey-blue with lilac tint, darker further from shore
            const depth = waterNx * 0.3;
            r = Math.round(210 - depth * 50 + val * 20);
            g = Math.round(212 - depth * 45 + val * 22);
            b = Math.round(228 - depth * 25 + val * 15);
          }

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
