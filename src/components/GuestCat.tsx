'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const BROWSE_PHRASES: Record<string, string[]> = {
  '/movies': [
    "danichka's movie taste? immaculate",
    "she cried at three of these... i won't say which",
    "i sat on her lap during most of these",
    "every movie here passed the vibe check",
  ],
  '/tv': [
    "her show taste is almost as good as my taste in naps",
    "she binged half of these in one weekend... i supervised",
    "danichka picks shows like i pick sunny spots. flawlessly",
    "i watched all of these from the couch armrest",
  ],
  '/anime': [
    "anime corner~ danichka is a woman of culture",
    "she says 'just one more episode' a lot here",
    "i don't understand anime but i respect the commitment",
    "danichka's anime list... purrsonally endorsed",
  ],
  '/youtube': [
    "her youtube taste is better than the algorithm",
    "she watches these while i knead the blanket",
    "curated with care... unlike my hairballs",
    "danichka's youtube picks are top tier, trust me",
  ],
  '/substack': [
    "the intellectual corner... very distinguished",
    "danichka reads these with her morning coffee. i supervise",
    "brainy picks for a brainy human",
    "i can't read but i can tell these are good",
  ],
  '/kdrama': [
    "k-drama corner~ bring tissues",
    "danichka has cried here more than once. i comforted her",
    "she stays up way too late for these... i approve",
    "elite drama taste runs in this household",
  ],
  '/interests': [
    "these are what make the vibes work~",
    "danichka's brain in tag form",
    "i'd add 'cats' to this list but that's implied",
  ],
  '/people': [
    "danichka's favorite humans... after me obviously",
    "good taste in creators, better taste in cats",
    "she knows all the good ones~",
  ],
  '/progress': [
    "keeping tabs on what she's watching... very cat of you",
    "danichka's currently watching list... she's busy",
    "she'll finish these... eventually. i believe in her",
  ],
  '/settings': [
    "the behind-the-scenes area~ fancy",
    "nothing to see here... just vibes being configured",
  ],
};

const GENERAL_PHRASES = [
  "you're looking at danichka's taste... isn't it immaculate?",
  "careful, her taste is contagious",
  "i've been curating this human for years",
  "purrsonally approved every pick here",
  "browsing the archives? excellent taste in taste",
  "i taught danichka everything she knows",
  "not to be biased but this is the best collection ever",
  "i nap on this list sometimes. it's cozy",
  "danichka's taste is basically mine at this point",
  "you can look but you can't edit~ mrrp",
];

export default function GuestCat() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prevPath = useRef(pathname);

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
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.3;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const max = 4;
      setEyeOffset({
        x: dist > 0 ? (dx / dist) * max : 0,
        y: dist > 0 ? Math.min((dy / dist) * max, max * 0.6) : 0,
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

  useEffect(() => {
    if (isOwner || pathname === prevPath.current) return;
    prevPath.current = pathname;
    if (pathname === '/login' || pathname === '/') return;

    const specific = BROWSE_PHRASES[pathname];
    const pool = specific
      ? (Math.random() < 0.7 ? specific : GENERAL_PHRASES)
      : GENERAL_PHRASES;
    const phrase = pool[Math.floor(Math.random() * pool.length)];

    const timer = setTimeout(() => showBubble(phrase, 4000), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isOwner]);

  function handleClick() {
    if (attacking) return;
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
      <div className="relative">
        {/* Ethereal glow */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'scale(2)' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Cat silhouette + animated overlays */}
        <motion.div
          className="relative z-10"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Body silhouette from SVG file */}
          <motion.div
            animate={{ rotate: attacking ? [0, -8, 5, 0] : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(196,181,253,0.25))' }}
          >
            <svg width="90" height="112" viewBox="0 0 200 250" className="transition-colors duration-300" style={{ color: attacking ? 'rgba(180,140,220,0.45)' : 'rgba(176,168,196,0.28)' }}>
              {/* Body */}
              <path fill="currentColor" d="
                M 100 245
                C 85 245, 75 240, 70 230
                C 62 215, 58 195, 55 175
                C 52 155, 48 140, 42 125
                C 36 110, 30 100, 28 90
                C 26 80, 28 70, 32 62
                C 36 54, 42 48, 48 44
                C 44 38, 38 28, 35 18
                C 33 10, 34 5, 38 3
                C 42 1, 48 6, 55 16
                C 60 24, 64 30, 68 36
                C 74 30, 80 24, 86 18
                C 92 10, 98 6, 102 8
                C 106 10, 106 16, 104 24
                C 100 34, 94 42, 90 48
                C 96 52, 102 58, 108 66
                C 114 74, 118 84, 120 96
                C 122 108, 124 122, 126 136
                C 128 150, 130 165, 130 180
                C 130 195, 128 210, 125 225
                C 122 235, 115 245, 100 245
                Z
              "/>
            </svg>
            {/* Animated tail — separate so it can swing */}
            <svg className="absolute -right-1 bottom-[10%] pointer-events-none" width="40" height="50" viewBox="0 0 50 60" style={{ color: attacking ? 'rgba(180,140,220,0.45)' : 'rgba(176,168,196,0.28)' }}>
              <motion.path
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
                animate={{ d: [
                  'M5 55 C12 42, 22 28, 32 18 C38 12, 44 10, 46 14',
                  'M5 55 C8 40, 12 26, 16 18 C18 12, 20 10, 24 14',
                  'M5 55 C12 42, 22 28, 32 18 C38 12, 44 10, 46 14',
                ]}}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </svg>
          </motion.div>

          {/* Eyes — glowing dots that track mouse */}
          {[
            { left: '32%', top: '22%' },
            { left: '44%', top: '22%' },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: attacking ? 7 : 5,
                height: attacking ? 7 : 5,
                left: `calc(${pos.left} + ${eyeOffset.x}px)`,
                top: `calc(${pos.top} + ${eyeOffset.y}px)`,
                background: attacking ? 'rgba(200,160,240,0.9)' : 'rgba(140,120,180,0.7)',
              }}
              animate={{
                boxShadow: attacking
                  ? '0 0 10px rgba(200,160,240,0.7)'
                  : ['0 0 4px rgba(196,181,253,0.2)', '0 0 8px rgba(196,181,253,0.4)', '0 0 4px rgba(196,181,253,0.2)'],
              }}
              transition={attacking ? { duration: 0.15 } : { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
          ))}

          {/* Attack sparkles */}
          <AnimatePresence>
            {attacking && (
              <>
                <motion.div
                  className="absolute -left-3 bottom-4 pointer-events-none text-xl"
                  initial={{ opacity: 0, x: 5, rotate: 20 }}
                  animate={{ opacity: 1, x: -8, rotate: -15 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: 'rgba(176,168,196,0.5)' }}
                >
                  ✦
                </motion.div>
                <motion.div
                  className="absolute -top-1 left-2 pointer-events-none text-sm"
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: [0, 0.8, 0.3], scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  style={{ color: 'rgba(196,181,253,0.5)' }}
                >
                  ✧
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Speech bubble */}
        <AnimatePresence>
          {bubble && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/85 backdrop-blur-md border border-[#e9e4f5]/60 rounded-xl px-3 py-1 shadow-[0_2px_12px_rgba(196,181,253,0.15)]"
            >
              <span className="text-[11px] text-[#7c7291]">{bubble}</span>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/85 border-r border-b border-[#e9e4f5]/60 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
