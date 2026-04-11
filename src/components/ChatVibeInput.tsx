'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ContentType } from '@/types/index';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const VIBES_BY_TYPE: Partial<Record<ContentType, string[]>> = {
  movie: ['something light while i eat', 'sleepover binge with the girls', 'need a good cry', 'rainy day, slow and pretty'],
  tv: ['sleepover binge', 'background show while cooking', 'something addictive', 'cozy and feel-good'],
  anime: ['beautiful animation', 'unhinged and chaotic', 'slow burn with deep characters', 'emotional and bittersweet'],
  youtube: ['something light ~20 mins', 'deep dive into something niche', 'procrastinating, make it unhinged', 'calming background'],
  kdrama: ['enemies to lovers, slow burn', 'something funny and lighthearted', 'need to cry, melodrama', 'cozy romance'],
  substack: ['makes me think differently', 'personal essay, raw and honest', 'culture criticism, witty', 'about art or creativity'],
  book: ['something immersive', 'short and beautiful', 'changes how i see things', 'cozy like a warm blanket'],
  poetry: ['heartbreak but beautiful', 'nature and stillness', 'angry and raw', 'soft and tender'],
  short_story: ['surreal and dreamlike', 'twist ending that haunts me', 'quiet and melancholy', 'weird and wonderful'],
  essay: ['philosophical and deep', 'vulnerable and real', 'sharp cultural commentary', 'about love or loss'],
  podcast: ['true crime but thoughtful', 'something funny for commute', 'deep conversation about life', 'weird and niche'],
  research: ['rabbit hole i can get lost in', 'mind-blowing about the universe', 'how things work', 'niche topic nobody talks about'],
  manga: ['beautiful art, slow pacing', 'dark and psychological', 'wholesome slice of life', 'epic worldbuilding'],
  comic: ['gritty noir, morally grey', 'colorful classic superhero', 'indie and artistic', 'dark humor and sharp writing'],
  game: ['something story-driven', 'cozy and relaxing', 'challenging and rewarding', 'open world to get lost in'],
};

const PLACEHOLDER_BY_TYPE: Partial<Record<ContentType, string>> = {
  movie: 'what kind of movie are you in the mood for?',
  tv: 'what kind of show are you feeling?',
  anime: 'what kind of anime vibe are you after?',
  kdrama: 'what kind of kdrama mood?',
  youtube: 'what kind of video are you looking for?',
  book: 'what kind of book are you in the mood for?',
  manga: 'what manga vibe are you feeling?',
  comic: 'what kind of comic are you after?',
  poetry: 'what kind of poem fits your mood?',
  short_story: 'what kind of story are you feeling?',
  essay: 'what kind of essay are you in the mood for?',
  podcast: 'what kind of podcast are you looking for?',
  research: 'what are you curious about?',
  game: 'what kind of game are you in the mood for?',
};

interface Props {
  contentType: ContentType;
  onVibeReady: (vibe: string, useInterests: boolean) => void;
  loading: boolean;
  isOwner?: boolean;
}

