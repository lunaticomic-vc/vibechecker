'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

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
  const [pawDir, setPawDir] = useState({ x: 0, y: 0 });
  const mouseAngle = useRef(0);
  const rawEyeX = useSpring(0, { stiffness: 150, damping: 20 });
  const rawEyeY = useSpring(0, { stiffness: 150, damping: 20 });
  const eyeX = useTransform(rawEyeX, v => v * 3);
  const eyeY = useTransform(rawEyeY, v => v * 2.5);
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
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
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!catRef.current) return;
      const rect = catRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.25;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        rawEyeX.set(dx / dist);
        rawEyeY.set(Math.min(dy / dist, 0.8));
        mouseAngle.current = Math.atan2(dy, dx);
      }
    }
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [rawEyeX, rawEyeY]);

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
    const a = mouseAngle.current;
    setPawDir({ x: Math.cos(a), y: Math.sin(a) });
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
          style={{ background: 'radial-gradient(circle, rgba(196,181,253,0.12) 0%, transparent 70%)', filter: 'blur(20px)', transform: 'scale(1.8)' }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Cat SVG — sitting silhouette */}
        <motion.svg
          width="100" height="120" viewBox="20 10 50 95"
          className="relative z-10 drop-shadow-[0_0_8px_rgba(196,181,253,0.25)]"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <defs>
            <filter id="catGlow"><feGaussianBlur stdDeviation="0.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* Body silhouette — sitting, looking slightly right */}
          <path
            d="M50,95 C50,95 46,92 43,88 C40,84 39,78 39,74 C39,68 40,62 40,58 C40,52 37,46 35,42 C33,38 30,34 30,30 C30,26 32,22 34,20 C36,18 38,19 39,21 L41,25 L43,21 C44,19 46,18 48,20 C50,22 51,26 50,30 C48,34 45,38 43,42 C45,41 47,40 49,39 C51,38 53,38 54,40 C56,42 56,46 56,50 C56,56 55,62 55,68 C55,74 57,80 58,85 C59,88 59,91 59,93 C59,95 58,96 56,96 C54,96 53,94 52,92 C51,94 50,96 48,96 C46,96 45,95 45,93 C45,91 46,89 47,87"
            fill="rgba(176,168,196,0.15)"
            stroke="rgba(176,168,196,0.55)"
            strokeWidth="1.2"
            strokeLinejoin="round"
            filter="url(#catGlow)"
          />

          {/* Tail */}
          <motion.path
            fill="none"
            stroke="rgba(176,168,196,0.55)"
            strokeWidth="1.6"
            strokeLinecap="round"
            filter="url(#catGlow)"
            animate={{ d: [
              'M57,90 C63,82 67,72 65,64 C64,58 61,54 58,52',
              'M57,90 C61,80 59,68 54,60 C50,54 47,52 45,54',
              'M57,90 C63,82 67,72 65,64 C64,58 61,54 58,52',
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Eyes — glowing dots with spring physics */}
          <motion.circle cx={40} cy={30} r={attacking ? 2 : 1.4} style={{ x: eyeX, y: eyeY }} fill="rgba(124,111,148,0.85)" stroke="none" animate={{ r: attacking ? 2 : 1.4, fill: attacking ? 'rgba(180,140,220,1)' : 'rgba(124,111,148,0.85)' }} transition={{ duration: 0.12 }} />
          <motion.circle cx={47} cy={30} r={attacking ? 2 : 1.4} style={{ x: eyeX, y: eyeY }} fill="rgba(124,111,148,0.85)" stroke="none" animate={{ r: attacking ? 2 : 1.4, fill: attacking ? 'rgba(180,140,220,1)' : 'rgba(124,111,148,0.85)' }} transition={{ duration: 0.12 }} />

          {/* Eye glow halos */}
          <motion.circle cx={40} cy={30} r={3.5} style={{ x: eyeX, y: eyeY }} fill="none" stroke="rgba(196,181,253,0.3)" strokeWidth="0.8" animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.circle cx={47} cy={30} r={3.5} style={{ x: eyeX, y: eyeY }} fill="none" stroke="rgba(196,181,253,0.3)" strokeWidth="0.8" animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />

          {/* Paw swipe */}
          <AnimatePresence>
            {attacking && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                <motion.line
                  initial={{ x1: 38, y1: 58, x2: 38, y2: 58 }}
                  animate={{ x1: 38, y1: 58, x2: 38 + pawDir.x * 16, y2: 58 + pawDir.y * 16 }}
                  stroke="rgba(176,168,196,0.6)" strokeWidth="1.6" strokeLinecap="round"
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                />
                {[-0.3, 0, 0.3].map((off, i) => (
                  <motion.line key={i}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.7, 0.3],
                      x1: 38 + pawDir.x * 16 + Math.cos(mouseAngle.current + off) * 2,
                      y1: 58 + pawDir.y * 16 + Math.sin(mouseAngle.current + off) * 2,
                      x2: 38 + pawDir.x * 16 + Math.cos(mouseAngle.current + off) * 6,
                      y2: 58 + pawDir.y * 16 + Math.sin(mouseAngle.current + off) * 6,
                    }}
                    stroke="rgba(196,181,253,0.4)" strokeWidth="0.8" strokeLinecap="round"
                    transition={{ duration: 0.3, delay: 0.06 }}
                  />
                ))}
              </motion.g>
            )}
          </AnimatePresence>
        </motion.svg>

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
