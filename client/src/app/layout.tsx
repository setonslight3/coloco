import './globals.css';
import type { Metadata } from 'next';
import { NavigationHeader } from '../components/NavigationHeader';

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
        <NavigationHeader />

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
