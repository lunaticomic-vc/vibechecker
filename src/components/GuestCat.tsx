'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestCat() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [attacking, setAttacking] = useState(false);
  const [pawTarget, setPawTarget] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/status').then(r => r.json()).then(data => {
      if (data.role === 'owner') setIsOwner(true);
      else setRemaining(data.remaining ?? 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleMouse(e: MouseEvent) {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const catX = rect.left + rect.width / 2;
      const catY = rect.top + rect.height * 0.3;
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

  useEffect(() => {
    if (!isOwner && remaining !== null && window.location.pathname !== '/login') {
      const msgs = remaining === 0
        ? ['no recs left... sorry!']
        : [`${remaining} rec${remaining !== 1 ? 's' : ''} left`, 'click wisely~'];
      showBubble(msgs[0]);
      if (msgs[1]) setTimeout(() => showBubble(msgs[1]), 3500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, isOwner]);

  useEffect(() => {
    function handleCatSpeak(e: Event) {
      const msg = (e as CustomEvent).detail;
      if (msg) showBubble(msg, 3000);
    }
    window.addEventListener('cat-speak', handleCatSpeak);
    return () => window.removeEventListener('cat-speak', handleCatSpeak);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClick() {
    if (attacking) return;
    // Calculate paw direction toward mouse
    if (catRef.current) {
      const rect = catRef.current.getBoundingClientRect();
      const catX = rect.left + rect.width / 2;
      const catY = rect.top + rect.height * 0.5;
      const dx = mousePos.current.x - catX;
      const dy = mousePos.current.y - catY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const reach = 40;
      setPawTarget({
        x: dist > 0 ? (dx / dist) * reach : -reach,
        y: dist > 0 ? (dy / dist) * reach : -reach,
      });
    }
    setAttacking(true);
    showBubble('meow!', 1500);
    setTimeout(() => setAttacking(false), 600);
  }

  if (remaining === null && !isOwner) return null;

  return (
    <div
      ref={catRef}
      onClick={handleClick}
      className="fixed bottom-3 left-3 z-50 cursor-pointer select-none"
    >
      <div className="flex flex-col items-center gap-0.5 relative">
        <svg width="140" height="170" viewBox="0 0 100 130" fill="none" stroke="#c0b8d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">

          {/* Tail — smooth S-curve swing */}
          <motion.path
            animate={{ d: [
              'M78 95 C90 85, 95 70, 88 58 C84 52, 78 50, 74 48',
              'M78 95 C85 80, 82 65, 72 55 C66 50, 60 48, 56 50',
              'M78 95 C90 85, 95 70, 88 58 C84 52, 78 50, 74 48',
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Body — smooth sitting silhouette */}
          <path d="M32 108 C28 98, 28 85, 35 75 C38 70, 42 67, 48 65" />
          <path d="M68 108 C72 98, 72 85, 65 75 C62 70, 58 67, 52 65" />
          <path d="M48 65 C50 63, 52 63, 52 65" />

          {/* Chest curve */}
          <path d="M38 90 C42 85, 50 82, 50 82 C50 82, 58 85, 62 90" strokeWidth="1.2" opacity="0.3" />

          {/* Front paws — soft rounded */}
          <path d="M35 108 C35 112, 35 116, 38 118 C40 119, 43 119, 44 118" />
          <path d="M65 108 C65 112, 65 116, 62 118 C60 119, 57 119, 56 118" />

          {/* Back haunches */}
          <path d="M30 105 C24 110, 22 115, 25 118 C27 120, 32 120, 35 118" />
          <path d="M70 105 C76 110, 78 115, 75 118 C73 120, 68 120, 65 118" />

          {/* Head — smooth oval */}
          <ellipse cx="50" cy="42" rx="20" ry="17" />

          {/* Ears — smooth curved triangles */}
          <path d="M34 34 C32 24, 30 16, 32 12 C34 10, 38 14, 42 28" />
          <path d="M66 34 C68 24, 70 16, 68 12 C66 10, 62 14, 58 28" />
          {/* Inner ears */}
          <path d="M35 30 C34 24, 33 18, 34 15 C35 14, 37 16, 40 26" strokeWidth="1" opacity="0.3" />
          <path d="M65 30 C66 24, 67 18, 66 15 C65 14, 63 16, 60 26" strokeWidth="1" opacity="0.3" />

          {/* Eyes — dot pupils that follow mouse */}
          <motion.circle
            cx={44 + eyeOffset.x}
            cy={41 + eyeOffset.y}
            r={attacking ? 3.5 : 2.5}
            fill="#7c6f94"
            stroke="none"
            animate={{ r: attacking ? 3.5 : 2.5 }}
            transition={{ duration: 0.12 }}
          />
          <motion.circle
            cx={56 + eyeOffset.x}
            cy={41 + eyeOffset.y}
            r={attacking ? 3.5 : 2.5}
            fill="#7c6f94"
            stroke="none"
            animate={{ r: attacking ? 3.5 : 2.5 }}
            transition={{ duration: 0.12 }}
          />

          {/* Paw swipe toward mouse */}
          <AnimatePresence>
            {attacking && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Paw arm extending toward mouse */}
                <motion.path
                  initial={{ d: 'M38 95 C36 90, 35 88, 35 85' }}
                  animate={{ d: `M38 95 C${30 + pawTarget.x * 0.3} ${85 + pawTarget.y * 0.3}, ${25 + pawTarget.x * 0.5} ${80 + pawTarget.y * 0.5}, ${20 + pawTarget.x * 0.7} ${75 + pawTarget.y * 0.7}` }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  strokeWidth="2"
                />
                {/* Paw pad */}
                <motion.circle
                  initial={{ cx: 35, cy: 85, r: 0 }}
                  animate={{ cx: 20 + pawTarget.x * 0.7, cy: 75 + pawTarget.y * 0.7, r: 4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  fill="none"
                  strokeWidth="1.5"
                />
                {/* Claws */}
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.1 }}
                >
                  {[[-3, -5], [-5, -2], [-5, 2]].map(([dx, dy], i) => (
                    <motion.line
                      key={i}
                      initial={{ x1: 35, y1: 85, x2: 35, y2: 85 }}
                      animate={{
                        x1: 20 + pawTarget.x * 0.7,
                        y1: 75 + pawTarget.y * 0.7,
                        x2: 20 + pawTarget.x * 0.7 + dx * 2,
                        y2: 75 + pawTarget.y * 0.7 + dy * 2,
                      }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      strokeWidth="1.2"
                      stroke="#b0a0c8"
                    />
                  ))}
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* Speech bubble */}
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
