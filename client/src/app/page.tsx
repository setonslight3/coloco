'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { MatchState, GameMode } from '../types/index';
import {
  Palette,
  Brush,
  Sparkles,
  Users,
  Copy,
  Check,
  Play,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export default function Home() {
  const router = useRouter();
  const socket = getSocket();

  const [username, setUsername] = useState('Painter_' + Math.floor(100 + Math.random() * 900));
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('coloring');
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Player ID stored in sessionStorage for reconnects
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    let pid = sessionStorage.getItem('coloco_player_id');
    if (!pid) {
      pid = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('coloco_player_id', pid);
    }
    setPlayerId(pid);

    const handleMatchState = (match: MatchState) => {
      setActiveMatch(match);
      if (match.phase !== 'lobby') {
        router.push(`/game/${match.id}`);
      }
    };

    const handleError = ({ message }: { message: string }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(null), 4000);
    };

    socket.on('match:state', handleMatchState);
    socket.on('error:message', handleError);

    return () => {
      socket.off('match:state', handleMatchState);
      socket.off('error:message', handleError);
    };
  }, [router, socket]);

  const handleCreateLobby = () => {
    if (!username.trim() || !playerId) return;
    socket.emit('lobby:create', { playerId, username: username.trim(), mode: selectedMode });
  };

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyCodeInput.trim() || !playerId) return;
    socket.emit('lobby:join', {
      playerId,
      username: username.trim(),
      lobbyCode: lobbyCodeInput.trim().toUpperCase()
    });
  };

  const handleToggleReady = () => {
    if (!activeMatch) return;
    const me = activeMatch.players[playerId];
    if (me) {
      socket.emit('lobby:ready', { isReady: !me.isReady });
    }
  };

  const handleStartMatch = () => {
    if (!activeMatch) return;
    socket.emit('lobby:start');
  };

  const handleChangeMode = (mode: GameMode) => {
    if (!activeMatch) return;
    socket.emit('lobby:change_mode', { mode });
  };

  const handleCopyCode = () => {
    if (!activeMatch) return;
    navigator.clipboard.writeText(activeMatch.lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl px-4 py-8">
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-sm font-semibold shadow-md animate-fadeIn">
          {errorMessage}
        </div>
      )}

      {!activeMatch ? (
        /* ================= Welcome & Join View ================= */
        <div className="flex flex-col items-center w-full max-w-xl text-center">
          <div className="mb-6">
            <BrandLogo size={64} className="mb-3 justify-center" />
            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto">
              Collaborative canvas battle. Form equal teams, claim your territory, and win over the AI Judge!
            </p>
          </div>

          {/* User Display Name Input */}
          <div className="w-full bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-3xl p-6 shadow-xl mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 text-left">
              Your Artist Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl border border-sky-200 dark:border-navy-700 bg-sky-50/50 dark:bg-navy-800 text-slate-800 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-sky-500 mb-6"
            />

            {/* Mode Selection */}
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 text-left">
              Select Game Mode
            </label>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'coloring', label: 'Coloring', icon: Palette, desc: 'Color shared line art' },
                { id: 'drawing', label: 'Drawing', icon: Brush, desc: 'Guide reference image' },
                { id: 'freestyle', label: 'Freestyle', icon: Sparkles, desc: 'Open creative theme' }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id as GameMode)}
                    className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500 shadow-sm'
                        : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1.5" />
                    <span className="text-xs font-bold">{m.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{m.desc}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCreateLobby}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-coloco-blue to-coloco-lightBlue hover:opacity-95 text-white font-black text-lg shadow-xl shadow-sky-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Create Competition Lobby
            </button>
          </div>

          {/* Join with Code Box */}
          <form
            onSubmit={handleJoinLobby}
            className="w-full bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-3xl p-5 shadow-lg flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="ENTER 4-LETTER CODE"
              value={lobbyCodeInput}
              onChange={(e) => setLobbyCodeInput(e.target.value.toUpperCase())}
              maxLength={4}
              className="flex-1 px-4 py-3 rounded-2xl border border-sky-200 dark:border-navy-700 bg-sky-50/50 dark:bg-navy-800 text-slate-800 dark:text-white font-mono font-black text-center tracking-widest text-lg uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-slate-800 dark:bg-navy-700 hover:bg-slate-900 text-white font-bold text-sm shadow-md flex items-center gap-1.5"
            >
              Join <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* ================= Inside Lobby View ================= */
        <div className="flex flex-col items-center w-full max-w-2xl bg-white dark:bg-navy-900 border border-sky-200 dark:border-navy-700 rounded-3xl p-8 shadow-2xl">
          {/* Lobby Code Display */}
          <div className="flex flex-col items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Invite Code
            </span>
            <div className="flex items-center gap-3 bg-sky-50 dark:bg-navy-800 px-6 py-3 rounded-2xl border border-sky-200 dark:border-navy-700">
              <span className="font-mono text-3xl font-black tracking-widest text-coloco-blue dark:text-sky-400">
                {activeMatch.lobbyCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-sky-200 dark:border-navy-600 hover:bg-sky-100 transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Mode Badge & Challenge Info */}
          <div className="w-full bg-slate-50 dark:bg-navy-800/60 border border-slate-100 dark:border-navy-700 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Selected Challenge
              </span>
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {activeMatch.challenge.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeMatch.challenge.description}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-500 text-white">
              {activeMatch.mode}
            </span>
          </div>

          {/* Player Roster */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Players ({Object.keys(activeMatch.players).length}/{activeMatch.maxPlayers})
              </span>
              <span className="text-[11px] text-slate-400 italic">
                Teams randomly balanced at match start
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.values(activeMatch.players).map((p) => {
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                      isMe
                        ? 'border-sky-400 bg-sky-50/70 dark:bg-navy-800'
                        : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {p.username} {isMe && '(You)'}
                        </span>
                        {p.isHost && (
                          <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">
                            Host
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.isReady
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-navy-700 dark:text-slate-400'
                      }`}
                    >
                      {p.isReady ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anti-Stacking Security Notice */}
          <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-navy-800 border border-sky-100 dark:border-navy-700 text-xs text-sky-800 dark:text-sky-300 mb-6">
            <ShieldCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <span>
              <strong>Fair Play Guarantee:</strong> Host cannot stack teams. All players are assigned to 2 balanced teams randomly when match launches.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-3">
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm border transition-all ${
                activeMatch.players[playerId]?.isReady
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-200'
              }`}
            >
              {activeMatch.players[playerId]?.isReady ? 'Ready!' : 'Toggle Ready'}
            </button>

            {activeMatch.players[playerId]?.isHost && (
              <button
                onClick={handleStartMatch}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-coloco-blue to-coloco-lightBlue hover:opacity-95 text-white font-black text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Match
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
