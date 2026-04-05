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
        <pre className="text-[#b0a8c4] text-[14px] leading-[1.1] font-mono select-none" style={{ fontFamily: 'monospace' }}>
{attacking
? ` /\\_/\\
( o.o )
 > ^ <
/|   |\\
  |___|`
: ` /\\_/\\
( ${eyeOffset.x > 0.5 ? 'o' : eyeOffset.x < -0.5 ? 'o' : '•'}.${eyeOffset.x > 0.5 ? 'o' : eyeOffset.x < -0.5 ? 'o' : '•'} )
 > ^ <`}
        </pre>
        {/* Animated tail */}
        <motion.div
          className="text-[#b0a8c4] text-[14px] font-mono select-none -mt-1 ml-3"
          animate={{ rotate: [0, 20, -20, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: 'left center', display: 'inline-block' }}
        >
          ~
        </motion.div>

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
