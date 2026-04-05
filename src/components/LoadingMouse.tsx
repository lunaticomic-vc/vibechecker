'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

let sparkleId = 0;

export default function LoadingMouse({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [angle, setAngle] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const animRef = useRef<number>(0);
  const sparkleTimer = useRef(0);
  const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);

  useEffect(() => {
    const speed = 0.03;
    let frame = 0;
    function animate() {
      setAngle(a => a + speed);
      frame++;
      // Spawn sparkle every ~4 frames for md size (skip on mobile)
      if (!isMobile && size === 'md' && frame % 4 === 0) {
        sparkleTimer.current++;
      }
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [size, isMobile]);

  // Emit mouse angle for cat eye tracking (skip on mobile)
  useEffect(() => {
    if (size === 'sm' || isMobile) return;
    window.dispatchEvent(new CustomEvent('loading-mouse-angle', { detail: angle }));
  }, [angle, size, isMobile]);

  const isSmall = size === 'sm';
  const radius = isSmall ? 7 : 80;
  const mouseSize = isSmall ? 10 : 48;
  const containerSize = isSmall ? 24 : 200;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const rotation = angle * (180 / Math.PI) + 90;

  // Sparkle management
  const spawnSparkle = useCallback(() => {
    if (isSmall) return;
    const jitterX = (Math.random() - 0.5) * 12;
    const jitterY = (Math.random() - 0.5) * 12;
    const newSparkle: Sparkle = {
      id: sparkleId++,
      x: x + jitterX,
      y: y + jitterY,
      opacity: 1,
      scale: 0.5 + Math.random() * 0.8,
    };
    setSparkles(prev => [...prev.slice(-12), newSparkle]);
  }, [isSmall, x, y]);

  useEffect(() => {
    if (isSmall) return;
    spawnSparkle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparkleTimer.current]);

  // Fade out sparkles
  useEffect(() => {
    if (sparkles.length === 0) return;
    const timer = setTimeout(() => {
      setSparkles(prev => prev
        .map(s => ({ ...s, opacity: s.opacity - 0.15 }))
        .filter(s => s.opacity > 0)
      );
    }, 80);
    return () => clearTimeout(timer);
  }, [sparkles]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: containerSize, height: containerSize }}>
      {/* Sparkle trail */}
      {!isSmall && sparkles.map(s => (
        <div
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            transform: `translate(${s.x}px, ${s.y}px) scale(${s.scale})`,
            opacity: s.opacity,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5Z" fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
      ))}
      {/* Circular track */}
      {!isSmall && (
        <svg
          width={containerSize}
          height={containerSize}
          className="absolute inset-0"
          viewBox={`0 0 ${containerSize} ${containerSize}`}
        >
          <circle
            cx={containerSize / 2}
            cy={containerSize / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      )}
      {/* Mouse running along the track */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mouse.svg"
        alt=""
        width={mouseSize}
        height={mouseSize}
        style={{
          position: 'absolute',
          transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
          filter: 'brightness(0) saturate(100%) invert(100%)',
        }}
        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
      />
    </div>
  );
}
