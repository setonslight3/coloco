'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '../../../lib/socket';
import { MatchState, DrawStroke, TeamScoreResult } from '../../../types/index';
import { Canvas } from '../../../components/Canvas';
import { VoiceChat } from '../../../components/VoiceChat';
import { TeamChat } from '../../../components/TeamChat';
import { ShowdownModal } from '../../../components/ShowdownModal';
import { VerdictView } from '../../../components/VerdictView';
import {
  Clock,
  Shield,
  CheckCircle2,
  Users,
  AlertTriangle,
  Sparkles,
  Send
} from 'lucide-react';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params?.id as string;
  const socket = getSocket();

  const [match, setMatch] = useState<MatchState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [namingInput, setNamingInput] = useState<string>('');
  const [hasSubmittedWord, setHasSubmittedWord] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  const [namingTimeRemaining, setNamingTimeRemaining] = useState<number>(20);

  useEffect(() => {
    const pid = sessionStorage.getItem('coloco_player_id') || '';
    setPlayerId(pid);

    const handleMatchState = (m: MatchState) => {
      setMatch(m);
      setTimeRemaining(m.timeRemainingSeconds);
      setNamingTimeRemaining(m.namingTimeRemainingSeconds);
    };

    const handleTick = ({
      phase,
      timeRemainingSeconds,
      namingTimeRemainingSeconds,
      revealTimeRemainingSeconds
    }: any) => {
      setTimeRemaining(timeRemainingSeconds);
      setNamingTimeRemaining(namingTimeRemainingSeconds);
      setMatch((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          phase,
          timeRemainingSeconds,
          namingTimeRemainingSeconds,
          revealTimeRemainingSeconds
        };
      });
    };

    const handleStroke = (stroke: DrawStroke) => {
      setMatch((prev) => {
        if (!prev) return null;
        const team = prev.teams[stroke.teamId];
        if (!team) return prev;
        return {
          ...prev,
          teams: {
            ...prev.teams,
            [stroke.teamId]: {
              ...team,
              strokes: [...team.strokes, stroke]
            }
          }
        };
      });
    };

    const handlePlayerDone = ({ playerId: donePid, teamId, isTeamAllDone }: any) => {
      setMatch((prev) => {
        if (!prev) return null;
        const player = prev.players[donePid];
        const team = prev.teams[teamId];
        if (!player || !team) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            [donePid]: { ...player, isDone: true }
          },
          teams: {
            ...prev.teams,
            [teamId]: { ...team, isAllDone: isTeamAllDone }
          }
        };
      });
    };

    const handleVerdict = ({ results }: { results: TeamScoreResult[] }) => {
      setMatch((prev) => {
        if (!prev) return null;
        return { ...prev, phase: 'verdict', results };
      });
    };

    socket.on('match:state', handleMatchState);
    socket.on('match:tick', handleTick);
    socket.on('canvas:stroke', handleStroke);
    socket.on('player:done_status', handlePlayerDone);
    socket.on('match:verdict', handleVerdict);

    return () => {
      socket.off('match:state', handleMatchState);
      socket.off('match:tick', handleTick);
      socket.off('canvas:stroke', handleStroke);
      socket.off('player:done_status', handlePlayerDone);
      socket.off('match:verdict', handleVerdict);
    };
  }, [socket]);

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Connecting to match...</span>
      </div>
    );
  }

  const myPlayer = match.players[playerId];
  const myTeam = myPlayer?.teamId ? match.teams[myPlayer.teamId] : null;
  const isMyLocked = myPlayer?.isDone || match.phase === 'revealing' || match.phase === 'verdict';

  const handleDrawStroke = (stroke: Omit<DrawStroke, 'id' | 'sequence'>) => {
    if (!myPlayer?.teamId) return;
    socket.emit('canvas:draw_stroke', {
      ...stroke,
      id: `strk-${Math.random().toString(36).substring(2, 9)}`,
      playerId,
      teamId: myPlayer.teamId,
      sequence: 0
    });
  };

  const handlePlayerDone = () => {
    socket.emit('player:done');
  };

  const handleNamingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namingInput.trim()) return;
    socket.emit('naming:submit_word', { word: namingInput.trim() });
    setHasSubmittedWord(true);
  };

  const handleRematch = () => {
    router.push('/');
  };

  // Format timer seconds into mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // VIEW: 1. Naming Phase (10-30s preparation, voice off, collaborative naming)
  // =========================================================================
  if (match.phase === 'naming') {
    return (
      <div className="flex flex-col items-center justify-center max-w-xl w-full p-8 bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-3xl shadow-2xl text-center select-none animate-fadeIn">
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-sky-50 dark:bg-navy-800 border border-sky-200 dark:border-navy-700 text-sky-600 dark:text-sky-300 text-xs font-bold uppercase mb-4">
          <Clock className="w-3.5 h-3.5" />
          Preparation Period • {namingTimeRemaining}s
        </div>

        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Name Your Team!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          Collaborate on a name up to 20 characters. Each teammate submits a word or syllable! (Voice is paused during naming).
        </p>

        {myTeam && (
          <div className="w-full bg-slate-50 dark:bg-navy-800 p-4 rounded-2xl border border-slate-100 dark:border-navy-700 mb-6 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Team Roster
            </span>
            <div className="flex flex-wrap gap-2">
              {myTeam.playerIds.map((pid) => (
                <span
                  key={pid}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200"
                >
                  {match.players[pid]?.username || 'Teammate'}
                  {pid === playerId && ' (You)'}
                </span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleNamingSubmit} className="w-full flex gap-3">
          <input
            type="text"
            value={namingInput}
            onChange={(e) => setNamingInput(e.target.value)}
            placeholder="Your word contribution..."
            maxLength={10}
            disabled={hasSubmittedWord}
            className="flex-1 px-4 py-3 rounded-2xl border border-sky-200 dark:border-navy-700 bg-sky-50/50 dark:bg-navy-800 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={hasSubmittedWord || !namingInput.trim()}
            className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-sm shadow-md flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            {hasSubmittedWord ? 'Saved' : 'Submit'}
          </button>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 2. Verdict Phase (AI Judging, Awards & Scoring)
  // =========================================================================
  if (match.phase === 'verdict') {
    return <VerdictView match={match} onRematch={handleRematch} />;
  }

  // =========================================================================
  // VIEW: 3. Active Playing / Revealing Phase
  // =========================================================================
  return (
    <div className="flex flex-col items-center w-full max-w-7xl px-2 py-4 gap-4">
      {/* Showdown Reveal Modal (When match timer hit 0 or all teams finished) */}
      {match.phase === 'revealing' && <ShowdownModal match={match} />}

      {/* Top Match Bar: Timer, Team & Voice status */}
      <div className="w-full bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-3xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        {/* Team Indicator */}
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full ring-4 ring-offset-2 ring-sky-300 dark:ring-navy-700"
            style={{ backgroundColor: myTeam?.color || '#38bdf8' }}
          />
          <div>
            <h2 className="font-black text-lg text-slate-800 dark:text-white">
              {myTeam?.name || 'Your Team'}
            </h2>
            <span className="text-[11px] text-slate-400 font-semibold">
              Territory Zone #{((myPlayer?.territoryIndex ?? 0) + 1)}
            </span>
          </div>
        </div>

        {/* Server Authoritative Timer */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-sky-50 dark:bg-navy-800 border border-sky-200 dark:border-navy-700 shadow-inner">
          <Clock className={`w-5 h-5 ${timeRemaining < 30 ? 'text-rose-500 animate-pulse' : 'text-sky-600 dark:text-sky-400'}`} />
          <span className={`font-mono text-2xl font-black ${timeRemaining < 30 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
            {formatTimer(timeRemaining)}
          </span>
        </div>

        {/* Right Tools: Voice & Done Button */}
        <div className="flex items-center gap-3">
          {myTeam && (
            <VoiceChat
              socket={socket}
              teamId={myTeam.id}
              teammateIds={myTeam.playerIds.filter(pid => pid !== playerId)}
              isVoiceActive={match.phase === 'playing'}
            />
          )}

          <button
            onClick={handlePlayerDone}
            disabled={myPlayer?.isDone || match.phase !== 'playing'}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md ${
              myPlayer?.isDone
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {myPlayer?.isDone ? 'Territory Done' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Main Gameplay Layout: Canvas Center, Team Chat Right */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full">
        {/* Canvas Component */}
        <div className="flex-1 flex flex-col items-center w-full">
          {myTeam && (
            <Canvas
              strokes={myTeam.strokes}
              onDrawStroke={handleDrawStroke}
              myTerritoryIndex={myPlayer?.territoryIndex}
              territories={match.territories}
              isLocked={isMyLocked}
              challenge={match.challenge}
              teamColor={myTeam.color}
            />
          )}
        </div>

        {/* Sidebar: Teammate Status & Private Chat */}
        <div className="flex flex-col gap-4 w-full lg:w-80 flex-shrink-0">
          {/* Teammates Status Card */}
          <div className="bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Teammate Status
            </span>
            <div className="space-y-2 mt-2">
              {myTeam?.playerIds.map((pid) => {
                const p = match.players[pid];
                const isMe = pid === playerId;
                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-navy-800 text-xs"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {p?.username || 'Teammate'} {isMe && '(You)'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p?.isDone
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {p?.isDone ? 'Locked / Done' : 'Drawing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Private Team Chat */}
          {myTeam && (
            <TeamChat
              socket={socket}
              myPlayerId={playerId}
              teamName={myTeam.name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