export default function ChatVibeInput({ contentType, onVibeReady, loading, isOwner = false }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [useInterests, setUseInterests] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    // Only return focus to the input after the user has sent something
    // (so the assistant reply flows into typing a follow-up). On initial
    // mount we leave the input un-focused so the suggestion keyboard
    // doesn't auto-expand before the user taps the field.
    if (messages.length > 0) {
      inputRef.current?.focus();
    }
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || thinking || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setThinking(true);

    try {
      const res = await fetch('/api/vibe-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, contentType }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      if (data.type === 'question') {
        setMessages([...newMessages, { role: 'assistant', content: data.message }]);
      } else if (data.type === 'ready') {
        // Show a final "got it" message then trigger recommendation
        setMessages([...newMessages, { role: 'assistant', content: 'ok i know exactly what to get you, one sec ✨' }]);
        setTimeout(() => onVibeReady(data.vibe, useInterests), 800);
      }
    } catch {
      // Fallback: use the raw text as vibe
      onVibeReady(text, useInterests);
    } finally {
      setThinking(false);
    }
  }

  const placeholder = PLACEHOLDER_BY_TYPE[contentType] ?? 'describe your vibe...';

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-2 border-[#e9e4f5]/80 bg-[#faf8ff] shadow-xl shadow-purple-100/30 overflow-hidden">
        {/* Notch area */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-20 h-1 rounded-full bg-[#e9e4f5]" />
        </div>

        {/* Chat header */}
        <div className="px-5 pb-2 border-b border-[#e9e4f5]/60">
          <p className="text-[11px] text-[#b8b0c8] text-center">vibe check</p>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="h-[320px] overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-thin">
          {/* Initial greeting */}
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md px-3.5 py-2 bg-white border border-[#e9e4f5]/60 shadow-sm">
                <p className="text-[13px] text-[#2d2640] leading-relaxed">
                  hey! {placeholder}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm ${
                  msg.role === 'user'
                    ? 'rounded-br-md bg-[#8b5cf6] text-white'
                    : 'rounded-bl-md bg-white border border-[#e9e4f5]/60 text-[#2d2640]'
                }`}
              >
                <p className="text-[13px] leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-white border border-[#e9e4f5]/60 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-[bounce_1s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-[bounce_1s_ease-in-out_0.15s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b8b0c8] animate-[bounce_1s_ease-in-out_0.3s_infinite]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[#e9e4f5]/60 px-3 py-2.5 bg-white/50">
          {isOwner && (
            <label className="flex items-center gap-1.5 cursor-pointer select-none mb-2 px-1">
              <input
                type="checkbox"
                checked={useInterests}
                onChange={(e) => setUseInterests(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[#e9e4f5] text-[#8b5cf6] focus:ring-[#c4b5fd] focus:ring-offset-0 cursor-pointer accent-[#8b5cf6]"
              />
              <span className="text-[10px] text-[#b8b0c8]">use my interests</span>
            </label>
          )}
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
              onFocus={() => {
                if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                setInputFocused(true);
              }}
              onBlur={() => {
                // Short delay so tapping a keyboard key (which briefly blurs the
                // input) doesn't close the keyboard before the click registers.
                blurTimerRef.current = setTimeout(() => setInputFocused(false), 180);
              }}
              placeholder={messages.length === 0 ? 'type your vibe...' : 'reply...'}
              disabled={loading}
              className="flex-1 rounded-full bg-[#f5f3ff] border border-[#e9e4f5] px-4 py-2 text-[13px] text-[#2d2640] placeholder-[#c4b5fd] focus:outline-none focus:border-[#c4b5fd] disabled:opacity-40"
            />
            <button
              onClick={send}
              disabled={!input.trim() || thinking || loading}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#8b5cf6] text-white shrink-0 transition-all hover:bg-[#7c3aed] active:scale-95 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Home bar */}
        <div className="flex justify-center py-2">
          <div className="w-16 h-1 rounded-full bg-[#e9e4f5]" />
        </div>
      </div>

      {/* Suggestion keyboard — slides up when the input is focused, slides
          down after the user sends their first message (like a real phone). */}
      <AnimatePresence>
        {inputFocused && messages.filter(m => m.role === 'user').length === 0 && (
          <motion.div
            key="vibe-keyboard"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.32, ease: [0.22, 0.9, 0.32, 1] }}
            className="mt-4 px-1"
          >
            <div className="grid grid-cols-2 gap-2.5">
              {(VIBES_BY_TYPE[contentType] ?? []).map(example => (
                <button
                  key={example}
                  type="button"
                  // Prevent the mousedown from stealing focus from the input so
                  // the keyboard stays open while the user taps a key.
                  onMouseDown={e => e.preventDefault()}
                  onTouchStart={e => e.preventDefault()}
                  onClick={() => {
                    setInput(example);
                    inputRef.current?.focus();
                  }}
                  className="vibe-key"
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .vibe-key {
          background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);
          border: 1px solid rgba(196, 181, 253, 0.55);
          border-bottom-width: 3px;
          border-bottom-color: rgba(155, 135, 200, 0.55);
          border-radius: 12px;
          padding: 12px 10px;
          min-height: 52px;
          font-size: 11px;
          font-weight: 500;
          color: #5a5270;
          letter-spacing: 0.01em;
          line-height: 1.35;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 2px 0 rgba(196, 181, 253, 0.4),
            0 5px 12px rgba(196, 181, 253, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transition:
            transform 0.12s ease,
            box-shadow 0.15s ease,
            border-color 0.2s,
            color 0.2s;
          cursor: pointer;
          user-select: none;
        }
        .vibe-key:hover {
          transform: translateY(-2px);
          border-color: rgba(124, 58, 237, 0.45);
          color: #7c3aed;
          box-shadow:
            0 4px 0 rgba(155, 135, 200, 0.55),
            0 8px 18px rgba(196, 181, 253, 0.32),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }
        .vibe-key:active {
          transform: translateY(1px);
          border-bottom-width: 2px;
          box-shadow:
            0 1px 0 rgba(155, 135, 200, 0.4),
            0 2px 5px rgba(196, 181, 253, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
