import type {Metadata} from 'next';
import { Hanken_Grotesk, Sora, Space_Mono } from 'next/font/google';
import './globals.css'; // Global styles

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '700', '800'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Neon Shards Breaker - Retro Arcade Experience',
  description: 'Premium retro-futuristic arcade Neon Shards Breaker game with multiple paddles, store customization, leaderboard, and dynamic audio synth.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${hanken.variable} ${sora.variable} ${spaceMono.variable}`}>
      <body suppressHydrationWarning className="bg-[#131315] text-[#e5e1e4] antialiased">
        {children}
      </body>
    </html>
  );
}
