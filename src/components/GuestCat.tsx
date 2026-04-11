'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';

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

const OWNER_PHRASES: Record<string, string[]> = {
  '/movies': [
    "welcome back to your movies~",
    "what are we watching tonight?",
    "i already picked a spot on the couch",
    "movie night? i'll bring the purrs",
  ],
  '/tv': [
    "one more episode... right?",
    "i've been keeping your spot warm",
    "binge mode activated",
    "you say 'last one' but we both know...",
  ],
  '/anime': [
    "anime time~ i'll sit on your keyboard",
    "sugoi~ or whatever you humans say",
    "another anime? i'm not judging. ok maybe a little",
    "the subtitles move too fast for me",
  ],
  '/youtube': [
    "youtube rabbit hole incoming~",
    "i like the ones where nothing happens",
    "good taste as always",
    "play something with birds in it",
  ],
  '/substack': [
    "reading time... i'll nap beside you",
    "the smart corner. i approve",
    "very intellectual. very cat-adjacent",
    "i pretend to read these over your shoulder",
  ],
  '/kdrama': [
    "tissues ready? i am",
    "the drama section... my favorite nap soundtrack",
    "i can feel the emotions from here",
    "another one? your heart is brave",
  ],
  '/interests': [
    "updating the vibe DNA~",
    "add 'cats' please. for me",
    "these make your recs better. you're welcome",
  ],
  '/people': [
    "your favorite humans... i tolerate them",
    "no cats on this list? rude",
    "good taste in people too, i guess",
  ],
  '/progress': [
    "let's see what you haven't finished~",
    "no judgment... ok a little judgment",
    "you'll get through these. i believe in you",
  ],
  '/settings': [
    "ooh the secret settings~",
    "don't break anything please",
    "tweaking things? very you",
  ],
};

const OWNER_GENERAL = [
  "hey danichka~ missed you",
  "welcome home~",
  "i saved your spot",
  "the vibes are immaculate today",
  "ready when you are~",
  "let's find something good",
  "i've been guarding the collection",
  "your taste keeps getting better. must be my influence",
];

const PURR_PHRASES = [
  'prrrrrrr...',
  'prrr~ prrr~',
  'mrrrrrr...',
  'purrrrr...',
  '*purrs contentedly*',
  'prrr... don\'t stop...',
];

