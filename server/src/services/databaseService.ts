import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from '../config.js';
import { MatchState, TeamScoreResult } from '../types/index.js';

let supabase: SupabaseClient | null = null;

if (CONFIG.SUPABASE_URL && (CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY)) {
  const key = CONFIG.SUPABASE_SERVICE_ROLE_KEY || CONFIG.SUPABASE_ANON_KEY;
  supabase = createClient(CONFIG.SUPABASE_URL, key);
}

export class DatabaseService {
  /**
   * Persist completed match data, teams, and verdicts to Supabase
   */
  static async persistMatchVerdict(match: MatchState, results: TeamScoreResult[]): Promise<void> {
    if (!supabase) {
      console.log(`[DatabaseService] Skipping Supabase persistence (client not configured)`);
      return;
    }

    try {
      // 1. Insert or update match
      await supabase.from('matches').upsert({
        id: match.id,
        lobby_code: match.lobbyCode,
        mode: match.mode,
        phase: match.phase,
        challenge_id: match.challenge.id,
        challenge_title: match.challenge.title,
        updated_at: new Date().toISOString()
      });

      // 2. Insert teams and results
      for (const res of results) {
        const team = match.teams[res.teamId];
        if (team) {
          await supabase.from('teams').upsert({
            id: team.id,
            match_id: match.id,
            name: team.name,
            color: team.color,
            player_ids: team.playerIds,
            total_score: res.totalWeightedScore,
            awards: res.awards,
            final_image_url: team.finalImageUri || null
          });

          await supabase.from('match_results').insert({
            match_id: match.id,
            team_id: team.id,
            weighted_score: res.totalWeightedScore,
            category_breakdown: res.categories,
            awards: res.awards,
            verdict_summary: res.verdictSummary,
            rubric_version: CONFIG.RUBRIC_VERSION
          });

          // Insert individual player match entries
          const highestScore = Math.max(...results.map(r => r.totalWeightedScore));
          const isWinner = res.totalWeightedScore === highestScore;

          for (const pid of team.playerIds) {
            await supabase.from('player_matches').insert({
              player_id: pid,
              match_id: match.id,
              team_id: team.id,
              team_name: team.name,
              score: res.totalWeightedScore,
              is_winner: isWinner,
              awards: res.awards
            });
          }
        }
      }

      console.log(`[DatabaseService] Successfully saved match ${match.id} results to Supabase.`);
    } catch (err: any) {
      console.error(`[DatabaseService] Error saving match verdict:`, err?.message || err);
    }
  }

  /**
   * Record player report for moderation (Phase 9)
   */
  static async submitReport(report: {
    reporterId: string;
    reportedPlayerId: string;
    matchId?: string;
    reason: string;
    details?: string;
  }): Promise<boolean> {
    if (!supabase) return true; // mock ok

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: report.reporterId,
        reported_player_id: report.reportedPlayerId,
        match_id: report.matchId || null,
        reason: report.reason,
        details: report.details || null,
        status: 'pending'
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Record security/gameplay audit log (Phase 9 & 10)
   */
  static async logAudit(eventType: string, actorId?: string, payload?: any, ipAddress?: string): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('audit_logs').insert({
        event_type: eventType,
        actor_id: actorId || null,
        payload: payload || null,
        ip_address: ipAddress || null
      });
    } catch {
      // Non-blocking
    }
  }

  /**
   * Get leaderboards and player stats (Phase 8)
   */
  static async getLeaderboard(): Promise<any[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('player_matches')
        .select('player_id, score, is_winner, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data) return [];

      // Aggregate stats per player
      const statsMap = new Map<string, { playerId: string; matches: number; wins: number; totalScore: number }>();
      for (const row of data) {
        const curr = statsMap.get(row.player_id) || {
          playerId: row.player_id,
          matches: 0,
          wins: 0,
          totalScore: 0
        };
        curr.matches += 1;
        if (row.is_winner) curr.wins += 1;
        curr.totalScore += Number(row.score) || 0;
        statsMap.set(row.player_id, curr);
      }

      return Array.from(statsMap.values())
        .map(s => ({
          ...s,
          avgScore: Math.round(s.totalScore / Math.max(1, s.matches)),
          winRate: Math.round((s.wins / Math.max(1, s.matches)) * 100)
        }))
        .sort((a, b) => b.wins - a.wins || b.avgScore - a.avgScore)
        .slice(0, 20);
    } catch {
      return [];
    }
  }

  /**
   * Get user profile match history
   */
  static async getPlayerHistory(playerId: string): Promise<any[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('player_matches')
        .select('*')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(20);

      return error ? [] : data || [];
    } catch {
      return [];
    }
  }
}
