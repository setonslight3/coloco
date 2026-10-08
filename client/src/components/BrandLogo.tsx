import React from 'react';

export function BrandLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:rotate-12 duration-300 drop-shadow-md"
      >
        {/* Brush 1: Red (top-left angled down toward center) */}
        <g transform="rotate(0 50 50)">
          {/* Wood Handle */}
          <line x1="50" y1="12" x2="50" y2="34" stroke="#854d0e" strokeWidth="6" strokeLinecap="round" />
          {/* Ferrule (metal band) */}
          <rect x="46" y="34" width="8" height="6" rx="1" fill="#94a3b8" />
          {/* Red Bristles */}
          <path d="M46 40 C46 48 50 52 50 52 C50 52 54 48 54 40 Z" fill="#f43f5e" />
        </g>

        {/* Brush 2: Blue (angled 120deg) */}
        <g transform="rotate(120 50 50)">
          {/* Wood Handle */}
          <line x1="50" y1="12" x2="50" y2="34" stroke="#854d0e" strokeWidth="6" strokeLinecap="round" />
          {/* Ferrule */}
          <rect x="46" y="34" width="8" height="6" rx="1" fill="#94a3b8" />
          {/* Blue Bristles */}
          <path d="M46 40 C46 48 50 52 50 52 C50 52 54 48 54 40 Z" fill="#0284c7" />
        </g>

        {/* Brush 3: Green (angled 240deg) */}
        <g transform="rotate(240 50 50)">
          {/* Wood Handle */}
          <line x1="50" y1="12" x2="50" y2="34" stroke="#854d0e" strokeWidth="6" strokeLinecap="round" />
          {/* Ferrule */}
          <rect x="46" y="34" width="8" height="6" rx="1" fill="#94a3b8" />
          {/* Green Bristles */}
          <path d="M46 40 C46 48 50 52 50 52 C50 52 54 48 54 40 Z" fill="#10b981" />
        </g>

        {/* Center Interlocking Splash / Palette ring */}
        <circle cx="50" cy="50" r="5" fill="#facc15" stroke="#ffffff" strokeWidth="1.5" />
      </svg>
      <div className="flex flex-col">
        <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-coloco-red via-coloco-blue to-coloco-green bg-clip-text text-transparent">
          ColoCo
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-sky-300">
          Competitive Coloring
        </span>
      </div>
    </div>
  );
}
