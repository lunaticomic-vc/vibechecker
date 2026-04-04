'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-[#e9e4f5]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3">
        <Link href="/" className="text-lg sm:text-xl font-bold text-[#7c3aed]">
          VibeChecker
        </Link>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(v => !v)}
          className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f3f0ff] transition-colors"
          aria-label="Menu"
        >
          <div className="flex flex-col gap-[5px]">
            <span className={`block w-5 h-[2px] bg-[#7c3aed] rounded-full transition-all duration-200 ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-5 h-[2px] bg-[#7c3aed] rounded-full transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[2px] bg-[#7c3aed] rounded-full transition-all duration-200 ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </div>
        </button>
      </div>

      {/* Dropdown menu */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? 'max-h-48' : 'max-h-0'}`}>
        <nav className="mx-auto max-w-5xl px-4 sm:px-6 pb-4 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#2d2640] hover:bg-[#f3f0ff] hover:text-[#7c3aed] transition-colors"
          >
            Home
          </Link>
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#2d2640] hover:bg-[#f3f0ff] hover:text-[#7c3aed] transition-colors"
          >
            Favorites
          </Link>
          <Link
            href="/progress"
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#2d2640] hover:bg-[#f3f0ff] hover:text-[#7c3aed] transition-colors"
          >
            Progress
          </Link>
        </nav>
      </div>
    </header>
  );
}
