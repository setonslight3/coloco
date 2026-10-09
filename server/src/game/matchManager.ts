import {
  MatchState,
  MatchPhase,
  GameMode,
  Player,
  Team,
  Challenge,
  DrawStroke,
  MatchTelemetry
} from '../types/index.js';
import { validateStrokeTerritory, generateTerritoryBoundaries } from './territory.js';

export interface LobbySettingsPayload {
  mode?: GameMode;
  challengeId?: string;
  durationSeconds?: number;
  namingDurationSeconds?: number;
  maxPlayers?: number;
  isPublic?: boolean;
}

// Predefined challenges across all modes
export const BUILT_IN_CHALLENGES: Challenge[] = [
  // --- COLORING CHALLENGES (Basic, recognizable objects: Airplane, Cat, Dog, Sailboat) ---
  {
    id: 'ch-coloring-airplane',
    mode: 'coloring',
    title: 'Sky Airplane',
    description: 'A clean passenger jet flying across sunny clouds. Color the wings, body, and sky!',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Fuselage -->
      <path d="M 180 500 C 180 440 260 410 450 420 L 720 430 C 820 430 900 470 920 500 C 900 530 820 570 720 570 L 450 580 C 260 590 180 560 180 500 Z" />
      <!-- Cockpit & Passenger Windows -->
      <ellipse cx="840" cy="485" rx="35" ry="20" stroke-width="6" />
      <circle cx="720" cy="485" r="14" stroke-width="5" />
      <circle cx="650" cy="485" r="14" stroke-width="5" />
      <circle cx="580" cy="485" r="14" stroke-width="5" />
      <circle cx="510" cy="485" r="14" stroke-width="5" />
      <circle cx="440" cy="485" r="14" stroke-width="5" />
      <!-- Main Upper Wing -->
      <polygon points="560,430 450,150 370,160 440,430" stroke-width="8" />
      <!-- Main Lower Wing -->
      <polygon points="560,570 450,850 370,840 440,570" stroke-width="8" />
      <!-- Tail Fin -->
      <polygon points="280,430 200,240 140,240 190,450" stroke-width="8" />
      <polygon points="260,570 210,680 160,680 190,560" stroke-width="7" />
      <!-- Fluffy Clouds -->
      <path d="M 120 780 C 140 730 220 730 250 770 C 290 750 360 780 350 830 C 350 860 110 860 120 780 Z" stroke-width="6" stroke-dasharray="16 10" />
      <path d="M 680 230 C 700 180 770 180 800 220 C 840 200 900 230 890 270 C 890 300 670 300 680 230 Z" stroke-width="6" stroke-dasharray="16 10" />
    </svg>`,
    durationSeconds: 120
  },
  {
    id: 'ch-coloring-cat',
    mode: 'coloring',
    title: 'Playful Kitten',
    description: 'A cute friendly cat with whiskers and pointy ears. Easy to color with fur patterns!',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Cat Head -->
      <circle cx="500" cy="420" r="230" stroke-width="8" />
      <!-- Left & Right Ears -->
      <polygon points="320,300 240,110 400,210" stroke-width="8" />
      <polygon points="680,300 760,110 600,210" stroke-width="8" />
      <polygon points="330,270 270,150 380,215" stroke-width="5" />
      <polygon points="670,270 730,150 620,215" stroke-width="5" />
      <!-- Big Eyes -->
      <ellipse cx="400" cy="400" rx="42" ry="52" stroke-width="7" />
      <circle cx="412" cy="395" r="20" fill="currentColor" />
      <ellipse cx="600" cy="400" rx="42" ry="52" stroke-width="7" />
      <circle cx="588" cy="395" r="20" fill="currentColor" />
      <!-- Cute Nose & Smile -->
      <polygon points="500,470 475,445 525,445" fill="currentColor" />
      <path d="M 500 470 L 500 505 Q 460 540 430 500" stroke-width="6" />
      <path d="M 500 505 Q 540 540 570 500" stroke-width="6" />
      <!-- Whiskers -->
      <line x1="360" y1="465" x2="180" y2="445" stroke-width="6" />
      <line x1="360" y1="485" x2="160" y2="495" stroke-width="6" />
      <line x1="360" y1="505" x2="190" y2="540" stroke-width="6" />
      <line x1="640" y1="465" x2="820" y2="445" stroke-width="6" />
      <line x1="640" y1="485" x2="840" y2="495" stroke-width="6" />
      <line x1="640" y1="505" x2="810" y2="540" stroke-width="6" />
      <!-- Body Outline -->
      <path d="M 330 620 C 260 700 240 850 240 920 L 760 920 C 760 850 740 700 670 620" stroke-width="8" />
      <!-- Collar & Bell -->
      <path d="M 360 645 Q 500 700 640 645" stroke-width="7" />
      <circle cx="500" cy="710" r="30" stroke-width="6" />
    </svg>`,
    durationSeconds: 120
  },
  {
    id: 'ch-coloring-dog',
    mode: 'coloring',
    title: 'Happy Puppy',
    description: 'A charming puppy with floppy ears and a wagging tail. Simple shapes for bright colors!',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Puppy Head -->
      <ellipse cx="500" cy="400" rx="220" ry="200" stroke-width="8" />
      <!-- Floppy Left & Right Ears -->
      <path d="M 310 280 C 200 280 150 420 180 560 C 200 620 260 620 280 520 L 300 400" stroke-width="8" />
      <path d="M 690 280 C 800 280 850 420 820 560 C 800 620 740 620 720 520 L 700 400" stroke-width="8" />
      <!-- Puppy Eyes -->
      <circle cx="410" cy="380" r="35" stroke-width="7" />
      <circle cx="420" cy="375" r="16" fill="currentColor" />
      <circle cx="590" cy="380" r="35" stroke-width="7" />
      <circle cx="580" cy="375" r="16" fill="currentColor" />
      <!-- Big Round Nose -->
      <ellipse cx="500" cy="460" rx="45" ry="32" fill="currentColor" />
      <!-- Happy Open Mouth / Tongue -->
      <path d="M 500 492 L 500 525 Q 450 550 420 520" stroke-width="6" />
      <path d="M 500 525 Q 550 550 580 520" stroke-width="6" />
      <path d="M 470 535 C 470 600 530 600 530 535 Z" fill="#f43f5e" stroke-width="5" />
      <!-- Body and Paws -->
      <path d="M 320 580 C 270 680 250 820 260 920 L 740 920 C 750 820 730 680 680 580" stroke-width="8" />
      <path d="M 430 760 L 430 920" stroke-width="6" />
      <path d="M 570 760 L 570 920" stroke-width="6" />
    </svg>`,
    durationSeconds: 120
  },
  {
    id: 'ch-coloring-sailboat',
    mode: 'coloring',
    title: 'Ocean Sailboat',
    description: 'A classic sailboat cruising through gentle ocean waves beneath the warm sun.',
    templateLineArtSvg: `<svg viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <!-- Sun -->
      <circle cx="820" cy="180" r="70" stroke-width="7" />
      <line x1="820" y1="70" x2="820" y2="40" stroke-width="6" />
      <line x1="930" y1="180" x2="960" y2="180" stroke-width="6" />
      <line x1="710" y1="180" x2="680" y2="180" stroke-width="6" />
      <line x1="895" y1="105" x2="920" y2="80" stroke-width="6" />
      <!-- Mast -->
      <line x1="500" y1="160" x2="500" y2="670" stroke-width="10" />
      <!-- Main Sail (Right) -->
      <polygon points="515,190 770,620 515,620" stroke-width="8" />
      <!-- Jib / Front Sail (Left) -->
      <polygon points="485,240 250,620 485,620" stroke-width="8" />
      <!-- Hull -->
      <polygon points="180,680 820,680 730,800 270,800" stroke-width="8" />
      <!-- Ocean Waves -->
      <path d="M 80 850 Q 200 810 320 850 T 560 850 T 800 850 T 960 850" stroke-width="7" />
      <path d="M 40 920 Q 180 880 320 920 T 600 920 T 880 920 T 980 920" stroke-width="7" />
    </svg>`,
    durationSeconds: 120
  },

  // --- DRAWING CHALLENGES (Blank canvas, reference guide provided) ---
  {
    id: 'ch-drawing-apple',
    mode: 'drawing',
    title: 'Red Delicious Apple',
    description: 'Draw a shiny red apple with a wooden stem and a green leaf.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },
  {
    id: 'ch-drawing-cat',
    mode: 'drawing',
    title: 'Fluffy Cat Portrait',
    description: 'Sketch a cute ginger cat with whiskers, pointy ears, and expressive green eyes.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },
  {
    id: 'ch-drawing-lighthouse',
    mode: 'drawing',
    title: 'Seaside Lighthouse',
    description: 'Depict a sturdy coastal lighthouse with its bright light and sea waves.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },
  {
    id: 'ch-drawing-car',
    mode: 'drawing',
    title: 'Vintage Red Car',
    description: 'Draw a classic retro automobile with round headlights and chrome bumpers.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },

  // --- FREESTYLE CHALLENGES ---
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

  // --- COOPERATIVE (FRIENDLY / NON-COMPETITIVE) CHALLENGES ---
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

export class MatchManager {
  private matches: Map<string, MatchState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  createMatch(hostId: string, hostName: string, mode: GameMode = 'coloring', isPublic: boolean = true, challengeId?: string): MatchState {
    const id = `match-${Math.random().toString(36).substring(2, 9)}`;
    const lobbyCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    let challenge = challengeId ? BUILT_IN_CHALLENGES.find(c => c.id === challengeId) : undefined;
    if (!challenge) {
      challenge = BUILT_IN_CHALLENGES.find(c => c.mode === mode) || BUILT_IN_CHALLENGES[0];
    }

    const match: MatchState = {
      id,
      lobbyCode,
      mode,
      phase: 'lobby',
      hostId,
      isPublic,
      players: {
        [hostId]: {
          id: hostId,
          username: hostName,
          isHost: true,
          isReady: false,
          isDone: false
        }
      },
      teams: {},
      territories: [],
      challenge,
      timeRemainingSeconds: challenge.durationSeconds,
      namingTimeRemainingSeconds: 20, // 20 seconds preparation & naming
      revealTimeRemainingSeconds: 25, // 25 seconds score-hidden reveal
      maxPlayers: mode === 'cooperative' ? 2 : 4,
      telemetry: []
    };

    this.matches.set(id, match);
    return match;
  }

  getPublicLobbies(): Array<{
    id: string;
    lobbyCode: string;
    mode: GameMode;
    hostName: string;
    challengeTitle: string;
    playerCount: number;
    maxPlayers: number;
    phase: MatchPhase;
  }> {
    const list = [];
    for (const match of this.matches.values()) {
      if (match.isPublic && match.phase === 'lobby') {
        const host = match.players[match.hostId];
        list.push({
          id: match.id,
          lobbyCode: match.lobbyCode,
          mode: match.mode,
          hostName: host?.username || 'Host',
          challengeTitle: match.challenge.title,
          playerCount: Object.keys(match.players).length,
          maxPlayers: match.maxPlayers,
          phase: match.phase
        });
      }
    }
    return list;
  }

  getMatch(id: string): MatchState | undefined {
    return this.matches.get(id);
  }

  getMatchByCode(code: string): MatchState | undefined {
    const upper = code.toUpperCase();
    for (const match of this.matches.values()) {
      if (match.lobbyCode === upper) return match;
    }
    return undefined;
  }

  joinMatch(matchId: string, player: { id: string; username: string }): MatchState | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== 'lobby') return null;

    if (Object.keys(match.players).length >= match.maxPlayers) {
      return null;
    }

    match.players[player.id] = {
      id: player.id,
      username: player.username,
      isHost: false,
      isReady: false,
      isDone: false
    };

    return match;
  }

  leaveMatch(matchId: string, playerId: string): { match: MatchState | null; deleted: boolean } {
    const match = this.matches.get(matchId);
    if (!match) return { match: null, deleted: false };

    delete match.players[playerId];

    const remainingPlayerIds = Object.keys(match.players);
    if (remainingPlayerIds.length === 0) {
      if (this.timers.has(matchId)) {
        clearInterval(this.timers.get(matchId)!);
        this.timers.delete(matchId);
      }
      this.matches.delete(matchId);
      return { match: null, deleted: true };
    }

    // If host left, pass host crown to next remaining player
    if (match.hostId === playerId) {
      const newHostId = remainingPlayerIds[0];
      match.hostId = newHostId;
      if (match.players[newHostId]) {
        match.players[newHostId].isHost = true;
      }
    }

    return { match, deleted: false };
  }

  setPlayerReady(matchId: string, playerId: string, isReady: boolean): MatchState | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== 'lobby') return null;

    if (match.players[playerId]) {
      match.players[playerId].isReady = isReady;
    }
    return match;
  }

  setGameMode(matchId: string, hostId: string, mode: GameMode): MatchState | null {
    return this.updateLobbySettings(matchId, hostId, { mode });
  }

  updateLobbySettings(matchId: string, hostId: string, settings: LobbySettingsPayload): MatchState | null {
    const match = this.matches.get(matchId);
    if (!match || match.hostId !== hostId || match.phase !== 'lobby') return null;

    if (settings.mode) {
      match.mode = settings.mode;
    }

    if (settings.challengeId) {
      const found = BUILT_IN_CHALLENGES.find(c => c.id === settings.challengeId);
      if (found) {
        match.challenge = { ...found };
        if (!settings.mode || settings.mode !== 'cooperative') {
          match.mode = found.mode;
        }
      }
    } else if (settings.mode && match.challenge.mode !== settings.mode && settings.mode !== 'cooperative') {
      const defaultForMode = BUILT_IN_CHALLENGES.find(c => c.mode === settings.mode) || BUILT_IN_CHALLENGES[0];
      match.challenge = { ...defaultForMode };
    }

    if (settings.durationSeconds && settings.durationSeconds >= 30 && settings.durationSeconds <= 600) {
      match.challenge.durationSeconds = settings.durationSeconds;
      match.timeRemainingSeconds = settings.durationSeconds;
    } else {
      match.timeRemainingSeconds = match.challenge.durationSeconds;
    }

    if (settings.namingDurationSeconds && settings.namingDurationSeconds >= 10 && settings.namingDurationSeconds <= 60) {
      match.namingTimeRemainingSeconds = settings.namingDurationSeconds;
    }

    if (settings.isPublic !== undefined) {
      match.isPublic = settings.isPublic;
    }

    if (settings.maxPlayers && settings.maxPlayers >= 2 && settings.maxPlayers <= 16) {
      match.maxPlayers = settings.maxPlayers;
    }

    return match;
  }

  /**
   * Starts the match by randomly assigning equal teams and initiating naming phase.
   * Host cannot stack teams - random distribution enforced.
   */
  startMatch(matchId: string, hostId: string, onTick: (m: MatchState) => void, onPhaseChange: (m: MatchState) => void): MatchState | null {
    const match = this.matches.get(matchId);
    if (!match || match.hostId !== hostId || match.phase !== 'lobby') return null;

    const playerList = Object.values(match.players);
    if (playerList.length < 2) {
      // Need at least 2 players for multiplayer (even 1v1 for testing)
    }

    // Shuffle players randomly (Fisher-Yates)
    const shuffled = [...playerList].sort(() => Math.random() - 0.5);

    // If cooperative mode OR if only 2 players are present:
    // 2 players ALWAYS play as teammates together on one canvas (no 1v1)!
    const isCoop = match.mode === 'cooperative' || shuffled.length <= 2;

    if (isCoop) {
      match.teams = {
        coop_team: {
          id: 'coop_team',
          name: 'Co-op Canvas',
          color: '#38bdf8',
          playerIds: [],
          namingContributions: {},
          isAllDone: false,
          strokes: []
        }
      };

      shuffled.forEach((p, idx) => {
        match.teams.coop_team.playerIds.push(p.id);
        match.players[p.id].teamId = 'coop_team';
        match.players[p.id].territoryIndex = idx;
      });

      match.territories = generateTerritoryBoundaries(Math.max(2, shuffled.length));
    } else {
      // 4 or more players in competitive mode: 2 balanced opponent teams (2v2, etc.)
      match.teams = {
        team1: {
          id: 'team1',
          name: 'Team 1',
          color: '#38bdf8', // Light blue
          playerIds: [],
          namingContributions: {},
          isAllDone: false,
          strokes: []
        },
        team2: {
          id: 'team2',
          name: 'Team 2',
          color: '#fb7185', // Rose / Red
          playerIds: [],
          namingContributions: {},
          isAllDone: false,
          strokes: []
        }
      };

      shuffled.forEach((p, idx) => {
        const targetTeamId = idx % 2 === 0 ? 'team1' : 'team2';
        match.teams[targetTeamId].playerIds.push(p.id);
        match.players[p.id].teamId = targetTeamId;
        // Index within team determines distinct territory (0, 1, etc.)
        match.players[p.id].territoryIndex = match.teams[targetTeamId].playerIds.length - 1;
      });

      // Calculate max players per team to determine territory partition
      const maxPerTeam = Math.max(...Object.values(match.teams).map(t => t.playerIds.length));
      match.territories = generateTerritoryBoundaries(Math.max(2, maxPerTeam));
    }

    // Transition to NAMING phase
    match.phase = 'naming';
    match.namingTimeRemainingSeconds = 20;

    // Start naming countdown timer
    this.startNamingTimer(matchId, onTick, onPhaseChange);

    return match;
  }

  private startNamingTimer(matchId: string, onTick: (m: MatchState) => void, onPhaseChange: (m: MatchState) => void) {
    if (this.timers.has(matchId)) {
      clearInterval(this.timers.get(matchId)!);
    }

    const interval = setInterval(() => {
      const match = this.matches.get(matchId);
      if (!match || match.phase !== 'naming') {
        clearInterval(interval);
        return;
      }

      match.namingTimeRemainingSeconds--;
      onTick(match);

      if (match.namingTimeRemainingSeconds <= 0) {
        clearInterval(interval);
        // Finalize team names (truncate to 20 chars or apply fallback)
        for (const team of Object.values(match.teams)) {
          const contributions = Object.values(team.namingContributions).filter(s => s.trim().length > 0);
          if (contributions.length > 0) {
            team.name = contributions.join(' ').substring(0, 20).trim();
          } else {
            team.name = team.id === 'team1' ? 'Sky Painters' : 'Crimson Brushes';
          }
        }

        // Transition to PLAYING phase (voice and canvas now enabled)
        match.phase = 'playing';
        onPhaseChange(match);
        this.startGameplayTimer(matchId, onTick, onPhaseChange);
      }
    }, 1000);

    this.timers.set(matchId, interval);
  }

  private startGameplayTimer(matchId: string, onTick: (m: MatchState) => void, onPhaseChange: (m: MatchState) => void) {
    if (this.timers.has(matchId)) {
      clearInterval(this.timers.get(matchId)!);
    }

    const interval = setInterval(() => {
      const match = this.matches.get(matchId);
      if (!match || match.phase !== 'playing') {
        clearInterval(interval);
        return;
      }

      match.timeRemainingSeconds--;
      onTick(match);

      // Check if all teams are done early
      const allDone = Object.values(match.teams).every(t => t.isAllDone);

      if (match.timeRemainingSeconds <= 0 || allDone) {
        clearInterval(interval);
        // Lock all canvases immediately
        match.phase = 'revealing';
        match.revealTimeRemainingSeconds = 20;
        onPhaseChange(match);
        this.startRevealTimer(matchId, onTick, onPhaseChange);
      }
    }, 1000);

    this.timers.set(matchId, interval);
  }

  private startRevealTimer(matchId: string, onTick: (m: MatchState) => void, onPhaseChange: (m: MatchState) => void) {
    if (this.timers.has(matchId)) {
      clearInterval(this.timers.get(matchId)!);
    }

    const interval = setInterval(() => {
      const match = this.matches.get(matchId);
      if (!match || match.phase !== 'revealing') {
        clearInterval(interval);
        return;
      }

      match.revealTimeRemainingSeconds--;
      onTick(match);

      if (match.revealTimeRemainingSeconds <= 0) {
        clearInterval(interval);
        match.phase = 'verdict';
        onPhaseChange(match);
      }
    }, 1000);

    this.timers.set(matchId, interval);
  }

  submitNamingWord(matchId: string, playerId: string, word: string): Team | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== 'naming') return null;

    const player = match.players[playerId];
    if (!player || !player.teamId) return null;

    const team = match.teams[player.teamId];
    if (!team) return null;

    // Sanitize and limit to 10 characters per player
    team.namingContributions[playerId] = word.trim().substring(0, 10);
    return team;
  }

  /**
   * Submits a stroke from a player.
   * Validates:
   * 1. Match is active
   * 2. Player is not locked/DONE
   * 3. Points are clipped to the player's territory
   */
  addStroke(matchId: string, stroke: DrawStroke): { stroke: DrawStroke | null; rejectedCount: number } {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== 'playing') {
      return { stroke: null, rejectedCount: stroke.points.length };
    }

    const player = match.players[stroke.playerId];
    if (!player || player.isDone || !player.teamId) {
      return { stroke: null, rejectedCount: stroke.points.length };
    }

    const team = match.teams[player.teamId];
    if (!team) return { stroke: null, rejectedCount: stroke.points.length };

    const teamPlayerCount = team.playerIds.length;
    const playerIndex = player.territoryIndex ?? 0;

    // Validate territory
    const { validPoints, rejectedCount } = validateStrokeTerritory(
      stroke.points,
      playerIndex,
      teamPlayerCount
    );

    // Record telemetry
    let tele = match.telemetry.find(t => t.playerId === player.id);
    if (!tele) {
      tele = {
        teamId: team.id,
        playerId: player.id,
        validStrokesCount: 0,
        rejectedStrokesCount: 0,
        territoryViolationCount: 0,
        timeSpentSeconds: 0,
        completedEarly: false
      };
      match.telemetry.push(tele);
    }

    if (rejectedCount > 0) {
      tele.territoryViolationCount += rejectedCount;
      tele.rejectedStrokesCount++;
    }

    if (validPoints.length === 0) {
      return { stroke: null, rejectedCount };
    }

    const validatedStroke: DrawStroke = {
      ...stroke,
      points: validPoints,
      sequence: team.strokes.length + 1
    };

    team.strokes.push(validatedStroke);
    tele.validStrokesCount++;

    return { stroke: validatedStroke, rejectedCount };
  }

  /**
   * Player presses DONE: locks territory for that player only; teammates continue.
   */
  setPlayerDone(matchId: string, playerId: string): { player: Player; team: Team } | null {
    const match = this.matches.get(matchId);
    if (!match || match.phase !== 'playing') return null;

    const player = match.players[playerId];
    if (!player || !player.teamId) return null;

    player.isDone = true;

    const team = match.teams[player.teamId];
    if (!team) return null;

    // Check if all players in team are done
    const allTeamDone = team.playerIds.every(pid => match.players[pid]?.isDone);
    if (allTeamDone) {
      team.isAllDone = true;
      team.finishedAt = Date.now();
    }

    return { player, team };
  }
}
