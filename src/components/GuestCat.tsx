'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestCat() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [attacking, setAttacking] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/status').then(r => r.json()).then(data => {
      if (data.role === 'owner') setIsOwner(true);
      else setRemaining(data.remaining ?? 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleMouse(e: MouseEvent) {
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const catX = rect.left + rect.width / 2;
      const catY = rect.top + 30;
      const dx = e.clientX - catX;
      const dy = e.clientY - catY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 2.5;
      setEyeOffset({
        x: dist > 0 ? (dx / dist) * maxOffset : 0,
        y: dist > 0 ? Math.min((dy / dist) * maxOffset, maxOffset) : 0,
      });
    }
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  function handleClick() {
    if (attacking) return;
    setAttacking(true);
    setTimeout(() => setAttacking(false), 700);
  }

  // Don't show until loaded
  if (remaining === null && !isOwner) return null;

  return (
    <div
      ref={catRef}
      onClick={handleClick}
      className="fixed bottom-3 left-3 z-50 cursor-pointer select-none"
    >
      <div className="flex flex-col items-center gap-0.5">
        <svg width="70" height="85" viewBox="0 0 120 150" fill="none" stroke="#c0b8d0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

          {/* Tail — smooth Framer Motion swing */}
          <motion.path
            d="M95 120 Q115 100 118 80 Q120 65 112 55"
            animate={{ d: [
              'M95 120 Q115 100 118 80 Q120 65 112 55',
              'M95 120 Q110 95 105 75 Q100 60 90 52',
              'M95 120 Q115 100 118 80 Q120 65 112 55',
            ]}}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Body — sitting cat silhouette */}
          <path d="M40 130 Q30 115 32 100 Q34 85 45 78" />
          <path d="M80 130 Q90 115 88 100 Q86 85 75 78" />
          <path d="M45 78 Q60 72 75 78" />

          {/* Front legs */}
          <path d="M42 130 L42 142 Q42 146 46 146" />
          <path d="M78 130 L78 142 Q78 146 74 146" />

          {/* Back legs tucked */}
          <path d="M36 128 Q28 135 30 142 Q30 146 35 146 L42 146" />
          <path d="M84 128 Q92 135 90 142 Q90 146 85 146 L78 146" />

          {/* Head */}
          <ellipse cx="60" cy="52" rx="22" ry="18" />

          {/* Ears — pointed triangles */}
          <path d="M42 42 L35 18 L52 36" />
          <path d="M78 42 L85 18 L68 36" />
          {/* Inner ear lines */}
          <path d="M43 38 L38 24 L49 35" strokeWidth="1" opacity="0.4" />
          <path d="M77 38 L82 24 L71 35" strokeWidth="1" opacity="0.4" />

          {/* Eyes — the main feature, large and expressive */}
          {/* Eye outlines */}
          <ellipse cx="50" cy="50" rx="6" ry="5.5" strokeWidth="1.5" />
          <ellipse cx="70" cy="50" rx="6" ry="5.5" strokeWidth="1.5" />
          {/* Pupils — follow mouse */}
          <motion.ellipse
            cx={50 + eyeOffset.x}
            cy={50 + eyeOffset.y}
            rx={attacking ? 4.5 : 3}
            ry={attacking ? 2 : 4}
            fill="#8a7fa0"
            stroke="none"
            animate={{ rx: attacking ? 4.5 : 3, ry: attacking ? 2 : 4 }}
            transition={{ duration: 0.15 }}
          />
          <motion.ellipse
            cx={70 + eyeOffset.x}
            cy={50 + eyeOffset.y}
            rx={attacking ? 4.5 : 3}
            ry={attacking ? 2 : 4}
            fill="#8a7fa0"
            stroke="none"
            animate={{ rx: attacking ? 4.5 : 3, ry: attacking ? 2 : 4 }}
            transition={{ duration: 0.15 }}
          />
          {/* Eye glints */}
          <circle cx={51.5 + eyeOffset.x * 0.3} cy={48.5 + eyeOffset.y * 0.3} r="1.2" fill="white" stroke="none" />
          <circle cx={71.5 + eyeOffset.x * 0.3} cy={48.5 + eyeOffset.y * 0.3} r="1.2" fill="white" stroke="none" />

          {/* Nose — tiny triangle */}
          <path d="M58.5 57 L60 59.5 L61.5 57 Z" fill="#c0b8d0" strokeWidth="1" />

          {/* Mouth */}
          <path d="M60 59.5 Q57 62 55 61" strokeWidth="1.2" />
          <path d="M60 59.5 Q63 62 65 61" strokeWidth="1.2" />

          {/* Whiskers */}
          <line x1="22" y1="55" x2="44" y2="56" strokeWidth="1" opacity="0.5" />
          <line x1="22" y1="60" x2="44" y2="59" strokeWidth="1" opacity="0.5" />
          <line x1="24" y1="65" x2="45" y2="62" strokeWidth="1" opacity="0.4" />
          <line x1="98" y1="55" x2="76" y2="56" strokeWidth="1" opacity="0.5" />
          <line x1="98" y1="60" x2="76" y2="59" strokeWidth="1" opacity="0.5" />
          <line x1="96" y1="65" x2="75" y2="62" strokeWidth="1" opacity="0.4" />

          {/* Paw attack */}
          <AnimatePresence>
            {attacking && (
              <motion.g
                initial={{ x: 15, y: 10, opacity: 0, rotate: 30 }}
                animate={{ x: -5, y: -5, opacity: 1, rotate: -10 }}
                exit={{ opacity: 0, x: -10, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Extended paw */}
                <path d="M30 100 L10 85 L15 90" strokeWidth="2" />
                {/* Claws */}
                <line x1="10" y1="85" x2="4" y2="78" strokeWidth="1.5" />
                <line x1="10" y1="85" x2="2" y2="83" strokeWidth="1.5" />
                <line x1="10" y1="85" x2="6" y2="88" strokeWidth="1.5" />
                {/* Scratch marks */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6] }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <line x1="0" y1="74" x2="8" y2="82" strokeWidth="1" stroke="#d4b5fd" />
                  <line x1="3" y1="72" x2="10" y2="79" strokeWidth="1" stroke="#d4b5fd" />
                  <line x1="6" y1="71" x2="12" y2="77" strokeWidth="1" stroke="#d4b5fd" />
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {!isOwner && remaining !== null && (
          <span className="text-[10px] text-[#b0a8c4] font-medium">
            {remaining === 0 ? 'no recs left' : `${remaining} rec${remaining !== 1 ? 's' : ''} left`}
          </span>
        )}
      </div>
    </div>
  );
}
