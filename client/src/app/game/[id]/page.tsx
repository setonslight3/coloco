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
import { ReportModal } from '../../../components/ReportModal';
import {
  Clock,
  CheckCircle2,
  Users,
  Send,
  AlertCircle,
  Radio,
  Flag,
  Home,
  LogOut,
  Mic,
  MicOff,
  Volume2,
  VolumeX
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
  const [reportingTarget, setReportingTarget] = useState<{ id: string; name: string } | null>(null);
  const [peerVoiceStates, setPeerVoiceStates] = useState<{ [playerId: string]: { isMuted?: boolean; isDeafened?: boolean } }>({});
  const [myVoiceState, setMyVoiceState] = useState<{ isMuted: boolean; isDeafened: boolean; isConnected: boolean }>({
    isMuted: false,
    isDeafened: false,
    isConnected: false
  });
  const [externalMuteToggleCount, setExternalMuteToggleCount] = useState(0);
  const [externalDeafenToggleCount, setExternalDeafenToggleCount] = useState(0);

  useEffect(() => {
    let pid = sessionStorage.getItem('coloco_player_id') || '';
    if (!pid || (typeof window !== 'undefined' && !window.name)) {
      pid = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('coloco_player_id', pid);
      if (typeof window !== 'undefined') {
        window.name = pid;
      }
    } else if (typeof window !== 'undefined') {
      window.name = pid;
    }
    const uname = sessionStorage.getItem('coloco_username') || `Painter_${pid.substring(4, 8)}`;
    setPlayerId(pid);

    if (matchId && pid) {
      socket.emit('game:join', { matchId, playerId: pid, username: uname });
    }

    const onConnect = () => {
      if (matchId && pid) {
        socket.emit('game:join', { matchId, playerId: pid, username: uname });
      }
    };
    socket.on('connect', onConnect);

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

    const handleTerritoryCleared = ({ teamId, strokes }: any) => {
      setMatch((prev) => {
        if (!prev) return null;
        const team = prev.teams[teamId];
        if (!team) return prev;
        return {
          ...prev,
          teams: {
            ...prev.teams,
            [teamId]: {
              ...team,
              strokes: strokes || []
            }
          }
        };
      });
    };

    const handleVoiceStateChange = ({ playerId: vPid, isMuted: vMuted, isDeafened: vDeafened }: any) => {
      setPeerVoiceStates((prev) => ({
        ...prev,
        [vPid]: { isMuted: vMuted, isDeafened: vDeafened }
      }));
    };

    const handleStrokeUndone = ({ teamId, strokes }: any) => {
      setMatch((prev) => {
        if (!prev) return null;
        const team = prev.teams[teamId];
        if (!team) return prev;
        return {
          ...prev,
          teams: {
            ...prev.teams,
            [teamId]: {
              ...team,
              strokes: strokes || []
            }
          }
        };
      });
    };

    socket.on('match:state', handleMatchState);
    socket.on('match:tick', handleTick);
    socket.on('canvas:stroke', handleStroke);
    socket.on('canvas:territory_cleared', handleTerritoryCleared);
    socket.on('canvas:stroke_undone', handleStrokeUndone);
    socket.on('player:done_status', handlePlayerDone);
    socket.on('match:verdict', handleVerdict);
    socket.on('voice:state_change', handleVoiceStateChange);

    return () => {
      socket.off('connect', onConnect);
      socket.off('match:state', handleMatchState);
      socket.off('match:tick', handleTick);
      socket.off('canvas:stroke', handleStroke);
      socket.off('canvas:territory_cleared', handleTerritoryCleared);
      socket.off('canvas:stroke_undone', handleStrokeUndone);
      socket.off('player:done_status', handlePlayerDone);
      socket.off('match:verdict', handleVerdict);
      socket.off('voice:state_change', handleVoiceStateChange);
    };
  }, [socket, matchId]);

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Connecting to live match arena...</span>
      </div>
    );
  }

  let myPlayer = match.players[playerId];

  let myTeam = myPlayer?.teamId ? match.teams[myPlayer.teamId] : null;
  if (!myTeam) {
    for (const t of Object.values(match.teams)) {
      if (myPlayer && t.playerIds.includes(myPlayer.id)) {
        myTeam = t;
        break;
      }
    }
    if (!myTeam) {
      myTeam = Object.values(match.teams)[0] || null;
    }
  }

  // If myPlayer wasn't resolved by exact id, match appropriately within myTeam:
  if (!myPlayer && myTeam) {
    const matchedPid = myTeam.playerIds.find((p) => p === playerId);
    if (matchedPid && match.players[matchedPid]) {
      myPlayer = match.players[matchedPid];
    } else {
      const allPlayers = Object.values(match.players);
      myPlayer = allPlayers.find((p) => p.id === playerId) || allPlayers[0];
    }
  }

  // Calculate my explicit, non-overlapping territory index:
  let effectiveTerritoryIndex = myPlayer?.territoryIndex;
  if (effectiveTerritoryIndex === undefined && myTeam) {
    const idx = myTeam.playerIds.indexOf(playerId);
    effectiveTerritoryIndex = idx >= 0 ? idx : 0;
  }
  if (effectiveTerritoryIndex === undefined) {
    effectiveTerritoryIndex = 0;
  }

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

  const handleClearTerritory = () => {
    if (!myPlayer?.teamId) return;
    socket.emit('canvas:clear_territory', {
      matchId,
      playerId,
      teamId: myPlayer.teamId
    });
  };

  const handleUndo = () => {
    if (!myPlayer?.teamId) return;
    socket.emit('canvas:undo', {
      matchId,
      playerId,
      teamId: myPlayer.teamId
    });
  };

  const handleRedo = (stroke: DrawStroke) => {
    if (!myPlayer?.teamId) return;
    socket.emit('canvas:redo', {
      stroke,
      matchId,
      playerId,
      teamId: myPlayer.teamId
    });
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

  const handleLeaveToMainMenu = () => {
    socket.emit('lobby:leave');
    router.push('/');
  };

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
      <div className="flex flex-col items-center justify-center max-w-xl w-full p-6 sm:p-8 bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl shadow-2xl text-center select-none animate-fadeIn my-auto">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 dark:bg-navy-800 border border-sky-200 dark:border-navy-700 text-sky-600 dark:text-sky-300 text-xs font-black uppercase mb-4 shadow-xs">
          <Clock className="w-3.5 h-3.5" />
          Preparation Countdown • {namingTimeRemaining}s
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Collaborative Team Naming
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
          Submit your word or prefix to synthesize your 20-character team title. (Teammate voice activates immediately upon match start).
        </p>

        {myTeam && (
          <div className="w-full bg-slate-50 dark:bg-navy-800/70 p-4 rounded-2xl border border-slate-200/80 dark:border-navy-700 mb-6 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Assigned Teammates
            </span>
            <div className="flex flex-wrap gap-2">
              {myTeam.playerIds.map((pid) => (
                <span
                  key={pid}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-700 dark:text-slate-200 shadow-2xs"
                >
                  {match.players[pid]?.username || 'Teammate'}
                  {pid === playerId && ' (You)'}
                </span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleNamingSubmit} className="w-full flex gap-2 sm:gap-3">
          <input
            type="text"
            value={namingInput}
            onChange={(e) => setNamingInput(e.target.value.substring(0, 10))}
            placeholder="Your word contribution..."
            maxLength={10}
            disabled={hasSubmittedWord}
            className="flex-1 px-4 py-3 rounded-2xl border border-sky-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={hasSubmittedWord || !namingInput.trim()}
            className="px-5 sm:px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
            {hasSubmittedWord ? 'Locked' : 'Submit'}
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
    <div className="flex flex-col items-center w-full max-w-7xl px-2 sm:px-4 py-2 sm:py-4 gap-4 min-w-0">
      {/* Showdown Reveal Modal (When match timer hit 0 or all teams finished) */}
      {match.phase === 'revealing' && <ShowdownModal match={match} />}

      {/* Top Match Bar: Timer, Team & Voice status */}
      <div className="w-full bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Team Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-4 h-4 rounded-full ring-4 ring-offset-2 ring-sky-300 dark:ring-navy-700 flex-shrink-0"
            style={{ backgroundColor: myTeam?.color || '#38bdf8' }}
          />
          <div className="min-w-0">
            <h2 className="font-black text-sm sm:text-base text-slate-800 dark:text-white truncate max-w-[140px] sm:max-w-xs">
              {myTeam?.name || 'Your Team'}
            </h2>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Zone #{(effectiveTerritoryIndex + 1)}
            </span>
          </div>
        </div>

        {/* Server Authoritative Timer */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-sky-200/60 dark:border-navy-700 shadow-inner">
          <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${timeRemaining < 30 ? 'text-rose-500 animate-pulse' : 'text-sky-600 dark:text-sky-400'}`} />
          <span className={`font-mono text-xl sm:text-2xl font-black ${timeRemaining < 30 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
            {formatTimer(timeRemaining)}
          </span>
        </div>

        {/* Right Tools: Voice & Done Button */}
        <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
          {myTeam && (
            <VoiceChat
              socket={socket}
              matchId={matchId}
              teamId={myTeam.id}
              myPlayerId={myPlayer?.id || playerId}
              teammateIds={myTeam.playerIds.filter(pid => pid !== (myPlayer?.id || playerId))}
              isVoiceActive={match.phase === 'playing'}
              onVoiceStateChange={setMyVoiceState}
              peerVoiceStates={peerVoiceStates}
              externalMuteToggle={externalMuteToggleCount}
              externalDeafenToggle={externalDeafenToggleCount}
            />
          )}

          <button
            onClick={handlePlayerDone}
            disabled={myPlayer?.isDone || match.phase !== 'playing'}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md flex-shrink-0 ${
              myPlayer?.isDone
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white active:scale-95'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{myPlayer?.isDone ? 'Territory Done' : 'Mark Done'}</span>
          </button>

          <button
            onClick={handleLeaveToMainMenu}
            className="p-2 sm:px-3 sm:py-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:border-rose-300 transition-colors flex items-center gap-1.5 font-bold text-xs"
            title="Leave Match & Return to Home"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Main Gameplay Layout: Canvas Center, Team Chat Right */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 w-full min-w-0">
        {/* Canvas Column */}
        <div className="flex-1 flex flex-col items-center w-full min-w-0">
          {myTeam && (
            <Canvas
              strokes={myTeam.strokes}
              onDrawStroke={handleDrawStroke}
              onClearTerritory={handleClearTerritory}
              onUndo={handleUndo}
              onRedo={handleRedo}
              myTerritoryIndex={effectiveTerritoryIndex}
              territories={match.territories}
              isLocked={isMyLocked}
              challenge={match.challenge}
              teamColor={myTeam.color}
            />
          )}
        </div>

        {/* Sidebar: Teammate Status & Private Chat */}
        <div className="flex flex-col gap-4 w-full lg:w-80 flex-shrink-0 min-w-0">
          {/* Teammates Status Card */}
          <div className="bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Teammates Status
            </span>
            <div className="space-y-2">
              {(myTeam?.playerIds && myTeam.playerIds.length > 0 ? myTeam.playerIds : Object.keys(match.players)).map((pid) => {
                const p = match.players[pid];
                const isMe = pid === playerId || (myPlayer && pid === myPlayer.id);
                const pVoice = isMe ? myVoiceState : peerVoiceStates[pid];
                const isMuted = Boolean(pVoice?.isMuted);
                const isDeafened = Boolean(pVoice?.isDeafened);

                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800 text-xs gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px] sm:max-w-[120px]">
                        {p?.username || 'Teammate'} {isMe && '(You)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Only player can mute/deafen themselves; teammate shows live mic status indicator */}
                      {isMe ? (
                        <div className="flex items-center gap-1 bg-white dark:bg-navy-700 px-1.5 py-0.5 rounded-xl border border-slate-200 dark:border-navy-600 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setExternalMuteToggleCount((c) => c + 1)}
                            className={`p-1 rounded-lg transition-colors ${
                              isMuted
                                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title={isMuted ? 'Unmute My Mic' : 'Mute My Mic'}
                          >
                            {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setExternalDeafenToggleCount((c) => c + 1)}
                            className={`p-1 rounded-lg transition-colors ${
                              isDeafened
                                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                            title={isDeafened ? 'Undeafen Audio' : 'Deafen Audio'}
                          >
                            {isDeafened ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {isMuted ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/40">
                              <MicOff className="w-2.5 h-2.5" /> Muted
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                              <Mic className="w-2.5 h-2.5 animate-pulse text-emerald-500" /> Active
                            </span>
                          )}
                        </div>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p?.isDone
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p?.isDone ? 'Done' : 'Drawing'}
                      </span>

                      {!isMe && p && (
                        <button
                          type="button"
                          onClick={() => setReportingTarget({ id: p.id, name: p.username })}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          title="Report Player"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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

      {/* Moderation & Report Modal */}
      {reportingTarget && (
        <ReportModal
          isOpen={!!reportingTarget}
          targetPlayerId={reportingTarget.id}
          targetUsername={reportingTarget.name}
          onClose={() => setReportingTarget(null)}
        />
      )}
    </div>
  );
}
