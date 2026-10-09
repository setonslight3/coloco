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
  Dices,
  Crown,
  Clock,
  Settings,
  LogOut,
  Heart
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { LobbySettingsModal } from '../components/LobbySettingsModal';

const PAINTER_NAMES = [
  'Picasso', 'DaVinci', 'Monet', 'VanGogh', 'Rembrandt',
  'Michelangelo', 'Kandinsky', 'Warhol', 'Dali', 'Kahlo',
  'Matisse', 'Vermeer', 'Cezanne', 'O_Keeffe', 'Pollock'
];

export default function Home() {
  const router = useRouter();
  const socket = getSocket();

  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('coloring');
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize player identity
  useEffect(() => {
    let pid = sessionStorage.getItem('coloco_player_id');
    if (!pid) {
      pid = 'usr_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('coloco_player_id', pid);
    }
    setPlayerId(pid);

    let savedName = sessionStorage.getItem('coloco_username');
    if (!savedName) {
      const randomBase = PAINTER_NAMES[Math.floor(Math.random() * PAINTER_NAMES.length)];
      savedName = `${randomBase}_${Math.floor(10 + Math.random() * 90)}`;
      sessionStorage.setItem('coloco_username', savedName);
    }
    setUsername(savedName);

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

    const handleMatchLeft = () => {
      setActiveMatch(null);
    };

    socket.on('match:state', handleMatchState);
    socket.on('match:left', handleMatchLeft);
    socket.on('error:message', handleError);

    return () => {
      socket.off('match:state', handleMatchState);
      socket.off('match:left', handleMatchLeft);
      socket.off('error:message', handleError);
    };
  }, [router, socket]);

  const handleLeaveLobby = () => {
    socket.emit('lobby:leave');
    setActiveMatch(null);
  };

  const handleRandomizeName = () => {
    const randomBase = PAINTER_NAMES[Math.floor(Math.random() * PAINTER_NAMES.length)];
    const newName = `${randomBase}_${Math.floor(10 + Math.random() * 90)}`;
    setUsername(newName);
    sessionStorage.setItem('coloco_username', newName);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 16);
    setUsername(val);
    sessionStorage.setItem('coloco_username', val);
  };

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

  const handleCopyCode = () => {
    if (!activeMatch) return;
    navigator.clipboard.writeText(activeMatch.lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (settings: {
    mode: GameMode;
    challengeId: string;
    durationSeconds: number;
    namingDurationSeconds: number;
    maxPlayers: number;
  }) => {
    socket.emit('lobby:update_settings', settings);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl px-2 sm:px-4 py-4 sm:py-8">
      {/* Error Toast */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold shadow-md animate-fadeIn flex items-center gap-2">
          <span>{errorMessage}</span>
        </div>
      )}

      {!activeMatch ? (
        /* ================= WELCOME & MATCH CREATION / JOIN VIEW ================= */
        <div className="flex flex-col items-center w-full max-w-xl text-center">
          {/* Hero Branding */}
          <div className="mb-8 flex flex-col items-center">
            <BrandLogo size={68} className="mb-3 justify-center" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Cooperative Art. Competitive Arena.
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-md mx-auto mt-1.5 leading-relaxed">
              Form equal-sized teams, collaborate across private wavy territories, and let Google Gemini crown the champion team!
            </p>
          </div>

          {/* Main Interactive Card */}
          <div className="w-full bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl p-5 sm:p-7 shadow-xl">
            {/* Artist Nickname Field */}
            <div className="mb-6 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Your Artist Tag
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={handleNameChange}
                  placeholder="Artist Name"
                  maxLength={16}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-sky-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white font-bold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={handleRandomizeName}
                  className="p-2.5 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Randomize Artist Name"
                >
                  <Dices className="w-5 h-5 text-sky-500" />
                </button>
              </div>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-navy-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  activeTab === 'create'
                    ? 'bg-white dark:bg-navy-900 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Create Lobby
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                  activeTab === 'join'
                    ? 'bg-white dark:bg-navy-900 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                Join with Code
              </button>
            </div>

            {/* Tab 1: Create Match */}
            {activeTab === 'create' ? (
              <div className="space-y-6 text-left animate-fadeIn">
                {/* Game Mode Cards */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    Select Competition Mode
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'coloring',
                        label: 'Coloring',
                        icon: Palette,
                        desc: 'Color shared line art template.'
                      },
                      {
                        id: 'drawing',
                        label: 'Drawing',
                        icon: Brush,
                        desc: 'Guided reference image window.'
                      },
                      {
                        id: 'freestyle',
                        label: 'Freestyle',
                        icon: Sparkles,
                        desc: 'Open creative interpretation prompt.'
                      },
                      {
                        id: 'cooperative',
                        label: 'Co-op (Friendly)',
                        icon: Heart,
                        desc: 'Paint together on 1 canvas with voice & chat.'
                      }
                    ].map((m) => {
                      const Icon = m.icon;
                      const isSelected = selectedMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMode(m.id as GameMode)}
                          className={`flex flex-col p-3 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/50 shadow-xs'
                              : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-sky-500' : 'text-slate-400'}`} />
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-slate-100 dark:bg-navy-700 text-slate-500'
                              }`}
                            >
                              {m.id}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {m.label}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {m.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateLobby}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 hover:opacity-95 text-white font-black text-base shadow-lg shadow-sky-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Launch Competition Lobby
                </button>
              </div>
            ) : (
              /* Tab 2: Join Match */
              <form onSubmit={handleJoinLobby} className="space-y-4 animate-fadeIn">
                <div className="text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    4-Letter Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="ABCD"
                    value={lobbyCodeInput}
                    onChange={(e) => setLobbyCodeInput(e.target.value.toUpperCase())}
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-2xl border border-sky-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white font-mono font-black text-center tracking-[0.3em] text-2xl uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={lobbyCodeInput.length < 3}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-navy-700 hover:bg-slate-800 text-white font-black text-base shadow-lg disabled:opacity-50 transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  Enter Room <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* ================= IN-LOBBY ROSTER & READY VIEW ================= */
        <div className="flex flex-col items-center w-full max-w-2xl bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl p-5 sm:p-8 shadow-2xl animate-fadeIn">
          {/* Header & Code Banner */}
          <div className="flex flex-col items-center mb-6 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Invite Code • Share with Friends
            </span>
            <div className="flex items-center gap-3 bg-sky-50 dark:bg-navy-800 px-6 py-2.5 rounded-2xl border border-sky-200 dark:border-navy-700 shadow-inner">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-sky-600 dark:text-sky-400">
                {activeMatch.lobbyCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white dark:bg-navy-700 border border-sky-200 dark:border-navy-600 hover:bg-sky-100 transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Selected Challenge Overview & Settings */}
          <div className="w-full bg-slate-50 dark:bg-navy-800/60 border border-slate-200/80 dark:border-navy-700 rounded-2xl p-4 mb-6">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    Selected Challenge
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500 text-white">
                    {activeMatch.mode}
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                  {activeMatch.challenge.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {activeMatch.challenge.description}
                </p>
              </div>

              {activeMatch.players[playerId]?.isHost && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-300 font-bold text-xs shadow-xs transition-all flex-shrink-0"
                  title="Configure Lobby Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Settings</span>
                </button>
              )}
            </div>

            {/* Match Rules Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-navy-700/60 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 bg-white dark:bg-navy-700/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-navy-600">
                <Clock className="w-3 h-3 text-sky-500" />
                Draw: {activeMatch.challenge.durationSeconds}s
              </span>
              <span className="flex items-center gap-1 bg-white dark:bg-navy-700/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-navy-600">
                <Clock className="w-3 h-3 text-amber-500" />
                Naming: {activeMatch.namingTimeRemainingSeconds || 20}s
              </span>
              <span className="flex items-center gap-1 bg-white dark:bg-navy-700/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-navy-600">
                <Users className="w-3 h-3 text-indigo-500" />
                Cap: {activeMatch.maxPlayers || 8} painters
              </span>
            </div>
          </div>

          {/* Connected Painters Roster */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Connected Painters ({Object.keys(activeMatch.players).length}/{activeMatch.maxPlayers})
              </span>
              <span className="text-[11px] text-slate-400 italic">
                Anti-stacking random distribution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(activeMatch.players).map((p) => {
                const isMe = p.id === playerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isMe
                        ? 'border-sky-400 bg-sky-50/70 dark:bg-navy-800/80 ring-1 ring-sky-400/40'
                        : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-xs flex-shrink-0">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                          {p.username} {isMe && '(You)'}
                        </span>
                        {p.isHost && (
                          <span className="text-[9px] text-amber-500 font-extrabold uppercase tracking-wider flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
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

          {/* Fair Play Anti-Stacking Callout */}
          <div className="w-full flex items-start gap-2.5 p-3.5 rounded-2xl bg-sky-50 dark:bg-navy-800 border border-sky-100 dark:border-navy-700 text-xs text-sky-900 dark:text-sky-200 mb-6 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Fair Play Guarantee:</strong> Host cannot stack teams manually. Upon match start, players are randomly assigned into 2 balanced teams and given equal territory space.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleLeaveLobby}
              className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Lobby</span>
            </button>

            <button
              type="button"
              onClick={handleToggleReady}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm border transition-all ${
                activeMatch.players[playerId]?.isReady
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:bg-slate-200'
              }`}
            >
              {activeMatch.players[playerId]?.isReady ? 'Ready to Color!' : 'Toggle Ready'}
            </button>

            {activeMatch.players[playerId]?.isHost && (
              <button
                type="button"
                onClick={handleStartMatch}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Match
              </button>
            )}
          </div>

          {/* Lobby Settings Modal for Host */}
          {isSettingsOpen && activeMatch.players[playerId]?.isHost && (
            <LobbySettingsModal
              match={activeMatch}
              onSave={handleSaveSettings}
              onClose={() => setIsSettingsOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
