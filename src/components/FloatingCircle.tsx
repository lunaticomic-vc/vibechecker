'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  src: string;
  alt: string;
  size?: number;
  initialX: number;
  initialY: number;
  delay?: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const GRADIENTS = [
  'linear-gradient(135deg, #e0d6f5 0%, #f5f0ff 50%, #d4cee6 100%)',
  'linear-gradient(135deg, #d4e6d1 0%, #f0f7ef 50%, #c4d8c0 100%)',
  'linear-gradient(135deg, #c4b5fd 0%, #e9e4f5 50%, #d8d0ee 100%)',
  'linear-gradient(135deg, #f5f3ff 0%, #c4b5fd 50%, #e0d6f5 100%)',
];

export default function FloatingCircle({ src, alt, size = 120, initialX, initialY, delay = 0 }: Props) {
  const [hovering, setHovering] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const sparkleId = useRef(0);
  const animRef = useRef<number>();
  const timeRef = useRef(delay * 100);

  const isGradient = src.startsWith('gradient:');
  const gradientIdx = isGradient ? parseInt(src.split(':')[1]) % GRADIENTS.length : 0;

  // Floating animation
  useEffect(() => {
    function animate() {
      timeRef.current += 0.015;
      const t = timeRef.current;
      setOffset({
        x: Math.sin(t * 0.5 + delay) * 12 + Math.cos(t * 0.3) * 8,
        y: Math.cos(t * 0.4 + delay * 2) * 14 + Math.sin(t * 0.25) * 6,
      });
      animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [delay]);

  // Sparkles on hover
  useEffect(() => {
    if (!hovering) { setSparkles([]); return; }

    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = (size / 2) * (0.7 + Math.random() * 0.8);
      setSparkles(prev => [
        ...prev.slice(-15),
        {
          id: sparkleId.current++,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 3 + Math.random() * 5,
          opacity: 0.5 + Math.random() * 0.5,
        },
      ]);
    }, 60);

    return () => clearInterval(interval);
  }, [hovering, size]);

  const currentSize = hovering ? size * 1.3 : size;

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        width: currentSize,
        height: currentSize,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        zIndex: hovering ? 20 : 10,
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Sparkles */}
      {sparkles.map(s => (
        <span
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(${s.x}px, ${s.y}px)`,
            animation: 'sparkleOut 0.8s ease-out forwards',
          }}
        >
          <svg width={s.size * 2} height={s.size * 2} viewBox="0 0 10 10" style={{ opacity: s.opacity }}>
            <path d="M5 1L5 9M1 5L9 5" stroke="rgba(196,181,253,0.8)" strokeWidth="0.8" />
            <path d="M2.5 2.5L7.5 7.5M7.5 2.5L2.5 7.5" stroke="rgba(196,181,253,0.4)" strokeWidth="0.5" />
          </svg>
        </span>
      ))}

      {/* Glow ring */}
      <div
        className="absolute inset-[-12px] rounded-full transition-all duration-700 pointer-events-none"
        style={{
          background: hovering
            ? 'radial-gradient(circle, rgba(196,181,253,0.25) 0%, transparent 65%)'
            : 'none',
        }}
      />

      {/* Circle */}
      {isGradient || imgError ? (
        <div
          className="w-full h-full rounded-full border-2 transition-all duration-700 flex items-center justify-center"
          style={{
            background: GRADIENTS[gradientIdx],
            borderColor: hovering ? 'rgba(196,181,253,0.6)' : 'rgba(233,228,245,0.4)',
            boxShadow: hovering
              ? '0 0 40px rgba(196,181,253,0.35), 0 8px 25px rgba(0,0,0,0.06)'
              : '0 4px 15px rgba(0,0,0,0.04)',
          }}
        >
          <span className="text-[#c4b5fd] text-opacity-30 text-2xl font-light select-none">
            {alt.charAt(0)}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="w-full h-full rounded-full object-cover border-2 transition-all duration-700"
          style={{
            borderColor: hovering ? 'rgba(196,181,253,0.6)' : 'rgba(233,228,245,0.4)',
            boxShadow: hovering
              ? '0 0 40px rgba(196,181,253,0.35), 0 8px 25px rgba(0,0,0,0.06)'
              : '0 4px 15px rgba(0,0,0,0.04)',
          }}
        />
      )}

      <style jsx>{`
        @keyframes sparkleOut {
          0% { opacity: 1; transform: translate(var(--x,0), var(--y,0)) scale(1); }
          100% { opacity: 0; transform: translate(var(--x,0), var(--y,0)) scale(0.2) translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
