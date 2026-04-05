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
      const step = window.innerWidth < 600 ? 3 : 2;
      time += 0.003;

      // Wave rocks back and forth
      const waveCycle = Math.sin(time * 1.2) * 0.04 + Math.sin(time * 0.5) * 0.02;

      // First pass: fill entire canvas with two solid halves
      ctx!.fillStyle = '#f8f5ff'; // sand — light lilac-white
      ctx!.fillRect(0, 0, w, h);

      // Draw water as solid grey on right half, with wavy edge
      ctx!.beginPath();
      // Start from top-right
      ctx!.moveTo(w, 0);

      // Draw the wavy shore edge from top to bottom
      for (let y = 0; y <= h; y += 2) {
        const ny = y / h;
        const edgeWave =
          Math.sin(ny * 3.5 + time * 0.8) * 0.04 +
          Math.sin(ny * 7 - time * 0.6) * 0.02 +
          Math.sin(ny * 12 + time * 1.5) * 0.008;
        const shoreX = (0.45 + waveCycle + edgeWave) * w;
        ctx!.lineTo(shoreX, y);
      }

      // Close the path along the right and top edges
      ctx!.lineTo(w, h);
      ctx!.lineTo(w, 0);
      ctx!.closePath();

      // Fill solid grey water
      ctx!.fillStyle = '#d5d2dc';
      ctx!.fill();

      // Second pass: draw dithered wave texture on top of the water
      const imageData = ctx!.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let y = 0; y < h; y += step) {
        const ny = y / h;
        const edgeWave =
          Math.sin(ny * 3.5 + time * 0.8) * 0.04 +
          Math.sin(ny * 7 - time * 0.6) * 0.02 +
          Math.sin(ny * 12 + time * 1.5) * 0.008;
        const shoreEdge = (0.45 + waveCycle + edgeWave) * w;
        const foamWidth = w * (0.035 + Math.sin(ny * 5 + time * 2) * 0.01);

        for (let x = 0; x < w; x += step) {
          const nx = x / w;

          if (x < shoreEdge - foamWidth) {
            // === SAND — add subtle grain texture ===
            const sandGrain = (Math.random() - 0.5) * 4;
            const sandTex = Math.sin(nx * 30 + ny * 25) * 2;
            const wetness = Math.max(0, 1 - (shoreEdge - foamWidth - x) / (w * 0.06));

            const r = Math.round(248 - wetness * 15 + sandTex + sandGrain);
            const g = Math.round(244 - wetness * 18 + sandTex + sandGrain);
            const b = Math.round(252 - wetness * 8 + sandTex * 0.5 + sandGrain);

            for (let dy = 0; dy < step && y + dy < h; dy++) {
              for (let dx = 0; dx < step && x + dx < w; dx++) {
                const idx = ((y + dy) * w + (x + dx)) * 4;
                data[idx] = Math.max(0, Math.min(255, r));
                data[idx + 1] = Math.max(0, Math.min(255, g));
                data[idx + 2] = Math.max(0, Math.min(255, b));
              }
            }

          } else if (x < shoreEdge + foamWidth) {
            // === FOAM — dithered white dots ===
            const foamPos = (x - (shoreEdge - foamWidth)) / (foamWidth * 2);
            const foamNoise = Math.random();
            const foamCurve = Math.sin(foamPos * Math.PI);
            const foamDetail = Math.sin(ny * 20 + time * 4) * 0.2;
            const isFoam = (foamCurve + foamDetail) > 0.3 + foamNoise * 0.4;

            if (isFoam) {
              for (let dy = 0; dy < step && y + dy < h; dy++) {
                for (let dx = 0; dx < step && x + dx < w; dx++) {
                  const idx = ((y + dy) * w + (x + dx)) * 4;
                  data[idx] = 252;
                  data[idx + 1] = 250;
                  data[idx + 2] = 254;
                }
              }
            }

          } else {
            // === WATER — dithered wave texture over the solid grey ===
            const waterStart = shoreEdge + foamWidth;
            const waterNx = Math.min(1, (x - waterStart) / (w - waterStart));

            const waveRock = Math.sin(time * 1.2);
            const wave =
              Math.sin(ny * 4 + time * 2 * waveRock + waterNx * 3) * 0.12 +
              Math.sin(ny * 9 - time * 1.5 + waterNx * 6) * 0.08 +
              Math.sin((ny + waterNx) * 7 + time * 2.8) * 0.06 +
              Math.sin(ny * 16 - time * 3 + waterNx * 10) * 0.03;

            // Mouse ripple
            let ripple = 0;
            if (mouse.active) {
              const mx = mouse.x / w;
              const my = mouse.y / h;
              const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
              if (dist < 0.2) {
                ripple = Math.sin(dist * 35 - time * 7) * Math.max(0, 0.2 - dist) * 1.5;
              }
            }

            const v = wave + ripple;
            const dither = (Math.random() - 0.5) * 0.06;
            const val = v + dither;

            // Modulate the base grey water color with wave brightness
            const depth = waterNx * 0.2;
            const baseR = 195 - depth * 20;
            const baseG = 193 - depth * 20;
            const baseB = 205 - depth * 15;

            const r = Math.round(baseR + val * 25);
            const g = Math.round(baseG + val * 25);
            const b = Math.round(baseB + val * 20);

            for (let dy = 0; dy < step && y + dy < h; dy++) {
              for (let dx = 0; dx < step && x + dx < w; dx++) {
                const idx = ((y + dy) * w + (x + dx)) * 4;
                data[idx] = Math.max(0, Math.min(255, r));
                data[idx + 1] = Math.max(0, Math.min(255, g));
                data[idx + 2] = Math.max(0, Math.min(255, b));
              }
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
