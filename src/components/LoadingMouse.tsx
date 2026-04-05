'use client';

import { useEffect, useRef, useState } from 'react';

export default function LoadingMouse({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const [angle, setAngle] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const speed = 0.03;
    function animate() {
      setAngle(a => a + speed);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Emit mouse position for cat to follow
  useEffect(() => {
    if (size === 'sm') return;
    window.dispatchEvent(new CustomEvent('loading-mouse-angle', { detail: angle }));
  }, [angle, size]);

  const isSmall = size === 'sm';
  const radius = isSmall ? 7 : 32;
  const mouseSize = isSmall ? 10 : 18;
  const containerSize = isSmall ? 24 : 80;
  const trackRadius = isSmall ? 7 : 32;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const rotation = angle * (180 / Math.PI) + 90;

  return (
    <div className="relative flex items-center justify-center" style={{ width: containerSize, height: containerSize }}>
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
            r={trackRadius}
            fill="none"
            stroke="rgba(196,181,253,0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>
      )}
      {/* Mouse walking along the track */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mouse.svg"
        alt=""
        width={mouseSize}
        height={mouseSize}
        style={{
          position: 'absolute',
          transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
          filter: isSmall
            ? 'brightness(0) saturate(100%) invert(100%)'
            : 'brightness(0) saturate(100%) invert(75%) sepia(10%) saturate(500%) hue-rotate(220deg) brightness(95%)',
        }}
        className="drop-shadow-[0_0_6px_rgba(196,181,253,0.5)]"
      />
    </div>
  );
}
