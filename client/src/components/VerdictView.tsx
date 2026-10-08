'use client';

import React, { useEffect } from 'react';
import { MatchState, TeamScoreResult, DrawStroke } from '../types/index';
import { Trophy, Award, Sparkles, RotateCcw, BarChart3, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VerdictViewProps {
  match: MatchState;
  onRematch: () => void;
}

export function VerdictView({ match, onRematch }: VerdictViewProps) {
  const results = match.results || [];
  const sorted = [...results].sort((a, b) => b.totalWeightedScore - a.totalWeightedScore);
  const winner = sorted[0];

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignored
    }
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl px-3 sm:px-6 py-6 sm:py-10 select-none animate-fadeIn">
      {/* Trophy & Podium Header */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="inline-flex p-3 sm:p-4 rounded-3xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-500 mb-3 shadow-lg">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Final Verdict & AI Scoring
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Evaluated via server-side Gemini Rubric v2.0 (Accuracy 25%, Creativity 20%, Cooperation 20%, Completion 15%, Cohesion 10%, Efficiency 10%)
        </p>
      </div>

      {/* Ranked Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full mb-10">
        {sorted.map((res, rankIdx) => {
          const team = match.teams[res.teamId];
          const isWinner = rankIdx === 0;

          return (
            <div
              key={res.teamId}
              className={`flex flex-col bg-white dark:bg-navy-900 rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-xl ${
                isWinner
                  ? 'border-amber-400 dark:border-amber-500 ring-4 ring-amber-400/20'
                  : 'border-slate-200 dark:border-navy-700'
              }`}
            >
              {/* Header: Rank + Name + Score */}
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      isWinner
                        ? 'bg-amber-400 text-navy-900 shadow-md'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    #{rankIdx + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base sm:text-xl text-slate-900 dark:text-white truncate">
                      {res.teamName}
                    </h3>
                    {isWinner && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Champion Team
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
                    {res.totalWeightedScore}
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                    Score / 100
                  </span>
                </div>
              </div>

              {/* Artwork Preview */}
              {team && (
                <div className="w-full aspect-square max-h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-navy-700 bg-white mb-4 shadow-inner relative">
                  {match.challenge.mode === 'coloring' && match.challenge.templateLineArtSvg && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20 text-slate-800 p-2"
                      dangerouslySetInnerHTML={{ __html: match.challenge.templateLineArtSvg }}
                    />
                  )}
                  <ArtworkPreview strokes={team.strokes} />
                </div>
              )}

              {/* Special Awards Badges */}
              {res.awards.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {res.awards.map((award, aIdx) => (
                    <span
                      key={aIdx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 shadow-xs"
                    >
                      <Award className="w-3.5 h-3.5" />
                      {award}
                    </span>
                  ))}
                </div>
              )}

              {/* Rubric Breakdown Accordion/Grid */}
              <div className="space-y-2.5 mb-4 bg-slate-50 dark:bg-navy-800/60 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-navy-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-3.5 h-3.5" /> Category Breakdown
                </span>

                {Object.entries(res.categories).map(([key, cat]) => (
                  <div key={key} className="flex flex-col text-xs">
                    <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                      <span>{cat.name} ({cat.weight}%)</span>
                      <span className="font-mono font-bold">{cat.score}/100</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden my-1">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 italic break-words leading-tight">
                      "{cat.feedback}"
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Judge Summary Quote */}
              <div className="mt-auto p-3 rounded-2xl bg-sky-50 dark:bg-navy-800 border border-sky-100 dark:border-navy-700 text-xs text-sky-900 dark:text-sky-200 italic break-words leading-relaxed">
                "{res.verdictSummary}"
              </div>
            </div>
          );
        })}
      </div>

      {/* Return / Rematch CTA */}
      <button
        onClick={onRematch}
        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 hover:opacity-95 text-white font-black text-sm sm:text-base shadow-xl transition-transform hover:scale-105 active:scale-95"
      >
        <RotateCcw className="w-5 h-5" />
        Return to Lobby / Rematch
      </button>
    </div>
  );
}

function ArtworkPreview({ strokes }: { strokes: DrawStroke[] }) {
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
