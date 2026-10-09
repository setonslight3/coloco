'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';
import { MatchState, GameMode, PublicLobbySummary } from '../types/index';
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
  Heart,
  Swords,
  Globe,
  Lock,
  RefreshCw,
  Search
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
  const [activeTab, setActiveTab] = useState<'create' | 'browse' | 'join'>('create');
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [mainCategory, setMainCategory] = useState<'cooperative' | 'competitive'>('cooperative');
  const [subArtStyle, setSubArtStyle] = useState<'coloring' | 'drawing' | 'freestyle'>('coloring');
  const [isLobbyPublic, setIsLobbyPublic] = useState(true);
  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [publicLobbies, setPublicLobbies] = useState<PublicLobbySummary[]>([]);
  const [isFetchingLobbies, setIsFetchingLobbies] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const effectiveMode: GameMode = mainCategory === 'cooperative' ? 'cooperative' : subArtStyle;

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

    const handleLobbyList = (lobbies: PublicLobbySummary[]) => {
      setPublicLobbies(lobbies || []);
      setIsFetchingLobbies(false);
    };

    socket.on('match:state', handleMatchState);
    socket.on('match:left', handleMatchLeft);
    socket.on('error:message', handleError);
    socket.on('lobby:list', handleLobbyList);
    socket.on('lobby:list_updated', handleLobbyList);

    // Initial public lobby fetch
    socket.emit('lobby:get_public');

    return () => {
      socket.off('match:state', handleMatchState);
      socket.off('match:left', handleMatchLeft);
      socket.off('error:message', handleError);
      socket.off('lobby:list', handleLobbyList);
      socket.off('lobby:list_updated', handleLobbyList);
    };
  }, [router, socket]);

  const handleRefreshLobbies = () => {
    setIsFetchingLobbies(true);
    socket.emit('lobby:get_public');
    setTimeout(() => setIsFetchingLobbies(false), 800);
  };

  const handleLeaveLobby = () => {
    if (activeMatch && playerId) {
      socket.emit('lobby:leave', {
        matchId: activeMatch.id,
        playerId
      });
    } else {
      socket.emit('lobby:leave');
    }
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

    let targetChallengeId: string;
    if (mainCategory === 'cooperative') {
      if (subArtStyle === 'coloring') targetChallengeId = 'ch-coop-harmony';
      else if (subArtStyle === 'drawing') targetChallengeId = 'ch-coop-underwater';
      else targetChallengeId = 'ch-coop-solarsystem';
    } else {
      if (subArtStyle === 'coloring') targetChallengeId = 'ch-coloring-owl';
      else if (subArtStyle === 'drawing') targetChallengeId = 'ch-drawing-lighthouse';
      else targetChallengeId = 'ch-freestyle-retro-future';
    }

    socket.emit('lobby:create', {
      playerId,
      username: username.trim(),
      mode: effectiveMode,
      isPublic: isLobbyPublic,
      challengeId: targetChallengeId
    });
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

  const handleJoinPublicLobby = (lobby: PublicLobbySummary) => {
    if (!username.trim() || !playerId) return;
    socket.emit('lobby:join', {
      playerId,
      username: username.trim(),
      matchId: lobby.id,
      lobbyCode: lobby.lobbyCode
    });
  };

  const handleToggleReady = () => {
    if (!activeMatch || !playerId) return;
    const me = activeMatch.players[playerId];
    const nextReadyState = me ? !me.isReady : true;
    socket.emit('lobby:ready', {
      matchId: activeMatch.id,
      playerId,
      username: username || 'Painter',
      isReady: nextReadyState
    });
  };

  const handleStartMatch = () => {
    if (!activeMatch || !playerId) return;
    socket.emit('lobby:start', {
      matchId: activeMatch.id,
      playerId
    });
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
    isPublic: boolean;
  }) => {
    if (!activeMatch || !playerId) return;
    socket.emit('lobby:update_settings', {
      ...settings,
      matchId: activeMatch.id,
      playerId
    });
  };

  const filteredPublicLobbies = publicLobbies.filter((lob) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      lob.lobbyCode.toLowerCase().includes(q) ||
      lob.hostName.toLowerCase().includes(q) ||
      lob.challengeTitle.toLowerCase().includes(q) ||
      lob.mode.toLowerCase().includes(q)
    );
  });

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

            {/* Segmented 3-Tab Switcher */}
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
                onClick={() => {
                  setActiveTab('browse');
                  handleRefreshLobbies();
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'browse'
                    ? 'bg-white dark:bg-navy-900 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <span>Browse</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                  {publicLobbies.length}
                </span>
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
                Join Code
              </button>
            </div>

            {/* Tab 1: Create Match */}
            {activeTab === 'create' && (
              <div className="space-y-5 text-left animate-fadeIn">
                {/* Mode Category: Cooperative vs Competitive */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    1. Choose Game Mode
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMainCategory('cooperative')}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        mainCategory === 'cooperative'
                          ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 ring-2 ring-pink-500/50 shadow-xs'
                          : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-pink-300'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-500 flex-shrink-0">
                        <Heart className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          Cooperative (Friendly)
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500 text-white font-black">2 Players</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          No competition. 2 friends color or draw together on 1 canvas with voice & chat!
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMainCategory('competitive')}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                        mainCategory === 'competitive'
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/50 shadow-xs'
                          : 'border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 hover:border-sky-300'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-500 flex-shrink-0">
                        <Swords className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          Competitive (Arena)
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500 text-white font-black">Teams</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          Team vs Team showdown (2v2, 3v3, 4v4). Google Gemini AI judges the winning team!
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub-Art Style Selector (Coloring, Drawing, Freestyle) */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    2. Choose Art Style
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'coloring', label: 'Coloring', icon: Palette, desc: 'Line art' },
                      { id: 'drawing', label: 'Drawing', icon: Brush, desc: 'Reference' },
                      { id: 'freestyle', label: 'Freestyle', icon: Sparkles, desc: 'Creative' }
                    ].map((s) => {
                      const Icon = s.icon;
                      const isSelected = subArtStyle === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSubArtStyle(s.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 ring-2 ring-sky-500/40 shadow-xs'
                              : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-sky-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span className="text-xs font-extrabold">{s.label}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{s.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Privacy Toggle: Public vs Private */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    3. Lobby Privacy
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLobbyPublic(true)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                        isLobbyPublic
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 shadow-xs'
                          : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Public Lobby</div>
                        <div className="text-[10px] text-slate-400">Open in lobby browser</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLobbyPublic(false)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                        !isLobbyPublic
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-xs'
                          : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="text-left">
                        <div className="text-xs font-bold">Private Lobby</div>
                        <div className="text-[10px] text-slate-400">Room code only</div>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateLobby}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500 hover:opacity-95 text-white font-black text-base shadow-lg shadow-sky-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Launch {mainCategory === 'cooperative' ? 'Cooperative' : 'Arena'} Lobby
                </button>
              </div>
            )}

            {/* Tab 2: Public Lobby Browser */}
            {activeTab === 'browse' && (
              <div className="space-y-4 text-left animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter by host, mode, or challenge..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshLobbies}
                    className="p-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    title="Refresh Lobbies"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetchingLobbies ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {filteredPublicLobbies.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-navy-700 rounded-2xl bg-slate-50/50 dark:bg-navy-800/30">
                    <Globe className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      No open public lobbies found right now.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="mt-1 px-4 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-600"
                    >
                      Host a Public Lobby
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredPublicLobbies.map((lob) => {
                      const isCoop = lob.mode === 'cooperative';
                      return (
                        <div
                          key={lob.id}
                          className="p-3 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/80 hover:border-sky-300 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isCoop
                                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                                    : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                                }`}
                              >
                                {isCoop ? 'Co-op' : 'Arena'}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-400">
                                #{lob.lobbyCode}
                              </span>
                            </div>
                            <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {lob.challengeTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Host: {lob.hostName}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 font-bold">
                                <Users className="w-3 h-3" /> {lob.playerCount}/{lob.maxPlayers}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleJoinPublicLobby(lob)}
                            disabled={lob.playerCount >= lob.maxPlayers}
                            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-xs shadow-xs transition-transform active:scale-95 flex-shrink-0"
                          >
                            {lob.playerCount >= lob.maxPlayers ? 'Full' : 'Join'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Join with 4-Letter Code */}
            {activeTab === 'join' && (
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
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    activeMatch.mode === 'cooperative'
                      ? 'bg-pink-500 text-white'
                      : 'bg-sky-500 text-white'
                  }`}>
                    {activeMatch.mode === 'cooperative' ? 'Cooperative' : activeMatch.mode}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 text-slate-600 dark:text-slate-300">
                    {activeMatch.isPublic ? (
                      <>
                        <Globe className="w-3 h-3 text-emerald-500" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-500" />
                        <span>Private</span>
                      </>
                    )}
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
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-300 font-bold text-xs shadow-xs transition-all flex-shrink-0 flex items-center gap-1.5"
                  title="Configure Lobby Settings"
                  aria-label="Configure Lobby Settings"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
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
                Cap: {activeMatch.maxPlayers || (activeMatch.mode === 'cooperative' ? 2 : 4)} painters
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
