'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCat } from 'react-icons/fa';

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

        {/* Cat icon — clean professional silhouette */}
        <motion.div
          className="relative z-10 drop-shadow-[0_0_12px_rgba(196,181,253,0.3)]"
          animate={{
            y: [0, -3, 0],
            rotate: attacking ? [0, -8, 5, 0] : 0,
          }}
          transition={attacking
            ? { duration: 0.4, ease: 'easeInOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <FaCat
            size={80}
            className="transition-colors duration-300"
            style={{
              color: attacking ? 'rgba(180,140,220,0.6)' : 'rgba(176,168,196,0.35)',
              filter: 'drop-shadow(0 0 6px rgba(196,181,253,0.2))',
            }}
          />
        </motion.div>

        {/* Scratch marks on attack */}
        <AnimatePresence>
          {attacking && (
            <motion.div
              className="absolute -top-2 -right-4 z-20 text-[#c4b5fd] text-lg pointer-events-none"
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              ✧
            </motion.div>
          )}
        </AnimatePresence>

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
