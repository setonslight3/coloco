'use client';

import React from 'react';
import { MatchState, DrawStroke } from '../types/index';
import { Clock, Eye, Sparkles, Users } from 'lucide-react';

interface ShowdownModalProps {
  match: MatchState;
}

export function ShowdownModal({ match }: ShowdownModalProps) {
  const teams = Object.values(match.teams);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 overflow-y-auto select-none animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center max-w-xl my-4 sm:my-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400 text-sky-300 text-xs font-bold uppercase tracking-widest mb-3 shadow-inner">
          <Eye className="w-4 h-4 text-sky-400" />
          The Grand Reveal • Appreciation Period
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
          All Canvases Revealed!
        </h2>
        <p className="text-xs sm:text-sm text-sky-200/80 mt-1 max-w-md mx-auto">
          Explore all team creations together while Google Gemini evaluates cooperative fidelity and artistic style.
        </p>

        {/* Countdown Badge */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-xl bg-navy-900 border border-navy-700 text-amber-400 font-mono text-xs sm:text-sm font-black shadow-lg">
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          Verdict in {match.revealTimeRemainingSeconds}s
        </div>
      </div>

      {/* Side-by-side Artwork Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full mb-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex flex-col bg-white dark:bg-navy-900 border-2 border-sky-300/40 dark:border-navy-700 rounded-3xl p-4 sm:p-5 shadow-2xl"
          >
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <span
                className="font-black text-base sm:text-lg truncate max-w-[180px] sm:max-w-xs"
                style={{ color: team.color }}
              >
                {team.name}
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <Users className="w-3 h-3" />
                {team.playerIds.length} Painters
              </span>
            </div>

            {/* Team Artwork Frame */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-navy-700 bg-white relative shadow-inner">
              {/* Optional template line art if coloring mode */}
              {match.challenge.mode === 'coloring' && match.challenge.templateLineArtSvg && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-20 text-slate-800 p-4"
                  dangerouslySetInnerHTML={{ __html: match.challenge.templateLineArtSvg }}
                />
              )}
              <MiniCanvas strokes={team.strokes} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniCanvas({ strokes }: { strokes: DrawStroke[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1000, 1000);

    for (const s of strokes) {
      if (s.points.length === 0) continue;
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={1000}
      className="w-full h-full object-contain"
    />
  );
}
