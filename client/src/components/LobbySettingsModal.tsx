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
  ShieldCheck,
  Globe,
  Lock,
  Heart,
  Swords
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
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="6">
      <path d="M 460 450 C 460 650 380 820 220 920 C 340 920 420 860 500 860 C 580 860 660 920 780 920 C 620 820 540 650 540 450 Z" />
      <path d="M 500 120 C 320 120 200 240 200 400 C 200 520 280 600 380 640 C 440 480 560 480 620 640 C 720 600 800 520 800 400 C 800 240 680 120 500 120 Z" />
      <path d="M 320 300 C 380 200 620 200 680 300" stroke-dasharray="16 12" />
      <circle cx="500" cy="320" r="90" stroke-width="5" />
      <path d="M 220 850 C 220 780 320 780 320 850 Z" />
      <rect x="255" y="850" width="30" height="70" rx="8" />
      <path d="M 680 840 C 680 770 780 770 780 840 Z" />
      <rect x="715" y="840" width="30" height="80" rx="8" />
      <circle cx="280" cy="220" r="16" fill="currentColor" />
      <circle cx="720" cy="220" r="16" fill="currentColor" />
      <circle cx="500" cy="200" r="12" fill="currentColor" />
      <circle cx="340" cy="460" r="10" fill="currentColor" />
      <circle cx="660" cy="460" r="10" fill="currentColor" />
      <path d="M 470 720 C 470 660 530 660 530 720 C 530 790 470 790 470 720 Z" />
    </svg>`,
    durationSeconds: 180
  },
  {
    id: 'ch-coop-underwater',
    mode: 'cooperative',
    title: 'Coral Reef Harmony',
    description: 'A relaxed cooperative expedition to paint a vibrant underwater coral paradise together.',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="6">
      <path d="M 0 880 Q 250 820 500 860 T 1000 840 L 1000 1000 L 0 1000 Z" />
      <ellipse cx="500" cy="420" rx="200" ry="260" stroke-width="7" />
      <path d="M 500 160 C 470 110 530 110 500 160 Z" />
      <path d="M 320 280 C 200 220 180 340 320 380" stroke-width="6" />
      <path d="M 680 280 C 800 220 820 340 680 380" stroke-width="6" />
      <path d="M 360 620 C 260 680 280 760 380 700" stroke-width="6" />
      <path d="M 640 620 C 740 680 720 760 620 700" stroke-width="6" />
      <ellipse cx="500" cy="420" rx="120" ry="160" stroke-dasharray="20 14" />
      <path d="M 150 860 C 120 740 180 660 220 620 C 240 680 210 760 250 860" />
      <path d="M 820 850 C 790 730 860 650 880 610 C 900 680 860 760 890 850" />
      <polygon points="210,460 240,480 210,500" />
      <circle cx="275" cy="475" r="4" fill="currentColor" />
      <circle cx="480" cy="180" r="22" stroke-width="5" />
      <circle cx="530" cy="120" r="14" stroke-width="4" />
      <circle cx="510" cy="70" r="18" stroke-width="4" />
    </svg>`,
    durationSeconds: 180
  },
  {
    id: 'ch-coop-solarsystem',
    mode: 'cooperative',
    title: 'Cosmic Constellation Journey',
    description: 'Cooperate to paint distant starfields, orbiting planets, and swirling nebulae with your friend.',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="6">
      <circle cx="500" cy="500" r="190" stroke-width="7" />
      <ellipse cx="500" cy="500" rx="380" ry="90" transform="rotate(-25 500 500)" stroke-width="7" />
      <ellipse cx="500" cy="500" rx="420" ry="110" stroke-dasharray="20 12" transform="rotate(-25 500 500)" stroke-width="4" />
      <path d="M 220 180 A 100 100 0 1 0 320 340 A 80 80 0 1 1 220 180 Z" stroke-width="6" />
      <circle cx="230" cy="280" r="12" stroke-width="3" />
      <polygon points="800,220 740,290 830,320" stroke-width="5" />
      <circle cx="785" cy="275" r="14" stroke-width="4" />
      <circle cx="340" cy="800" r="30" stroke-width="5" />
      <circle cx="680" cy="840" r="45" stroke-width="5" />
    </svg>`,
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
    isPublic: boolean;
  }) => void;
  onClose: () => void;
}

export function LobbySettingsModal({ match, onSave, onClose }: LobbySettingsModalProps) {
  // Determine initial category: if mode is cooperative, category is cooperative; otherwise competitive
  const isInitialCoop = match.mode === 'cooperative';
  const [category, setCategory] = useState<'cooperative' | 'competitive'>(isInitialCoop ? 'cooperative' : 'competitive');
  const [subStyle, setSubStyle] = useState<'coloring' | 'drawing' | 'freestyle'>('coloring');
  const [isPublic, setIsPublic] = useState<boolean>(match.isPublic ?? true);
  const [challengeId, setChallengeId] = useState<string>(match.challenge.id);
  const [durationSeconds, setDurationSeconds] = useState<number>(match.challenge.durationSeconds || 120);
  const [namingDurationSeconds, setNamingDurationSeconds] = useState<number>(match.namingTimeRemainingSeconds || 20);
  const [maxPlayers, setMaxPlayers] = useState<number>(
    isInitialCoop ? 2 : (match.maxPlayers === 2 ? 4 : (match.maxPlayers || 4))
  );

  // When category is cooperative, effective mode is 'cooperative'. When competitive, it's subStyle.
  const effectiveMode: GameMode = category === 'cooperative' ? 'cooperative' : subStyle;

  // Challenges matching current selection
  const filteredChallenges = category === 'cooperative'
    ? CLIENT_CHALLENGES.filter(c => c.mode === 'cooperative' || c.mode === subStyle)
    : CLIENT_CHALLENGES.filter(c => c.mode === subStyle);

  const handleCategoryChange = (newCat: 'cooperative' | 'competitive') => {
    setCategory(newCat);
    if (newCat === 'cooperative') {
      setMaxPlayers(2);
      const coopChal = CLIENT_CHALLENGES.find(c => c.mode === 'cooperative') || CLIENT_CHALLENGES[0];
      setChallengeId(coopChal.id);
      setDurationSeconds(coopChal.durationSeconds);
    } else {
      if (maxPlayers <= 2) setMaxPlayers(4);
      const subChal = CLIENT_CHALLENGES.find(c => c.mode === subStyle) || CLIENT_CHALLENGES[0];
      setChallengeId(subChal.id);
      setDurationSeconds(subChal.durationSeconds);
    }
  };

  const handleSubStyleChange = (newStyle: 'coloring' | 'drawing' | 'freestyle') => {
    setSubStyle(newStyle);
    const firstChallenge = CLIENT_CHALLENGES.find(c => c.mode === newStyle);
    if (firstChallenge) {
      setChallengeId(firstChallenge.id);
      setDurationSeconds(firstChallenge.durationSeconds);
    }
  };

  const handleRandomizeChallenge = () => {
    const list = filteredChallenges.length > 0 ? filteredChallenges : CLIENT_CHALLENGES;
    const random = list[Math.floor(Math.random() * list.length)];
    if (random) {
      setChallengeId(random.id);
      setDurationSeconds(random.durationSeconds);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      mode: effectiveMode,
      challengeId,
      durationSeconds,
      namingDurationSeconds,
      maxPlayers: category === 'cooperative' ? 2 : maxPlayers,
      isPublic
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 0: Lobby Visibility (Public vs Private) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-500" />
              Lobby Privacy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  isPublic
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/40 shadow-xs'
                    : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <div className="font-black">Public Lobby</div>
                  <div className="text-[10px] font-normal text-slate-500">Visible in lobby browser</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${
                  !isPublic
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-xs'
                    : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <div className="font-black">Private Lobby</div>
                  <div className="text-[10px] font-normal text-slate-500">Invite code only</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 1: Main Game Mode (Cooperative vs Competitive) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Main Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('cooperative')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  category === 'cooperative'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 ring-2 ring-pink-500/40 text-pink-700 dark:text-pink-300'
                    : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-sky-300'
                }`}
              >
                <Heart className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-black">Cooperative (Friendly)</div>
                  <div className="text-[10px] text-slate-500">Paint together on 1 canvas (2 players)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('competitive')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                  category === 'competitive'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/40 text-sky-700 dark:text-sky-300'
                    : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-sky-300'
                }`}
              >
                <Swords className="w-4 h-4 text-sky-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-black">Competitive (Team Arena)</div>
                  <div className="text-[10px] text-slate-500">Team vs Team showdown (4, 6, 8 players)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Sub-Art Style */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Art Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'coloring', label: 'Coloring', icon: Palette, desc: 'Shared line art' },
                { id: 'drawing', label: 'Drawing', icon: Brush, desc: 'Reference guide' },
                { id: 'freestyle', label: 'Freestyle', icon: Sparkles, desc: 'Open theme' }
              ].map((s) => {
                const Icon = s.icon;
                const isSelected = subStyle === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSubStyleChange(s.id as any)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 ring-2 ring-sky-500/40 shadow-xs'
                        : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:border-sky-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-xs font-extrabold">{s.label}</span>
                    <span className="text-[10px] text-slate-400">{s.desc}</span>
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
            {category === 'cooperative' ? (
              <div className="p-3 rounded-2xl border border-pink-200 dark:border-pink-900/60 bg-pink-50/60 dark:bg-pink-950/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-pink-900 dark:text-pink-200">2 Players (Co-op Duo)</div>
                  <div className="text-[11px] text-pink-700/80 dark:text-pink-300/80">Cooperative mode is built for 2 friends to paint together on 1 canvas</div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-pink-500 text-white font-black text-xs">
                  Fixed: 2
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
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
            )}
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
