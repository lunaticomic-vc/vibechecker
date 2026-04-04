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
  angle: number;
  speed: number;
}

export default function FloatingCircle({ src, alt, size = 70, initialX, initialY, delay = 0 }: Props) {
  const [hovering, setHovering] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const sparkleId = useRef(0);
  const animRef = useRef<number>();
  const timeRef = useRef(delay * 100);

  // Floating animation
  useEffect(() => {
    function animate() {
      timeRef.current += 0.02;
      const t = timeRef.current;
      setOffset({
        x: Math.sin(t * 0.7 + delay) * 8 + Math.cos(t * 0.4) * 5,
        y: Math.cos(t * 0.6 + delay * 2) * 10 + Math.sin(t * 0.3) * 4,
      });
      animRef.current = requestAnimationFrame(animate);
    }
    animate();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [delay]);

  // Sparkles on hover
  useEffect(() => {
    if (!hovering) {
      setSparkles([]);
      return;
    }

    const interval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = (size / 2) * (0.8 + Math.random() * 0.6);
      setSparkles(prev => [
        ...prev.slice(-12),
        {
          id: sparkleId.current++,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 2 + Math.random() * 3,
          opacity: 0.6 + Math.random() * 0.4,
          angle: Math.random() * 360,
          speed: 0.5 + Math.random(),
        },
      ]);
    }, 80);

    return () => clearInterval(interval);
  }, [hovering, size]);

  const currentSize = hovering ? size * 1.4 : size;

  return (
    <div
      className="absolute transition-all duration-500 ease-out"
      style={{
        left: initialX + offset.x,
        top: initialY + offset.y,
        width: currentSize,
        height: currentSize,
        transform: `translate(-50%, -50%)`,
        zIndex: hovering ? 20 : 10,
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Sparkles */}
      {sparkles.map(s => (
        <span
          key={s.id}
          className="absolute pointer-events-none animate-[sparkleFloat_1s_ease-out_forwards]"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(${s.x}px, ${s.y}px)`,
          }}
        >
          <svg width={s.size * 2} height={s.size * 2} viewBox="0 0 10 10" style={{ opacity: s.opacity }}>
            <path d="M5 0L5 10M0 5L10 5" stroke="rgba(196,181,253,0.7)" strokeWidth="0.8" />
            <path d="M2 2L8 8M8 2L2 8" stroke="rgba(196,181,253,0.4)" strokeWidth="0.5" />
          </svg>
        </span>
      ))}

      {/* Glow */}
      <div
        className="absolute inset-[-8px] rounded-full transition-all duration-500"
        style={{
          background: hovering
            ? 'radial-gradient(circle, rgba(196,181,253,0.3) 0%, transparent 70%)'
            : 'none',
        }}
      />

      {/* Image circle */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full rounded-full object-cover border-2 transition-all duration-500"
        style={{
          borderColor: hovering ? 'rgba(196,181,253,0.6)' : 'rgba(233,228,245,0.5)',
          boxShadow: hovering
            ? '0 0 30px rgba(196,181,253,0.3), 0 8px 20px rgba(0,0,0,0.08)'
            : '0 2px 8px rgba(0,0,0,0.05)',
        }}
      />

      <style jsx>{`
        @keyframes sparkleFloat {
          0% { opacity: 1; transform: translate(var(--tx, 0), var(--ty, 0)) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx, 0), var(--ty, 0)) scale(0.3) translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
