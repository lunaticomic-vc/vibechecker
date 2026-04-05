'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'are-you' | 'login' | 'wanna-try' | 'guest-welcome' | 'bye';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('are-you');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.href = '/';
        return;
      } else {
        setError('wrong password');
        setPassword('');
      }
    } catch {
      setError('something went wrong');
    }
    setLoading(false);
  }

  async function handleGuest() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/guest', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/';
        return;
      }
    } catch { /* */ }
    setLoading(false);
  }

  const btnClass = "py-3 px-6 rounded-2xl border-2 border-[#e8e3f3]/80 bg-white/40 text-[#7c7291] text-sm hover:bg-white/70 hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all duration-300 w-full max-w-[260px]";

  return (
    <main className="min-h-screen flex items-center justify-center relative z-10">
      <div className="flex flex-col items-center gap-5 animate-[fadeIn_0.5s_ease-out]">

        {step === 'are-you' && (
          <>
            <p className="text-lg text-[#2d2640] font-medium tracking-wide">Are you Danitsa?</p>
            <div className="flex flex-col gap-3 w-full items-center">
              <button onClick={() => setStep('login')} className={btnClass}>yes</button>
              <button onClick={() => setStep('wanna-try')} className={btnClass}>no</button>
            </div>
          </>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 w-full max-w-[280px]">
            <button
              type="button"
              onClick={() => { setStep('are-you'); setError(''); }}
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-[#e8e3f3]/60 text-[#c8c2d6] hover:border-[#c4b5fd] hover:text-[#7c3aed] transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <p className="text-sm text-[#7c7291]">prove it</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              autoFocus
              className="w-full text-center rounded-2xl border-2 border-[#e9e4f5] bg-white/80 backdrop-blur-sm px-4 py-3 text-[#2d2640] placeholder-[#c4b5fd] focus:border-[#c4b5fd] focus:outline-none focus:ring-2 focus:ring-[#c4b5fd]/20 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!password.trim() || loading}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8b5cf6] text-white transition-all hover:bg-[#7c3aed] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200/50"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </form>
        )}

        {step === 'wanna-try' && (
          <>
            <p className="text-lg text-[#2d2640] font-medium tracking-wide">wanna try out the app?</p>
            <div className="flex flex-col gap-3 w-full items-center">
              <button onClick={() => setStep('guest-welcome')} className={btnClass}>yes</button>
              <button onClick={() => setStep('bye')} className={btnClass}>no</button>
            </div>
          </>
        )}

        {step === 'guest-welcome' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg text-[#2d2640] font-medium tracking-wide text-center">you have 3 recs on the house</p>
            <p className="text-xs text-[#b0a8c4]">make them count</p>
            <button
              onClick={handleGuest}
              disabled={loading}
              className="py-3 px-8 rounded-2xl bg-[#8b5cf6] text-white text-sm font-medium hover:bg-[#7c3aed] transition-all duration-300 shadow-lg shadow-purple-200/50 disabled:opacity-40"
            >
              {loading ? 'loading...' : 'let\'s go'}
            </button>
          </div>
        )}

        {step === 'bye' && (
          <div className="flex flex-col items-center gap-4">
            {/* Silver cat outline */}
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#b0a8c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-[catBounce_2s_ease-in-out_infinite]">
              {/* Ears */}
              <path d="M30 45 L22 20 L38 35" />
              <path d="M70 45 L78 20 L62 35" />
              {/* Head */}
              <ellipse cx="50" cy="50" rx="25" ry="22" />
              {/* Eyes */}
              <circle cx="40" cy="47" r="3" fill="#b0a8c4" stroke="none" />
              <circle cx="60" cy="47" r="3" fill="#b0a8c4" stroke="none" />
              {/* Nose */}
              <path d="M48 54 L50 56 L52 54" />
              {/* Mouth */}
              <path d="M50 56 Q46 60 42 58" />
              <path d="M50 56 Q54 60 58 58" />
              {/* Whiskers */}
              <line x1="20" y1="52" x2="36" y2="54" />
              <line x1="20" y1="58" x2="36" y2="57" />
              <line x1="80" y1="52" x2="64" y2="54" />
              <line x1="80" y1="58" x2="64" y2="57" />
            </svg>
            <p className="text-lg text-[#2d2640] font-medium tracking-wide text-center">nuh uh</p>
            <p className="text-xs text-[#b0a8c4]">what are you doing here</p>
            <button
              onClick={() => setStep('wanna-try')}
              className="text-xs text-[#c4b5fd] hover:text-[#7c3aed] transition-colors mt-2"
            >
              fine, show me
            </button>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes catBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(-3deg); }
          75% { transform: translateY(-5px) rotate(3deg); }
        }
      `}</style>
    </main>
  );
}
