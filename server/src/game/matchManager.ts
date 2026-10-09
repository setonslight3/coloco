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
}

// Predefined challenges across all modes
export const BUILT_IN_CHALLENGES: Challenge[] = [
  // --- COLORING CHALLENGES ---
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
      <circle cx="500" cy="500" r="400" stroke-dasharray="20 15" stroke-width="3" />
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
      <circle cx="500" cy="500" r="450" stroke-dasharray="25 15" />
      <polygon points="500,150 850,500 500,850 150,500" />
      <polygon points="500,100 800,750 200,750" />
      <polygon points="500,900 200,250 800,250" />
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
      <path d="M 320 720 C 180 820 180 920 240 940 C 280 940 340 880 360 800" />
      <path d="M 680 720 C 820 820 820 920 760 940 C 720 940 660 880 640 800" />
    </svg>`,
    durationSeconds: 150
  },

  // --- DRAWING CHALLENGES ---
  {
    id: 'ch-drawing-lighthouse',
    mode: 'drawing',
    title: 'Beacon in the Storm',
    description: 'Collaborate to depict a cliffside lighthouse shining through raging storm waves.',
    referenceImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    durationSeconds: 150
  },
  {
    id: 'ch-drawing-mountain',
    mode: 'drawing',
    title: 'Alpine Golden Dawn',
    description: 'A majestic snow-capped mountain range greeting the first warm rays of sunrise.',
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

export class MatchManager {
  private matches: Map<string, MatchState> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  createMatch(hostId: string, hostName: string, mode: GameMode = 'coloring'): MatchState {
    const id = `match-${Math.random().toString(36).substring(2, 9)}`;
    const lobbyCode = Math.random().toString(36).substring(2, 6).toUpperCase();

    const challenge = BUILT_IN_CHALLENGES.find(c => c.mode === mode) || BUILT_IN_CHALLENGES[0];

    const match: MatchState = {
      id,
      lobbyCode,
      mode,
      phase: 'lobby',
      hostId,
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
      maxPlayers: 8,
      telemetry: []
    };

    this.matches.set(id, match);
    return match;
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
        match.mode = found.mode;
      }
    } else if (settings.mode && match.challenge.mode !== settings.mode) {
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

    if (match.mode === 'cooperative') {
      // COOPERATIVE FRIENDLY MODE: All players are on 1 united team painting on the same canvas!
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

      match.territories = generateTerritoryBoundaries(shuffled.length);
    } else {
      // COMPETITIVE MODES: 2 balanced opponent teams
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
        // Index within team determines territory
        match.players[p.id].territoryIndex = match.teams[targetTeamId].playerIds.length - 1;
      });

      // Calculate max players per team to determine territory partition
      const maxPerTeam = Math.max(...Object.values(match.teams).map(t => t.playerIds.length));
      match.territories = generateTerritoryBoundaries(maxPerTeam);
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
