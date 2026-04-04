import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          VibeChecker
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/favorites" className="hover:text-white transition-colors">Favorites</Link>
          <Link href="/progress" className="hover:text-white transition-colors">Progress</Link>
        </nav>
      </div>
    </header>
  );
}
