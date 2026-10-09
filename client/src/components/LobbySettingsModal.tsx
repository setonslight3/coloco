'use client';

import React, { useState } from 'react';
import { GameMode, Challenge, MatchState } from '../types/index';
import {
  Settings,
  X,
  Palette,
  Brush,
  Sparkles,
  Clock,
  Users,
  Timer,
  Check,
  Dices,
  ShieldCheck
} from 'lucide-react';

export const CLIENT_CHALLENGES: Challenge[] = [
  // COLORING
  {
    id: 'ch-coloring-owl',
    mode: 'coloring',
    title: 'The Starlit Owl',
    description: 'Color the wise guardian of the night forest. Add celestial glow and starry plumage!',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="6">
      <path d="M 500 150 C 350 150 250 300 250 600 C 250 800 350 900 500 900 C 650 900 750 800 750 600 C 750 300 650 150 500 150 Z" />
      <circle cx="400" cy="400" r="80" stroke-width="8" />
      <circle cx="600" cy="400" r="80" stroke-width="8" />
      <circle cx="400" cy="400" r="30" fill="currentColor" />
      <circle cx="600" cy="400" r="30" fill="currentColor" />
      <polygon points="500,480 470,550 530,550" />
      <path d="M 300 650 Q 500 750 700 650" />
      <path d="M 350 700 Q 500 800 650 700" />
    </svg>`,
    durationSeconds: 120
  },
  {
    id: 'ch-coloring-mandala',
    mode: 'coloring',
    title: 'Sacred Cosmic Mandala',
    description: 'Intricate interlocking rings, lotus petals, and radiant energy rays.',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="5">
      <circle cx="500" cy="500" r="100" />
      <circle cx="500" cy="500" r="220" stroke-dasharray="15 10" />
      <circle cx="500" cy="500" r="350" />
      <polygon points="500,150 850,500 500,850 150,500" />
      <circle cx="500" cy="500" r="30" fill="currentColor" />
    </svg>`,
    durationSeconds: 120
  },
  {
    id: 'ch-coloring-turtle',
    mode: 'coloring',
    title: 'Reef Guardian Turtle',
    description: 'An ancient sea turtle gliding above glowing sea corals and bubbles.',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="6">
      <ellipse cx="500" cy="500" rx="260" ry="340" />
      <path d="M 500 160 C 500 80 440 60 440 30 C 440 10 560 10 560 30 C 560 60 500 80 500 160" />
      <path d="M 280 300 C 120 200 40 260 60 380 C 100 420 200 400 260 380" />
      <path d="M 720 300 C 880 200 960 260 940 380 C 900 420 800 400 740 380" />
    </svg>`,
    durationSeconds: 150
  },

  // DRAWING
  {
    id: 'ch-drawing-lighthouse',
    mode: 'drawing',
    title: 'Beacon in the Storm',
    description: 'Depict a cliffside lighthouse shining through raging storm waves.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },
  {
    id: 'ch-drawing-mountain',
    mode: 'drawing',
    title: 'Alpine Golden Dawn',
    description: 'Snow-capped mountain range greeting the first warm rays of sunrise.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },
  {
    id: 'ch-drawing-cyberpunk',
    mode: 'drawing',
    title: 'Neon Metropolis Skyline',
    description: 'Towering skyscraper silhouettes drenched in violet and electric cyan neon light.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 180
  },

  // FREESTYLE
  {
    id: 'ch-freestyle-retro-future',
    mode: 'freestyle',
    title: 'Retro Cyberpunk Diner',
    description: 'Blend 80s chrome and neon diner aesthetics with hovering flying cars and holograms.',
    durationSeconds: 180
  },
  {
    id: 'ch-freestyle-nebula-flora',
    mode: 'freestyle',
    title: 'Alien Moon Flora',
    description: 'Invent bioluminescent extraterrestrial trees, giant fungal spires, and glowing spores.',
    durationSeconds: 180
  },
  {
    id: 'ch-freestyle-steampunk-city',
    mode: 'freestyle',
    title: 'Aetherial Cloud Fortress',
    description: 'A floating brass citadel propelled by giant rotating cogs, propellers, and billowing steam.',
    durationSeconds: 210
  },
  // COOPERATIVE
  {
    id: 'ch-coop-harmony',
    mode: 'cooperative',
    title: 'Enchanted Forest Sanctuary',
    description: 'Paint together on one canvas in friendly harmony! Add mystical trees, gentle woodland creatures, and glowing fireflies.',
    durationSeconds: 180
  },
  {
    id: 'ch-coop-underwater',
    mode: 'cooperative',
    title: 'Coral Reef Harmony',
    description: 'A relaxed cooperative expedition to paint a vibrant underwater coral paradise together.',
    durationSeconds: 180
  },
  {
    id: 'ch-coop-solarsystem',
    mode: 'cooperative',
    title: 'Cosmic Constellation Journey',
    description: 'Cooperate to paint distant starfields, orbiting planets, and swirling nebulae with your friend.',
    durationSeconds: 210
  }
];

interface LobbySettingsModalProps {
  match: MatchState;
  onSave: (settings: {
    mode: GameMode;
    challengeId: string;
    durationSeconds: number;
    namingDurationSeconds: number;
    maxPlayers: number;
  }) => void;
  onClose: () => void;
}

export function LobbySettingsModal({ match, onSave, onClose }: LobbySettingsModalProps) {
  const [mode, setMode] = useState<GameMode>(match.mode);
  const [challengeId, setChallengeId] = useState<string>(match.challenge.id);
  const [durationSeconds, setDurationSeconds] = useState<number>(match.challenge.durationSeconds || 120);
  const [namingDurationSeconds, setNamingDurationSeconds] = useState<number>(match.namingTimeRemainingSeconds || 20);
  const [maxPlayers, setMaxPlayers] = useState<number>(match.maxPlayers || 8);

  // Challenges matching current selected mode
  const filteredChallenges = CLIENT_CHALLENGES.filter(c => c.mode === mode);

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    const firstChallenge = CLIENT_CHALLENGES.find(c => c.mode === newMode);
    if (firstChallenge) {
      setChallengeId(firstChallenge.id);
      setDurationSeconds(firstChallenge.durationSeconds);
    }
  };

  const handleRandomizeChallenge = () => {
    const list = filteredChallenges.length > 0 ? filteredChallenges : CLIENT_CHALLENGES;
    const random = list[Math.floor(Math.random() * list.length)];
    if (random) {
      setMode(random.mode);
      setChallengeId(random.id);
      setDurationSeconds(random.durationSeconds);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      mode,
      challengeId,
      durationSeconds,
      namingDurationSeconds,
      maxPlayers
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none animate-fadeIn">
      <div className="bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-navy-700 flex items-center justify-between bg-slate-50 dark:bg-navy-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Lobby & Match Settings
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Host Controls
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Mode Switcher */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'coloring', label: 'Coloring', icon: Palette },
                { id: 'drawing', label: 'Drawing', icon: Brush },
                { id: 'freestyle', label: 'Freestyle', icon: Sparkles },
                { id: 'cooperative', label: 'Co-op (Friendly)', icon: Users }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModeChange(m.id as GameMode)}
                    className={`flex items-center justify-center gap-1.5 p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 ring-2 ring-sky-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-sky-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Specific Challenge Card Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Choose Challenge / Theme
              </label>
              <button
                type="button"
                onClick={handleRandomizeChallenge}
                className="text-[11px] font-bold text-sky-500 hover:text-sky-600 flex items-center gap-1"
              >
                <Dices className="w-3.5 h-3.5" />
                Randomize
              </button>
            </div>

            <div className="space-y-2">
              {filteredChallenges.map((c) => {
                const isSelected = challengeId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setChallengeId(c.id);
                      setDurationSeconds(c.durationSeconds);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-500/50 shadow-xs'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800/60 hover:border-sky-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.durationSeconds}s
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {c.description}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-slate-300 dark:border-navy-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Time Limit & Preparation Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Match Duration */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                Drawing Time Limit
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[60, 90, 120, 150, 180, 240].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setDurationSeconds(sec)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      durationSeconds === sec
                        ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                    }`}
                  >
                    {sec}s ({Math.floor(sec / 60)}m{sec % 60 ? '30s' : ''})
                  </button>
                ))}
              </div>
            </div>

            {/* Preparation / Naming Period */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-sky-500" />
                Naming Countdown
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[10, 15, 20, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setNamingDurationSeconds(sec)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                      namingDurationSeconds === sec
                        ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                    }`}
                  >
                    {sec}s {sec === 20 && '★'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Max Players / Room Cap */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-500" />
              Lobby Capacity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { count: 2, label: '2 (1v1 Duel)' },
                { count: 4, label: '4 (2v2 Team)' },
                { count: 6, label: '6 (3v3 Team)' },
                { count: 8, label: '8 (4v4 Epic)' }
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setMaxPlayers(opt.count)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                    maxPlayers === opt.count
                      ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                      : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:border-sky-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit Action */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800 font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md transition-transform active:scale-95"
            >
              Apply Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
