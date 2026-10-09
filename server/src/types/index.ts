export type GameMode = 'coloring' | 'drawing' | 'freestyle' | 'cooperative';

export type MatchPhase =
  | 'lobby'
  | 'naming'      // 10-30s preparation & collaborative team naming (voice off)
  | 'playing'     // active match, server timer, private team voice + chat, territory drawing
  | 'revealing'   // score-hidden appreciation / review (all artwork revealed together)
  | 'verdict'     // AI judging final results, awards, ranking
  | 'completed';

export interface Player {
  id: string;
  username: string;
  avatarUrl?: string;
  teamId?: string;
  isHost: boolean;
  isReady: boolean;
  isDone: boolean;
  territoryIndex?: number;
  // Audio state
  isMuted?: boolean;
  isDeafened?: boolean;
}

export interface TerritoryBoundary {
  playerIndex: number;
  label: string;
  // Polygons or wave boundaries defined normalized [0..1]
  points: { x: number; y: number }[];
  color: string;
}

export interface Team {
  id: string;
  name: string;
  color: string; // e.g. '#3b82f6'
  playerIds: string[];
  namingContributions: { [playerId: string]: string };
  isAllDone: boolean;
  finishedAt?: number;
  strokes: DrawStroke[];
  finalImageUri?: string;
}

export interface DrawPoint {
  x: number; // Normalized 0..1000
  y: number; // Normalized 0..1000
}

export interface DrawStroke {
  id: string;
  playerId: string;
  teamId: string;
  color: string;
  size: number;
  points: DrawPoint[];
  timestamp: number;
  sequence: number;
}

export interface Challenge {
  id: string;
  mode: GameMode;
  title: string;
  description: string;
  referenceImageUrl?: string;
  templateLineArtSvg?: string;
  durationSeconds: number; // e.g. 120s
}

export interface ScoreCategory {
  name: string;
  score: number; // 0..100
  weight: number; // Percentage, sum = 100
  feedback: string;
}

export interface TeamScoreResult {
  teamId: string;
  teamName: string;
  categories: {
    accuracy: ScoreCategory;      // 25%
    creativity: ScoreCategory;    // 20%
    cooperation: ScoreCategory;   // 20%
    completion: ScoreCategory;    // 15%
    cohesion: ScoreCategory;      // 10%
    efficiency: ScoreCategory;    // 10%
  };
  totalWeightedScore: number;
  awards: string[]; // e.g. "Most Creative", "Most Cooperative", "Most Accurate"
  verdictSummary: string;
}

export interface MatchTelemetry {
  teamId: string;
  playerId: string;
  validStrokesCount: number;
  rejectedStrokesCount: number;
  territoryViolationCount: number;
  timeSpentSeconds: number;
  completedEarly: boolean;
}

export interface MatchState {
  id: string;
  lobbyCode: string;
  mode: GameMode;
  phase: MatchPhase;
  hostId: string;
  isPublic: boolean;
  players: { [id: string]: Player };
  teams: { [id: string]: Team };
  territories: TerritoryBoundary[];
  challenge: Challenge;
  timeRemainingSeconds: number;
  namingTimeRemainingSeconds: number;
  revealTimeRemainingSeconds: number;
  results?: TeamScoreResult[];
  maxPlayers: number;
  telemetry: MatchTelemetry[];
}
