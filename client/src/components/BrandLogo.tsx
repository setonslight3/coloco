import React from 'react';

export function BrandLogo({ size = 44, className = '', showSubtitle = true }: { size?: number; className?: string; showSubtitle?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Three interlocking paintbrushes meeting at the center */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105 duration-300 drop-shadow-md flex-shrink-0"
      >
        <defs>
          {/* Wood Handle Gradient */}
          <linearGradient id="handleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="50%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Metal Ferrule Gradient */}
          <linearGradient id="ferruleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Red Bristles Gradient */}
          <linearGradient id="redBristles" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          {/* Blue Bristles Gradient */}
          <linearGradient id="blueBristles" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Green Bristles Gradient */}
          <linearGradient id="greenBristles" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Center Glow */}
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>

        {/* --- Brush 1: Red (Top pointing down) --- */}
        <g transform="rotate(0 60 60)">
          {/* Wood Handle */}
          <path d="M 58 10 C 58 6 62 6 62 10 L 63 36 L 57 36 Z" fill="url(#handleGrad)" />
          {/* Silver Ferrule */}
          <rect x="56" y="36" width="8" height="8" rx="1.5" fill="url(#ferruleGrad)" stroke="#475569" strokeWidth="0.5" />
          {/* Bristles */}
          <path d="M 56 44 C 55 52 60 56 60 56 C 60 56 65 52 64 44 Z" fill="url(#redBristles)" />
        </g>

        {/* --- Brush 2: Blue (120deg) --- */}
        <g transform="rotate(120 60 60)">
          {/* Wood Handle */}
          <path d="M 58 10 C 58 6 62 6 62 10 L 63 36 L 57 36 Z" fill="url(#handleGrad)" />
          {/* Silver Ferrule */}
          <rect x="56" y="36" width="8" height="8" rx="1.5" fill="url(#ferruleGrad)" stroke="#475569" strokeWidth="0.5" />
          {/* Bristles */}
          <path d="M 56 44 C 55 52 60 56 60 56 C 60 56 65 52 64 44 Z" fill="url(#blueBristles)" />
        </g>

        {/* --- Brush 3: Green (240deg) --- */}
        <g transform="rotate(240 60 60)">
          {/* Wood Handle */}
          <path d="M 58 10 C 58 6 62 6 62 10 L 63 36 L 57 36 Z" fill="url(#handleGrad)" />
          {/* Silver Ferrule */}
          <rect x="56" y="36" width="8" height="8" rx="1.5" fill="url(#ferruleGrad)" stroke="#475569" strokeWidth="0.5" />
          {/* Bristles */}
          <path d="M 56 44 C 55 52 60 56 60 56 C 60 56 65 52 64 44 Z" fill="url(#greenBristles)" />
        </g>

        {/* Center Interlocking Palette Droplet */}
        <circle cx="60" cy="60" r="7" fill="url(#centerGlow)" stroke="#ffffff" strokeWidth="2" />
        <circle cx="58.5" cy="58.5" r="2" fill="#ffffff" opacity="0.8" />
      </svg>

      {/* Typography */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
            ColoCo
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-sky-100 text-sky-700 dark:bg-navy-800 dark:text-sky-300 border border-sky-200 dark:border-navy-700">
            v2.0
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-sky-300/80 truncate mt-0.5">
            Competitive Coloring
          </span>
        )}
      </div>
    </div>
  );
}
