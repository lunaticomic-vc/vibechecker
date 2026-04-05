'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestCat() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [attacking, setAttacking] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  function showBubble(msg: string, duration = 3000) {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(msg);
    bubbleTimer.current = setTimeout(() => setBubble(null), duration);
  }

  // Show rec count on first load for guests
  useEffect(() => {
    if (!isOwner && remaining !== null) {
      const msgs = remaining === 0
        ? ["no recs left... sorry!"]
        : [`${remaining} rec${remaining !== 1 ? 's' : ''} left`, "click wisely~"];
      showBubble(msgs[0]);
      if (msgs[1]) {
        setTimeout(() => showBubble(msgs[1]), 3500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, isOwner]);

  const ATTACK_MESSAGES = ['ow!', 'hey!', 'mrrow!', 'hiss!', '*chomp*', 'rude.', '>:3'];

  function handleClick() {
    if (attacking) return;
    setAttacking(true);
    showBubble(ATTACK_MESSAGES[Math.floor(Math.random() * ATTACK_MESSAGES.length)], 2000);
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
        <svg width="140" height="170" viewBox="0 0 120 150" fill="none" stroke="#c0b8d0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

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

          {/* Eyes — just dots that follow mouse */}
          <motion.circle
            cx={52 + eyeOffset.x}
            cy={50 + eyeOffset.y}
            r={attacking ? 4 : 3}
            fill="#8a7fa0"
            stroke="none"
            animate={{ r: attacking ? 4 : 3 }}
            transition={{ duration: 0.15 }}
          />
          <motion.circle
            cx={68 + eyeOffset.x}
            cy={50 + eyeOffset.y}
            r={attacking ? 4 : 3}
            fill="#8a7fa0"
            stroke="none"
            animate={{ r: attacking ? 4 : 3 }}
            transition={{ duration: 0.15 }}
          />

          {/* Paw attack */}
          <AnimatePresence>
            {attacking && (
              <motion.g
                initial={{ x: 15, y: 10, opacity: 0, rotate: 30 }}
                animate={{ x: -5, y: -5, opacity: 1, rotate: -10 }}
                exit={{ opacity: 0, x: -10, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <path d="M30 100 L10 85 L15 90" strokeWidth="2" />
                <line x1="10" y1="85" x2="4" y2="78" strokeWidth="1.5" />
                <line x1="10" y1="85" x2="2" y2="83" strokeWidth="1.5" />
                <line x1="10" y1="85" x2="6" y2="88" strokeWidth="1.5" />
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

        <AnimatePresence>
          {bubble && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 backdrop-blur-sm border border-[#e9e4f5] rounded-xl px-3 py-1 shadow-sm"
            >
              <span className="text-[11px] text-[#7c7291]">{bubble}</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/90 border-r border-b border-[#e9e4f5] rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
