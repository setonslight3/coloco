import './globals.css';
import type { Metadata } from 'next';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandLogo } from '../components/BrandLogo';

export const metadata: Metadata = {
  title: 'ColoCo • Competitive Coloring',
  description: 'Browser-first multiplayer creative competition game with cooperative territory canvases, WebRTC voice, and AI judging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-sky-200/60 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
          <BrandLogo size={42} />

          <div className="flex items-center gap-3">
            {/* Live Multiplayer Status Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Realtime</span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 w-full max-w-7xl mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-sky-100 dark:border-navy-800/80 py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <span>ColoCo • Competitive Coloring • Revision 2</span>
          <span>Next.js + Socket.IO + WebRTC + Gemini AI</span>
        </footer>
      </body>
    </html>
  );
}
