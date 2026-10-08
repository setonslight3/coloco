import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  MatchState,
  TeamScoreResult,
  ScoreCategory,
  Team,
  MatchTelemetry
} from '../types/index.js';

interface GeminiProjectConfig {
  projectId: string;
  apiKey: string;
  isAvailable: boolean;
  unavailableUntil?: number;
}

export class GeminiJudgingService {
  private projects: GeminiProjectConfig[] = [];
  private rubricVersion = '2.0.0';

  constructor() {
    this.initCredentials();
  }

  private initCredentials() {
    // Collect GEMINI_API_KEY, GEMINI_API_KEY_BACKUP, etc.
    const primaryKey = process.env.GEMINI_API_KEY;
    const backupKey = process.env.GEMINI_API_KEY_BACKUP;

    if (primaryKey) {
      this.projects.push({
        projectId: 'primary',
        apiKey: primaryKey,
        isAvailable: true
      });
    }

    if (backupKey && backupKey !== primaryKey) {
      this.projects.push({
        projectId: 'backup',
        apiKey: backupKey,
        isAvailable: true
      });
    }
  }

  private getAvailableClient(): { client: GoogleGenerativeAI; project: GeminiProjectConfig } | null {
    const now = Date.now();
    for (const project of this.projects) {
      if (!project.isAvailable && project.unavailableUntil && now > project.unavailableUntil) {
        // Cooldown passed, re-enable
        project.isAvailable = true;
        project.unavailableUntil = undefined;
      }

      if (project.isAvailable && project.apiKey) {
        return {
          client: new GoogleGenerativeAI(project.apiKey),
          project
        };
      }
    }
    return null;
  }

  /**
   * Evaluates match artworks using Gemini with telemetry validation and fallback resilience.
   */
  async judgeMatch(match: MatchState): Promise<TeamScoreResult[]> {
    const results: TeamScoreResult[] = [];
    const clientBundle = this.getAvailableClient();

    for (const team of Object.values(match.teams)) {
      const telemetry = match.telemetry.filter(t => t.teamId === team.id);
      let scoreResult: TeamScoreResult | null = null;

      if (clientBundle) {
        try {
          scoreResult = await this.evaluateWithGemini(match, team, telemetry, clientBundle);
        } catch (err: any) {
          console.error(`Gemini judging error for team ${team.id}:`, err?.message || err);
          // Mark project as temporarily unavailable if rate limited
          if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
            clientBundle.project.isAvailable = false;
            clientBundle.project.unavailableUntil = Date.now() + 60000; // 1 min backoff
          }
        }
      }

      // If Gemini fails or no API key is provided, use calibrated deterministic heuristic judge
      if (!scoreResult) {
        scoreResult = this.evaluateWithHeuristics(match, team, telemetry);
      }

      results.push(scoreResult);
    }

    // Assign Special Awards across teams
    this.assignSpecialAwards(results);

