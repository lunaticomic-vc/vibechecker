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
        <svg width="120" height="150" viewBox="0 0 100 120" fill="none" stroke="#b0a8c4" strokeLinecap="round" strokeLinejoin="round">

          {/* Single outline — sitting cat silhouette, looking up-right */}
          <path d="
            M 58 105
            C 62 95, 65 80, 62 65
            C 60 55, 55 45, 52 38
            C 50 33, 50 28, 52 22
            C 53 18, 56 14, 58 10
            C 59 8, 58 8, 56 10
            C 53 14, 50 18, 48 22
            C 46 18, 43 14, 40 10
            C 38 8, 37 8, 38 10
            C 40 14, 43 18, 44 22
            C 46 28, 46 33, 44 38
            C 40 45, 34 50, 30 58
            C 26 66, 28 78, 30 85
            C 31 90, 32 95, 32 100
            C 32 104, 34 106, 38 105
            C 42 104, 42 100, 42 96
            C 44 92, 48 90, 52 92
            C 54 94, 54 98, 54 102
            C 54 106, 56 107, 58 105
            Z
          " strokeWidth="2.5" />

          {/* Tail — elegant curve sweeping right */}
          <motion.path
            strokeWidth="2.8"
            animate={{ d: [
              'M 60 100 C 68 90, 75 78, 72 68 C 70 62, 66 58, 62 56',
              'M 60 100 C 65 88, 64 74, 58 66 C 54 60, 50 58, 48 60',
              'M 60 100 C 68 90, 75 78, 72 68 C 70 62, 66 58, 62 56',
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Eye — single dot, side profile */}
          <motion.circle
            cx={48 + eyeOffset.x * 0.6}
            cy={30 + eyeOffset.y * 0.6}
            r={attacking ? 3 : 2}
            fill="#7c6f94"
            stroke="none"
            animate={{ r: attacking ? 3 : 2 }}
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
                <motion.path
                  initial={{ d: 'M 32 85 C 30 80, 28 76, 26 72' }}
                  animate={{ d: `M 32 85 C ${28 + pawTarget.x * 0.3} ${76 + pawTarget.y * 0.3}, ${24 + pawTarget.x * 0.5} ${68 + pawTarget.y * 0.5}, ${20 + pawTarget.x * 0.6} ${62 + pawTarget.y * 0.6}` }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  strokeWidth="2.5"
                />
                {[[-2, -4], [-4, -1], [-4, 2]].map(([dx, dy], i) => (
                  <motion.line
                    key={i}
                    initial={{ x1: 26, y1: 72, x2: 26, y2: 72 }}
                    animate={{
                      x1: 20 + pawTarget.x * 0.6,
                      y1: 62 + pawTarget.y * 0.6,
                      x2: 20 + pawTarget.x * 0.6 + (dx ?? 0) * 1.5,
                      y2: 62 + pawTarget.y * 0.6 + (dy ?? 0) * 1.5,
                    }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    strokeWidth="1.5"
                    stroke="#b0a0c8"
                  />
                ))}
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
