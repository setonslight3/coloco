import './globals.css';
import type { Metadata } from 'next';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandLogo } from '../components/BrandLogo';

export const metadata: Metadata = {
  title: 'ColoCo • Competitive Coloring',
  description: 'Browser-first multiplayer creative competition game with cooperative territory canvases and AI judging.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-sky-50/50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 w-full border-b border-sky-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
          <BrandLogo size={42} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-sky-200 dark:border-navy-800 py-4 px-6 text-center text-xs text-slate-400">
          ColoCo • Revision 2 • Competitive Coloring & AI Judging
        </footer>
      </body>
    </html>
  );
}
