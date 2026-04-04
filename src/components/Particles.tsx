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

      // Shore runs vertically — sand left (~45%), water fills entire right side
      // Wave edge rocks toward shore then pulls back
      const waveCycle = Math.sin(time * 1.2) * 0.04 + Math.sin(time * 0.5) * 0.02;

      for (let y = 0; y < h; y += step) {
        // Shore edge — organic wavy line running top to bottom
        const ny = y / h;
        const edgeWave =
          Math.sin(ny * 3.5 + time * 0.8) * 0.04 +
          Math.sin(ny * 7 - time * 0.6) * 0.02 +
          Math.sin(ny * 12 + time * 1.5) * 0.008;

        // Base shore position ~45% from left, rocking with waveCycle
        const shoreEdge = (0.45 + waveCycle + edgeWave) * w;

        // Foam band width oscillates
        const foamWidth = w * (0.04 + Math.sin(ny * 5 + time * 2) * 0.015);

        for (let x = 0; x < w; x += step) {
          let r, g, b;
          const nx = x / w;

          if (x < shoreEdge - foamWidth * 2) {
            // === SAND — soft warm lilac-white ===
            const sandGrain = (Math.random() - 0.5) * 3;
            const sandPattern = Math.sin(nx * 30 + ny * 25) * 1.5 + Math.sin(ny * 50 + nx * 12) * 0.8;

            // Wet sand gradient near shore
            const wetness = Math.max(0, 1 - (shoreEdge - foamWidth * 2 - x) / (w * 0.08));

            r = Math.round(248 - wetness * 12 + sandPattern + sandGrain);
            g = Math.round(244 - wetness * 14 + sandPattern + sandGrain);
            b = Math.round(252 - wetness * 6 + sandPattern * 0.5 + sandGrain);

          } else if (x < shoreEdge + foamWidth) {
            // === FOAM EDGE — white frothy line ===
            const foamPos = (x - (shoreEdge - foamWidth * 2)) / (foamWidth * 3);

            // Foam intensity — peaks at the edge, dithered
            const foamNoise = Math.random() * 0.3;
            const foamCurve = Math.sin(foamPos * Math.PI);
            const foamDetail = Math.sin(ny * 20 + time * 4) * 0.15 + Math.sin(ny * 35 - time * 6) * 0.08;
            const foam = foamCurve * 0.7 + foamDetail + foamNoise;

            // Dither the foam — scattered white dots on grey
            const isFoamDot = foam > 0.4 + Math.random() * 0.3;

            if (isFoamDot) {
              // White foam
              r = Math.round(250 + Math.random() * 5);
              g = Math.round(248 + Math.random() * 5);
              b = Math.round(252 + Math.random() * 3);
            } else {
              // Transition zone
              const t = foamPos;
              r = Math.round(238 - t * 20 + Math.random() * 4);
              g = Math.round(235 - t * 22 + Math.random() * 4);
              b = Math.round(245 - t * 12 + Math.random() * 3);
            }

          } else {
            // === WATER — light grey dithered waves ===
            const waterStart = shoreEdge + foamWidth;
            const waterNx = Math.min(1, (x - waterStart) / (w - waterStart));

            // Multiple wave layers — rocking toward shore and pulling back
            const waveRock = Math.sin(time * 1.2); // main rock cycle
            const wave1 = Math.sin(ny * 4 + time * 2 * waveRock + waterNx * 3) * 0.12;
            const wave2 = Math.sin(ny * 9 - time * 1.5 + waterNx * 6) * 0.08;
            const wave3 = Math.sin((ny * 6 + waterNx * 4) + time * 2.5) * 0.06;
            const wave4 = Math.sin(ny * 16 - time * 3 + waterNx * 10) * 0.03; // fine ripples
            const wave5 = Math.cos(ny * 3 + time * 0.8) * Math.sin(waterNx * 5 - time * 1.2) * 0.05;

            let wave = wave1 + wave2 + wave3 + wave4 + wave5;

            // Mouse ripple
            if (mouse.active) {
              const mx = mouse.x / w;
              const my = mouse.y / h;
              const dist = Math.sqrt((nx - mx) ** 2 + (ny - my) ** 2);
              if (dist < 0.2) {
                wave += Math.sin(dist * 35 - time * 7) * Math.max(0, 0.2 - dist) * 1.5;
              }
            }

            const val = (wave + 0.5);

            // Dither — scattered dots
            const dither = (Math.random() - 0.5) * 0.08;
            const v = Math.max(0, Math.min(1, val + dither));

            // Light grey palette — subtle depth gradient
            const depth = waterNx * 0.15;
            r = Math.round(228 - depth * 25 + v * 15);
            g = Math.round(226 - depth * 25 + v * 15);
            b = Math.round(232 - depth * 18 + v * 12);
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
