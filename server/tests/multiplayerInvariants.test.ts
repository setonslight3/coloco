import { describe, it, expect } from 'vitest';
import { isPointInTerritory, validateStrokeTerritory, generateTerritoryBoundaries } from '../src/game/territory.js';
import { MatchManager } from '../src/game/matchManager.js';
import { GeminiJudgingService } from '../src/services/geminiJudge.js';

describe('ColoCo Multiplayer Invariants & Security Rules', () => {

  describe('Territory Boundary & Invariant Validation', () => {
    it('should generate valid polygons for 2-player team partitions', () => {
      const territories = generateTerritoryBoundaries(2);
      expect(territories).toHaveLength(2);
      expect(territories[0].points.length).toBeGreaterThan(10);
      expect(territories[1].points.length).toBeGreaterThan(10);
    });

    it('should correctly isolate player 0 territory (left) and player 1 territory (right)', () => {
      // Left side point (x=100, y=500)
      expect(isPointInTerritory({ x: 100, y: 500 }, 0, 2)).toBe(true);
      expect(isPointInTerritory({ x: 100, y: 500 }, 1, 2)).toBe(false);

      // Right side point (x=900, y=500)
      expect(isPointInTerritory({ x: 900, y: 500 }, 1, 2)).toBe(true);
      expect(isPointInTerritory({ x: 900, y: 500 }, 0, 2)).toBe(false);
    });

    it('should reject out-of-bounds strokes and count territory violations', () => {
      const strokePoints = [
        { x: 100, y: 500 }, // valid for player 0
        { x: 800, y: 500 }, // invalid for player 0 (in player 1 territory)
        { x: 150, y: 500 }  // valid for player 0
      ];

      const res = validateStrokeTerritory(strokePoints, 0, 2);
      expect(res.validPoints).toHaveLength(2);
      expect(res.rejectedCount).toBe(1);
      expect(res.validPoints[0]).toEqual({ x: 100, y: 500 });
      expect(res.validPoints[1]).toEqual({ x: 150, y: 500 });
    });
  });

  describe('Matchmaking & Anti-Stacking Invariants', () => {
    it('should enforce random equal-sized team distribution and prevent manual host stacking', () => {
      const mm = new MatchManager();
      const match = mm.createMatch('host-1', 'HostPlayer', 'coloring');

      mm.joinMatch(match.id, { id: 'p2', username: 'Player 2' });
      mm.joinMatch(match.id, { id: 'p3', username: 'Player 3' });
      mm.joinMatch(match.id, { id: 'p4', username: 'Player 4' });

      expect(Object.keys(match.players)).toHaveLength(4);

      const started = mm.startMatch(match.id, 'host-1', () => {}, () => {});
      expect(started).not.toBeNull();
      expect(started?.phase).toBe('naming');

      // Check teams are equal size
      expect(started?.teams.team1.playerIds).toHaveLength(2);
      expect(started?.teams.team2.playerIds).toHaveLength(2);

      // Check each player has territory index
      for (const p of Object.values(started!.players)) {
        expect(p.teamId).toBeDefined();
        expect(p.territoryIndex).toBeDefined();
      }
    });

    it('should lock only the individual player territory when DONE is clicked', () => {
      const mm = new MatchManager();
      const match = mm.createMatch('host-1', 'HostPlayer', 'coloring');
      mm.joinMatch(match.id, { id: 'p2', username: 'Player 2' });
      mm.startMatch(match.id, 'host-1', () => {}, () => {});

      match.phase = 'playing';

      const res = mm.setPlayerDone(match.id, 'host-1');
      expect(res?.player.isDone).toBe(true);
      expect(match.players['host-1'].isDone).toBe(true);

      // Teammate is not done
      const teammateId = match.teams[match.players['host-1'].teamId!].playerIds.find(id => id !== 'host-1');
      if (teammateId) {
        expect(match.players[teammateId].isDone).toBe(false);
      }
    });
  });

  describe('Judging & Rubric Scoring Weight Invariants', () => {
    it('should sum category weights exactly to 100% (25/20/20/15/10/10)', async () => {
      const mm = new MatchManager();
      const match = mm.createMatch('host-1', 'HostPlayer', 'coloring');
      mm.joinMatch(match.id, { id: 'p2', username: 'Player 2' });
      mm.startMatch(match.id, 'host-1', () => {}, () => {});

      const judge = new GeminiJudgingService();
      const results = await judge.judgeMatch(match);

      expect(results.length).toBeGreaterThan(0);
      const teamResult = results[0];

      const weights = [
        teamResult.categories.accuracy.weight,
        teamResult.categories.creativity.weight,
        teamResult.categories.cooperation.weight,
        teamResult.categories.completion.weight,
        teamResult.categories.cohesion.weight,
        teamResult.categories.efficiency.weight
      ];

      const totalWeight = weights.reduce((a, b) => a + b, 0);
      expect(totalWeight).toBe(100);

      expect(teamResult.categories.accuracy.weight).toBe(25);
      expect(teamResult.categories.creativity.weight).toBe(20);
      expect(teamResult.categories.cooperation.weight).toBe(20);
      expect(teamResult.categories.completion.weight).toBe(15);
      expect(teamResult.categories.cohesion.weight).toBe(10);
      expect(teamResult.categories.efficiency.weight).toBe(10);

      expect(teamResult.totalWeightedScore).toBeGreaterThanOrEqual(0);
      expect(teamResult.totalWeightedScore).toBeLessThanOrEqual(100);
    });
  });

});