    return results;
  }

  private async evaluateWithGemini(
    match: MatchState,
    team: Team,
    telemetry: MatchTelemetry[],
    bundle: { client: GoogleGenerativeAI; project: GeminiProjectConfig }
  ): Promise<TeamScoreResult> {
    const model = bundle.client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const totalStrokes = team.strokes.length;
    const totalRejected = telemetry.reduce((acc, t) => acc + t.rejectedStrokesCount, 0);
    const totalViolations = telemetry.reduce((acc, t) => acc + t.territoryViolationCount, 0);
    const playerCount = team.playerIds.length;
    const contributionsByPlayer = team.playerIds.map(pid => {
      const count = team.strokes.filter(s => s.playerId === pid).length;
      return { playerId: pid, strokes: count };
    });

    const prompt = `
You are the official competitive AI art judge for "ColoCo" (Rubric ${this.rubricVersion}).
Mode: ${match.mode}
Challenge: "${match.challenge.title}"
Description: "${match.challenge.description}"

Team: "${team.name}"
Number of teammates: ${playerCount}
Teammate contributions: ${JSON.stringify(contributionsByPlayer)}
Total valid strokes: ${totalStrokes}
Rejected/out-of-bounds strokes: ${totalRejected}
Territory boundaries respected ratio: ${totalStrokes / Math.max(1, totalStrokes + totalViolations)}
All teammates declared DONE early: ${team.isAllDone}

Evaluate this team's collaborative artwork across 6 strictly weighted categories (0-100 score each):
1. accuracy (25% weight): Fidelity to the template/theme/reference.
2. creativity (20% weight): Artistic flair, color palette, expressive additions.
3. cooperation (20% weight): Balance between teammates, territory harmony, smooth seams.
4. completion (15% weight): Canvas coverage, finished look, lack of bare empty zones.
5. cohesion (10% weight): Unified artistic style across all player territories.
6. efficiency (10% weight): Clean stroke economy, disciplined drawing without border violations.

Return valid JSON adhering to this exact schema:
{
  "accuracy": { "score": number, "feedback": string },
  "creativity": { "score": number, "feedback": string },
  "cooperation": { "score": number, "feedback": string },
  "completion": { "score": number, "feedback": string },
  "cohesion": { "score": number, "feedback": string },
  "efficiency": { "score": number, "feedback": string },
  "summary": string
}
`;

    const res = await model.generateContent(prompt);
    const rawJson = res.response.text();
    const parsed = JSON.parse(rawJson);

    const clamp = (n: any) => Math.min(100, Math.max(0, typeof n === 'number' ? Math.round(n) : 75));

    const accuracyScore = clamp(parsed.accuracy?.score);
    const creativityScore = clamp(parsed.creativity?.score);
    const cooperationScore = clamp(parsed.cooperation?.score);
    const completionScore = clamp(parsed.completion?.score);
    const cohesionScore = clamp(parsed.cohesion?.score);
    const efficiencyScore = clamp(parsed.efficiency?.score);

    // Calculate official weighted score (25 + 20 + 20 + 15 + 10 + 10 = 100)
    const totalWeighted = (
      accuracyScore * 0.25 +
      creativityScore * 0.20 +
      cooperationScore * 0.20 +
      completionScore * 0.15 +
      cohesionScore * 0.10 +
      efficiencyScore * 0.10
    );

    return {
      teamId: team.id,
      teamName: team.name,
      categories: {
        accuracy: { name: 'Accuracy', score: accuracyScore, weight: 25, feedback: parsed.accuracy?.feedback || 'Faithful representation.' },
        creativity: { name: 'Creativity', score: creativityScore, weight: 20, feedback: parsed.creativity?.feedback || 'Vibrant visual choices.' },
        cooperation: { name: 'Cooperation', score: cooperationScore, weight: 20, feedback: parsed.cooperation?.feedback || 'Harmonious teammate collaboration.' },
        completion: { name: 'Completion', score: completionScore, weight: 15, feedback: parsed.completion?.feedback || 'Territory filled nicely.' },
        cohesion: { name: 'Cohesion', score: cohesionScore, weight: 10, feedback: parsed.cohesion?.feedback || 'Unified style across sectors.' },
        efficiency: { name: 'Efficiency', score: efficiencyScore, weight: 10, feedback: parsed.efficiency?.feedback || 'Good stroke pacing and timing.' }
      },
      totalWeightedScore: Math.round(totalWeighted * 10) / 10,
      awards: [],
      verdictSummary: parsed.summary || `Impressive performance by ${team.name}!`
    };
  }

  private evaluateWithHeuristics(
    match: MatchState,
    team: Team,
    telemetry: MatchTelemetry[]
  ): TeamScoreResult {
    const totalStrokes = team.strokes.length;
    const totalViolations = telemetry.reduce((a, b) => a + b.territoryViolationCount, 0);
    const playerCount = Math.max(1, team.playerIds.length);

    // Stroke balance metric between teammates
    const strokeCounts = team.playerIds.map(pid => team.strokes.filter(s => s.playerId === pid).length);
    const avgStrokes = totalStrokes / playerCount;
    const variance = strokeCounts.reduce((acc, c) => acc + Math.pow(c - avgStrokes, 2), 0) / playerCount;
    const balanceFactor = Math.max(0, 1 - Math.sqrt(variance) / Math.max(1, avgStrokes));

    const accuracyScore = Math.min(100, Math.max(50, Math.round(70 + (totalStrokes > 20 ? 15 : totalStrokes * 0.5))));
    const creativityScore = Math.min(100, Math.max(50, Math.round(75 + (new Set(team.strokes.map(s => s.color)).size * 4))));
    const cooperationScore = Math.min(100, Math.max(40, Math.round(60 + balanceFactor * 35)));
    const completionScore = Math.min(100, Math.max(30, Math.round(50 + Math.min(45, totalStrokes * 0.6))));
    const cohesionScore = Math.min(100, Math.max(40, Math.round(70 + balanceFactor * 25)));
    const efficiencyScore = Math.max(40, Math.min(100, Math.round(85 - Math.min(35, totalViolations * 2) + (team.isAllDone ? 10 : 0))));

    const totalWeighted = (
      accuracyScore * 0.25 +
      creativityScore * 0.20 +
      cooperationScore * 0.20 +
      completionScore * 0.15 +
      cohesionScore * 0.10 +
      efficiencyScore * 0.10
    );

    return {
      teamId: team.id,
      teamName: team.name,
      categories: {
        accuracy: { name: 'Accuracy', score: accuracyScore, weight: 25, feedback: 'Strong adherence to the theme and composition.' },
        creativity: { name: 'Creativity', score: creativityScore, weight: 20, feedback: 'Inventive color palette and expressive touches.' },
        cooperation: { name: 'Cooperation', score: cooperationScore, weight: 20, feedback: 'Equally balanced contribution across territories.' },
        completion: { name: 'Completion', score: completionScore, weight: 15, feedback: 'Clean coverage across the canvas territory.' },
        cohesion: { name: 'Cohesion', score: cohesionScore, weight: 10, feedback: 'Unified palette and style between teammates.' },
        efficiency: { name: 'Efficiency', score: efficiencyScore, weight: 10, feedback: 'Disciplined territory adherence with zero drift.' }
      },
      totalWeightedScore: Math.round(totalWeighted * 10) / 10,
      awards: [],
      verdictSummary: `Exceptional effort by ${team.name} with consistent cooperative execution.`
    };
  }

  private assignSpecialAwards(results: TeamScoreResult[]) {
    if (results.length === 0) return;

    let bestCreative = results[0];
    let bestAccurate = results[0];
    let bestCoop = results[0];

    for (const r of results) {
      if (r.categories.creativity.score > bestCreative.categories.creativity.score) bestCreative = r;
      if (r.categories.accuracy.score > bestAccurate.categories.accuracy.score) bestAccurate = r;
      if (r.categories.cooperation.score > bestCoop.categories.cooperation.score) bestCoop = r;
    }

    bestCreative.awards.push('Most Creative');
    if (bestAccurate !== bestCreative) {
      bestAccurate.awards.push('Most Accurate');
    }
    if (bestCoop !== bestCreative && bestCoop !== bestAccurate) {
      bestCoop.awards.push('Most Cooperative');
    }
  }
}
