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

      // Soft lilac-white background fill
      ctx!.fillStyle = '#faf8ff';
      ctx!.fillRect(0, 0, w, h);

      time += 0.005;

      // Shore line comes from the right side, waves rock left
      const shoreX = w * 0.6 + Math.sin(time * 0.6) * w * 0.04;

      // Draw dithered dot waves
      const dotSpacing = window.innerWidth < 600 ? 6 : 5;
      const maxDots = 40000;
      let dotCount = 0;

      for (let y = 0; y < h && dotCount < maxDots; y += dotSpacing) {
        for (let x = 0; x < w && dotCount < maxDots; x += dotSpacing) {
          const nx = x / w;
          const ny = y / h;

          // Only draw dots in the water area (right side)
          // Wave layers rocking left from the right
          const waveOffset =
            Math.sin(ny * 6 + time * 2.5) * 0.06 +
            Math.sin(ny * 10 - time * 1.8) * 0.03 +
            Math.sin(ny * 3 + time * 1.2) * 0.04 +
            Math.sin((ny * 8 + nx * 4) + time * 3) * 0.02;

          const localShore = (shoreX / w) + waveOffset;

          if (nx < localShore - 0.08) continue; // skip non-water area

          // How deep into water (0 = shore, 1 = far right)
          const depth = Math.max(0, (nx - localShore) / (1 - localShore));
          // Foam zone near shore
          const foamZone = Math.max(0, 1 - Math.abs(nx - localShore) * 15);

          // Wave motion for dots — rock back and forth
          const waveDisplaceX =
            Math.sin(ny * 5 - time * 2.2 + depth * 4) * (8 + depth * 12) +
            Math.sin(ny * 12 + time * 3.5) * (2 + depth * 4) +
            Math.cos(ny * 3 + time * 1.5) * 5;

          const waveDisplaceY =
            Math.sin(nx * 8 + time * 1.8) * (3 + depth * 5) +
            Math.cos(ny * 6 - time * 2) * 2;

          // Mouse ripple
          let mouseDisplaceX = 0;
          let mouseDisplaceY = 0;
          if (mouse.active) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
              const force = (150 - dist) / 150;
              const ripple = Math.sin(dist * 0.08 - time * 8) * force * 12;
              mouseDisplaceX = (dx / (dist || 1)) * ripple;
              mouseDisplaceY = (dy / (dist || 1)) * ripple;
            }
          }

          const drawX = x + waveDisplaceX + mouseDisplaceX;
          const drawY = y + waveDisplaceY + mouseDisplaceY;

          if (drawX < 0 || drawX > w || drawY < 0 || drawY > h) continue;

          // Dot properties — light grey, varying opacity
          const baseOpacity = foamZone > 0
            ? 0.15 + foamZone * 0.35 // foam: brighter
            : 0.08 + depth * 0.2; // water: gets denser deeper

          // Dither: randomize opacity slightly per frame for shimmer
          const shimmer = (Math.sin(time * 4 + x * 0.1 + y * 0.1) + 1) * 0.5;
          const opacity = Math.min(0.5, baseOpacity + shimmer * 0.05);

          // Dot size varies
          const size = foamZone > 0
            ? 1 + foamZone * 1.5 + Math.random() * 0.5
            : 1 + depth * 0.8;

          // Light grey with slight lilac tint
          const grey = Math.round(170 - depth * 30 + shimmer * 15);
          const bTint = Math.round(grey + 10); // slight blue/lilac push

          ctx!.beginPath();
          ctx!.arc(drawX, drawY, size, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${grey}, ${grey - 5}, ${bTint}, ${opacity})`;
          ctx!.fill();

          dotCount++;
        }
      }

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
