'use client';

import { useState, useEffect, useRef } from 'react';

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
      const catY = rect.top + rect.height / 2;
      const dx = e.clientX - catX;
      const dy = e.clientY - catY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxOffset = 3;
      setEyeOffset({
        x: dist > 0 ? (dx / dist) * maxOffset : 0,
        y: dist > 0 ? (dy / dist) * maxOffset : 0,
      });
    }
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  function handleClick() {
    setAttacking(true);
    setTimeout(() => setAttacking(false), 600);
  }

  // Don't show until loaded
  if (remaining === null && !isOwner) return null;

  return (
    <div
      ref={catRef}
      onClick={handleClick}
      className="fixed bottom-4 left-4 z-50 cursor-pointer select-none"
      title={`${remaining} recs left`}
    >
      <div className="flex flex-col items-center gap-1">
        <svg width="60" height="55" viewBox="0 0 100 90" fill="none" stroke="#b0a8c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Ears */}
          <path d="M30 38 L20 12 L40 30" />
          <path d="M70 38 L80 12 L60 30" />
          {/* Head */}
          <ellipse cx="50" cy="42" rx="26" ry="22" />
          {/* Eyes - follow mouse */}
          <circle cx={40 + eyeOffset.x} cy={39 + eyeOffset.y} r="3.5" fill="#b0a8c4" stroke="none" />
          <circle cx={60 + eyeOffset.x} cy={39 + eyeOffset.y} r="3.5" fill="#b0a8c4" stroke="none" />
          {/* Eye glint */}
          <circle cx={41 + eyeOffset.x * 0.5} cy={38 + eyeOffset.y * 0.5} r="1" fill="white" stroke="none" />
          <circle cx={61 + eyeOffset.x * 0.5} cy={38 + eyeOffset.y * 0.5} r="1" fill="white" stroke="none" />
          {/* Nose */}
          <path d="M48 47 L50 49 L52 47" />
          {/* Mouth */}
          <path d="M50 49 Q46 53 42 51" />
          <path d="M50 49 Q54 53 58 51" />
          {/* Whiskers */}
          <line x1="16" y1="44" x2="34" y2="46" />
          <line x1="16" y1="50" x2="34" y2="49" />
          <line x1="84" y1="44" x2="66" y2="46" />
          <line x1="84" y1="50" x2="66" y2="49" />
          {/* Body hint */}
          <path d="M30 62 Q50 78 70 62" />
          {/* Tail - swinging */}
          <path
            d="M72 62 Q88 50 92 35"
            className="animate-[tailSwing_1.5s_ease-in-out_infinite]"
            style={{ transformOrigin: '72px 62px' }}
          />
          {/* Paw attack */}
          {attacking && (
            <>
              <path d="M26 55 L8 40 L12 44 L6 36 L14 42 L10 34 L18 46" stroke="#b0a8c4" strokeWidth="2.5" className="animate-[swipe_0.3s_ease-out]" />
              <line x1="4" y1="32" x2="10" y2="28" strokeWidth="1.5" className="animate-[swipe_0.3s_ease-out]" />
              <line x1="2" y1="38" x2="6" y2="36" strokeWidth="1.5" className="animate-[swipe_0.3s_ease-out]" />
            </>
          )}
        </svg>
        {!isOwner && remaining !== null && (
          <span className="text-[10px] text-[#b0a8c4] font-medium">
            {remaining === 0 ? 'no recs left' : `${remaining} rec${remaining !== 1 ? 's' : ''} left`}
          </span>
        )}
      </div>

      <style jsx>{`
        @keyframes tailSwing {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes swipe {
          0% { transform: translateX(10px) rotate(20deg); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(0) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
