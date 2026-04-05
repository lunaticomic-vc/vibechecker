import type { Metadata } from 'next';
import { Inter, Playfair_Display, Caveat } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Particles from '@/components/Particles';
import GuestCat from '@/components/GuestCat';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const caveat = Caveat({ subsets: ['latin'], weight: ['700'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'Consumption Corner',
  description: 'Your personal vibe-based recommendation engine',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playfair.variable} ${caveat.variable} min-h-screen`}>
        <Particles />
        <Header />
        <AuthProvider>
          {children}
        </AuthProvider>
        <GuestCat />
      </body>
    </html>
  );
}
