'use client';

import React, { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { Trophy, Medal, Flame, X, User, ArrowUpRight } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayerId: string;
}

export function LeaderboardModal({ isOpen, onClose, currentPlayerId }: LeaderboardModalProps) {
  const socket = getSocket();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    socket.emit('stats:get_leaderboard');

    const handleLeaderboard = (data: { leaderboard: any[] }) => {
      setLeaderboard(data.leaderboard);
      setLoading(false);
    };

    socket.on('stats:leaderboard', handleLeaderboard);
    return () => {
      socket.off('stats:leaderboard', handleLeaderboard);
    };
  }, [isOpen, socket]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn">
      <div className="bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-navy-700 flex items-center justify-between bg-slate-50 dark:bg-navy-800/60">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Painter Hall of Fame
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              Loading rankings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm font-semibold">
              No ranked matches completed yet. Finish a match to claim the crown!
            </div>
          ) : (
            leaderboard.map((player, index) => {
              const isCurrent = player.playerId === currentPlayerId;
              return (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/40 ring-1 ring-sky-400/40'
                      : 'border-slate-200 dark:border-navy-700 bg-slate-50/60 dark:bg-navy-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-amber-950'
                          : index === 1
                          ? 'bg-slate-300 text-slate-800'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
                        {player.playerId.substring(0, 10)} {isCurrent && '(You)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {player.matches} Matches • {player.winRate}% Win Rate
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-sky-600 dark:text-sky-400 block">
                      {player.avgScore} <span className="text-[10px] font-bold text-slate-400">pts avg</span>
                    </span>
                    <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5 justify-end">
                      <Flame className="w-3 h-3" /> {player.wins} Wins
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
