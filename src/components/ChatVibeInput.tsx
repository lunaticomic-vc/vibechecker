'use client';

import { useState, useRef, useEffect } from 'react';
import type { ContentType } from '@/types/index';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
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
    </div>
  );
}
