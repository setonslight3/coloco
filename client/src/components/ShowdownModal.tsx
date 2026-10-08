'use client';

import React from 'react';
import { MatchState, DrawStroke } from '../types/index';
import { Sparkles, Clock, Eye } from 'lucide-react';

interface ShowdownModalProps {
  match: MatchState;
}

export function ShowdownModal({ match }: ShowdownModalProps) {
  const teams = Object.values(match.teams);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
      {/* Header Banner */}
      <div className="text-center max-w-xl mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400 text-sky-300 text-xs font-bold uppercase tracking-widest mb-3">
          <Eye className="w-4 h-4" />
          The Grand Reveal • Appreciation Period
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
          All Canvases Revealed!
        </h2>
        <p className="text-sm text-sky-200/80 mt-1">
          Take in all team creations together while the AI Judge evaluates the masterpieces.
        </p>

        {/* Countdown to Verdict */}
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-1 rounded-xl bg-navy-900 border border-navy-700 text-amber-400 font-mono text-sm font-bold shadow-inner">
          <Clock className="w-4 h-4 animate-spin text-amber-400" />
          Verdict in {match.revealTimeRemainingSeconds}s
        </div>
      </div>

      {/* Side-by-side Artwork Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex flex-col items-center bg-white dark:bg-navy-900 border-2 border-sky-300/40 dark:border-navy-700 rounded-3xl p-5 shadow-2xl"
          >
            <div className="w-full flex items-center justify-between mb-3 px-2">
              <span
                className="font-black text-lg text-slate-800 dark:text-white"
                style={{ color: team.color }}
              >
                {team.name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 font-bold">
                {team.playerIds.length} Painters
              </span>
            </div>

            {/* Team Canvas Render */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-navy-700 bg-white relative shadow-inner">
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