export default function GuestCat() {
  const { isOwner, remaining, isLoading } = useAuth();
  const [attacking, setAttacking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [pawPrint, setPawPrint] = useState<{ x: number; y: number } | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [chasing, setChasing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [purring, setPurring] = useState(false);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const catRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  // Purring state refs
  const holding = useRef(false);
  const purrXHistory = useRef<number[]>([]);
  const purrDirectionChanges = useRef(0);
  const purrLastDirection = useRef<'left' | 'right' | null>(null);
  const purrTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Purring — hold cat and move mouse back and forth
  useEffect(() => {
    if (isMobile) return;

    function handlePurrMove(e: MouseEvent) {
      if (!holding.current) return;
      const history = purrXHistory.current;
      history.push(e.clientX);
      // Keep only recent positions
      if (history.length > 30) history.shift();
      if (history.length < 3) return;

      const prev = history[history.length - 2];
      const curr = history[history.length - 1];
      const diff = curr - prev;
      if (Math.abs(diff) < 2) return; // ignore tiny movements

      const dir: 'left' | 'right' = diff > 0 ? 'right' : 'left';
      if (purrLastDirection.current && dir !== purrLastDirection.current) {
        purrDirectionChanges.current++;
      }
      purrLastDirection.current = dir;

      // 3+ direction changes = petting back and forth
      if (purrDirectionChanges.current >= 3 && !purring) {
        setPurring(true);
        const phrase = PURR_PHRASES[Math.floor(Math.random() * PURR_PHRASES.length)];
        showBubble(phrase, 10000);
      }

      // Reset the stop timer on each move
      if (purrTimeout.current) clearTimeout(purrTimeout.current);
      purrTimeout.current = setTimeout(() => {
        if (holding.current) {
          // Stopped moving but still holding — keep purring gently
        } else {
          setPurring(false);
        }
      }, 600);
    }

    function handleMouseUp() {
      holding.current = false;
      purrXHistory.current = [];
      purrDirectionChanges.current = 0;
      purrLastDirection.current = null;
      if (purrTimeout.current) clearTimeout(purrTimeout.current);
      // Gentle fade out of purring
      setTimeout(() => setPurring(false), 300);
    }

    window.addEventListener('mousemove', handlePurrMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handlePurrMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, purring]);

  // Eye tracking — follows real cursor or orbiting mouse (skip on mobile)
  useEffect(() => {
    if (isMobile) return;
    function handleMouse(e: MouseEvent) {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (chasing) return;
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
  }, [chasing, isMobile]);

  // Listen for loading chase events (skip on mobile)
  useEffect(() => {
    if (isMobile) return;
    function handleChase(e: Event) {
      const active = (e as CustomEvent).detail;
      setChasing(active);
      if (active) showBubble('ooh a mouse...', 2000);
    }
    window.addEventListener('cat-chase', handleChase);
    return () => window.removeEventListener('cat-chase', handleChase);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // During loading, eyes follow the loading mouse spinner (skip on mobile)
  useEffect(() => {
    if (isMobile || !chasing) return;
    function handleMouseAngle(e: Event) {
      const angle = (e as CustomEvent).detail as number;
      const max = 4;
      setEyeOffset({
        x: Math.cos(angle) * max,
        y: Math.min(Math.sin(angle) * max, max * 0.6),
      });
    }
    window.addEventListener('loading-mouse-angle', handleMouseAngle);
    return () => window.removeEventListener('loading-mouse-angle', handleMouseAngle);
  }, [chasing, isMobile]);


  function showBubble(msg: string, duration = 3000) {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(msg);
    bubbleTimer.current = setTimeout(() => setBubble(null), duration);
  }

  useEffect(() => {
    if (!isOwner && remaining !== null && pathname !== '/login') {
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
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    if (pathname === '/login' || pathname === '/') return;

    const phrasesMap = isOwner ? OWNER_PHRASES : BROWSE_PHRASES;
    const generalPool = isOwner ? OWNER_GENERAL : GENERAL_PHRASES;
    const specific = phrasesMap[pathname];
    const pool = specific
      ? (Math.random() < 0.7 ? specific : generalPool)
      : generalPool;
    const phrase = pool[Math.floor(Math.random() * pool.length)];

    const timer = setTimeout(() => showBubble(phrase, 4000), 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isOwner]);

  function handleMouseDown() {
    holding.current = true;
    purrXHistory.current = [];
    purrDirectionChanges.current = 0;
    purrLastDirection.current = null;
  }

  function handleClick() {
    if (attacking || purring) return;
    setAttacking(true);
    setPawPrint({ x: mousePos.current.x, y: mousePos.current.y });
    showBubble('meow!', 1500);
    setTimeout(() => {
      setAttacking(false);
      setPawPrint(null);
    }, 800);
  }

  if (isLoading || isMobile) return null;

  return (
    <div
      ref={catRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className="fixed bottom-[24vh] left-0 z-50 cursor-pointer select-none"
    >
      <div className="relative">
        {/* Ethereal glow — warmer when purring */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: purring
              ? 'radial-gradient(circle, rgba(220,196,253,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
            transform: 'scale(2)',
          }}
          animate={{ opacity: purring ? [0.5, 0.8, 0.5] : [0.3, 0.6, 0.3] }}
          transition={{ duration: purring ? 1.5 : 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Cat from SVG Repo — split into body + eyes for animation */}
        <motion.div
          className="relative z-10"
          animate={purring
            ? { y: [0, -1, 0], x: [-0.5, 0.5, -0.5] }
            : { y: [0, -3, 0] }
          }
          transition={purring
            ? { duration: 0.15, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ filter: purring
            ? 'drop-shadow(0 0 14px rgba(220,196,253,0.4))'
            : 'drop-shadow(0 0 10px rgba(196,181,253,0.25))'
          }}
        >
          <motion.svg
            width="200" height="200" viewBox="0 0 32 32"
            animate={attacking
              ? { rotate: [0, -6, 4, 0] }
              : purring
                ? { rotate: [0, -0.5, 0, 0.5, 0], originX: '50%', originY: '70%' }
                : { rotate: [0, -1.5, 0, 1, 0], originX: '50%', originY: '70%' }
            }
            transition={attacking
              ? { duration: 0.4, ease: 'easeInOut' }
              : purring
                ? { duration: 0.3, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
            }
            className="overflow-visible"
          >
            {/* Body — everything except eyes */}
            <path
              d="M28.926 1.17l-2.182 3.608c-1.876-0.608-4.669-0.489-6.426 0l-2.102-3.557c-3.452 6.448-2.475 10.523 0.159 12.549-0.403 0.252-0.818 0.529-1.247 0.833-10.979-8.759-20.863 1.106-14.379 9.92h0.050c1.163 1.687 2.503 2.731 3.95 3.277 2.050 0.773 4.159 0.551 6.236 0.257s4.109-0.663 6.046-0.525c1.937 0.138 3.874 0.635 5.647 2.569 1.209 1.318 2.926-0.101 1.486-1.507-2.185-2.134-4.525-2.959-6.825-3.122s-4.505 0.293-6.502 0.576c-1.997 0.283-3.761 0.409-5.276-0.163-0.711-0.268-1.403-0.69-2.070-1.36h22.51c1.064-3.756 1.177-7.73-0.033-10.237 3.635-1.897 5.097-6.376 0.958-13.116z"
              fill={attacking ? 'rgba(180,140,220,0.4)' : purring ? 'rgba(200,180,230,0.35)' : 'rgba(176,168,196,0.25)'}
              className="transition-[fill] duration-300"
            />

            {/* Eyes — squinted when purring, normal otherwise */}
            {purring ? (
              <>
                {/* Squinted left eye — happy line */}
                <motion.path
                  d="M19.5 10.2 Q20.5 9 21.8 10.2"
                  fill="none"
                  stroke="rgba(180,150,220,0.7)"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0.7, 0.9, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Squinted right eye — happy line */}
                <motion.path
                  d="M25.5 10.2 Q26.5 9 27.8 10.2"
                  fill="none"
                  stroke="rgba(180,150,220,0.7)"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0.7, 0.9, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
              </>
            ) : (
              <>
                {/* Left eye — follows mouse */}
                <motion.path
                  d="M22.176 10.872c-2.316 1.117-3.367 0.212-3.817-1.656 2.273-1.41 3.626-0.278 3.817 1.656z"
                  fill={attacking ? 'rgba(200,160,240,0.9)' : 'rgba(140,120,180,0.6)'}
                  className="transition-[fill] duration-200"
                  animate={{
                    x: eyeOffset.x * 0.3,
                    y: eyeOffset.y * 0.3,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                />

                {/* Right eye — follows mouse */}
                <motion.path
                  d="M25.067 10.872c0.191-1.934 1.544-3.067 3.817-1.656-0.45 1.868-1.502 2.774-3.817 1.656z"
                  fill={attacking ? 'rgba(200,160,240,0.9)' : 'rgba(140,120,180,0.6)'}
                  className="transition-[fill] duration-200"
                  animate={{
                    x: eyeOffset.x * 0.3,
                    y: eyeOffset.y * 0.3,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                />

                {/* Eye glow */}
                <motion.circle
                  cx={21} cy={10} r={2}
                  fill="none"
                  stroke="rgba(196,181,253,0.1)"
                  strokeWidth="0.2"
                  animate={{
                    opacity: [0.05, 0.15, 0.05],
                    x: eyeOffset.x * 0.3,
                    y: eyeOffset.y * 0.3,
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx={27} cy={10} r={2}
                  fill="none"
                  stroke="rgba(196,181,253,0.1)"
                  strokeWidth="0.2"
                  animate={{
                    opacity: [0.05, 0.15, 0.05],
                    x: eyeOffset.x * 0.3,
                    y: eyeOffset.y * 0.3,
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                />
              </>
            )}

          </motion.svg>
        </motion.div>

        {/* Speech bubble */}
        <AnimatePresence>
          {bubble && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute bottom-full left-[10%] right-[10%] mb-1 text-center bg-white/85 backdrop-blur-md border border-[#e9e4f5]/60 rounded-xl px-2 py-2 shadow-[0_2px_12px_rgba(196,181,253,0.15)]"
            >
              <span className="text-[11px] text-[#7c7291]">{bubble}</span>
              <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white/85 border-r border-b border-[#e9e4f5]/60 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Paw print at click location */}
      <AnimatePresence>
        {pawPrint && (
          <motion.div
            className="fixed pointer-events-none z-[100]"
            style={{ left: pawPrint.x - 20, top: pawPrint.y - 20 }}
            initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
            animate={{ opacity: [0, 0.7, 0.5], scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <svg width="40" height="40" viewBox="0 0 512 512" fill="rgba(176,168,196,0.5)" style={{ filter: 'drop-shadow(0 0 6px rgba(196,181,253,0.3))' }}>
              <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
