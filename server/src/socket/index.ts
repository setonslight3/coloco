import { Server, Socket } from 'socket.io';
import { MatchManager } from '../game/matchManager.js';
import { GeminiJudgingService } from '../services/geminiJudge.js';
import { DatabaseService } from '../services/databaseService.js';
import { DrawStroke, GameMode, MatchState } from '../types/index.js';
import { generateTerritoryBoundaries } from '../game/territory.js';

export function setupSocketHandlers(io: Server, matchManager: MatchManager, judgeService: GeminiJudgingService) {
  // Map socket ID to player & match info
  const socketPlayerMap = new Map<string, { playerId: string; matchId: string; teamId?: string }>();

  io.on('connection', (socket: Socket) => {
    // -------------------------------------------------------------
    // LOBBY EVENTS
    // -------------------------------------------------------------
    socket.on('lobby:create', ({ playerId, username, mode, isPublic, challengeId }: { playerId: string; username: string; mode?: GameMode; isPublic?: boolean; challengeId?: string }) => {
      const match = matchManager.createMatch(playerId, username, mode || 'coloring', isPublic ?? true, challengeId);
      socketPlayerMap.set(socket.id, { playerId, matchId: match.id });
      socket.join(match.id);
      socket.emit('match:state', match);
      io.emit('lobby:list_updated', matchManager.getPublicLobbies());
    });

    socket.on('game:join', ({ matchId, playerId, username }: { matchId: string; playerId: string; username?: string }) => {
      if (!matchId || !playerId) return;
      const match = matchManager.getMatch(matchId);
      if (!match) return;

      // 1. Ensure player exists in match.players:
      let player = match.players[playerId];
      if (!player) {
        player = {
          id: playerId,
          username: username || `Painter_${playerId.substring(0, 4)}`,
          isHost: match.hostId === playerId,
          isReady: true,
          isDone: false
        };
        match.players[playerId] = player;
      }

      // 2. Ensure player has a team assigned:
      if (!player.teamId) {
        if (match.mode === 'cooperative') {
          if (!match.teams.coop_team) {
            match.teams.coop_team = {
              id: 'coop_team',
              name: 'Co-op Canvas',
              color: '#38bdf8',
              playerIds: [],
              namingContributions: {},
              isAllDone: false,
              strokes: []
            };
          }
          player.teamId = 'coop_team';
          if (!match.teams.coop_team.playerIds.includes(playerId)) {
            match.teams.coop_team.playerIds.push(playerId);
          }
          player.territoryIndex = match.teams.coop_team.playerIds.indexOf(playerId);
        } else {
          // Competitive: assign to smaller team
          const team1 = match.teams.team1;
          const team2 = match.teams.team2;
          const t1Count = team1?.playerIds.length || 0;
          const t2Count = team2?.playerIds.length || 0;
          const chosenTeamId = t2Count < t1Count && team2 ? 'team2' : 'team1';
          player.teamId = chosenTeamId;
          if (match.teams[chosenTeamId]) {
            if (!match.teams[chosenTeamId].playerIds.includes(playerId)) {
              match.teams[chosenTeamId].playerIds.push(playerId);
            }
            player.territoryIndex = match.teams[chosenTeamId].playerIds.indexOf(playerId);
          }
        }
      }

      // 3. Ensure territory boundaries exist
      if (!match.territories || match.territories.length === 0) {
        const totalInTeam = player.teamId && match.teams[player.teamId] ? match.teams[player.teamId].playerIds.length : 2;
        match.territories = generateTerritoryBoundaries(Math.max(2, totalInTeam));
      }

      const teamId = player.teamId;
      socketPlayerMap.set(socket.id, { playerId, matchId, teamId });
      socket.join(matchId);
      if (teamId) {
        socket.join(`${matchId}:${teamId}`);
      }

      socket.emit('match:state', match);
      io.to(matchId).emit('match:state', match);
    });

    socket.on('lobby:get_public', () => {
      socket.emit('lobby:list', matchManager.getPublicLobbies());
    });

    socket.on('lobby:join', ({ playerId, username, lobbyCode, matchId }: { playerId: string; username: string; lobbyCode?: string; matchId?: string }) => {
      let match = matchId ? matchManager.getMatch(matchId) : undefined;
      if (!match && lobbyCode) {
        match = matchManager.getMatchByCode(lobbyCode);
      }
      if (!match) {
        socket.emit('error:message', { message: lobbyCode ? `Lobby code "${lobbyCode}" not found.` : 'Lobby not found.' });
        return;
      }

      const updated = matchManager.joinMatch(match.id, { id: playerId, username });
      if (!updated) {
        socket.emit('error:message', { message: 'Cannot join lobby (match in progress or full).' });
        return;
      }

      socketPlayerMap.set(socket.id, { playerId, matchId: match.id });
      socket.join(match.id);
      io.to(match.id).emit('match:state', updated);
      io.emit('lobby:list_updated', matchManager.getPublicLobbies());
    });

    socket.on('lobby:ready', (data: { isReady: boolean; playerId?: string; matchId?: string; username?: string }) => {
      let info = socketPlayerMap.get(socket.id);
      const matchId = data?.matchId || info?.matchId;
      const playerId = data?.playerId || info?.playerId;
      if (!matchId || !playerId) return;

      socketPlayerMap.set(socket.id, { playerId, matchId });
      socket.join(matchId);

      const match = matchManager.getMatch(matchId);
      if (match && match.phase === 'lobby') {
        if (!match.players[playerId]) {
          match.players[playerId] = {
            id: playerId,
            username: data.username || 'Painter',
            isHost: match.hostId === playerId,
            isReady: data.isReady,
            isDone: false
          };
        }
      }

      const updated = matchManager.setPlayerReady(matchId, playerId, data.isReady);
      if (updated) {
        io.to(matchId).emit('match:state', updated);
      }
    });

    socket.on('lobby:change_mode', ({ mode, matchId: clientMatchId, playerId: clientPlayerId }: { mode: GameMode; matchId?: string; playerId?: string }) => {
      const info = socketPlayerMap.get(socket.id);
      const matchId = clientMatchId || info?.matchId;
      const playerId = clientPlayerId || info?.playerId;
      if (!matchId || !playerId) return;

      socketPlayerMap.set(socket.id, { playerId, matchId });
      socket.join(matchId);

      const updated = matchManager.setGameMode(matchId, playerId, mode);
      if (updated) {
        io.to(matchId).emit('match:state', updated);
      }
    });

    socket.on('lobby:leave', (payload?: { matchId?: string; playerId?: string }) => {
      const info = socketPlayerMap.get(socket.id);
      const matchId = payload?.matchId || info?.matchId;
      const playerId = payload?.playerId || info?.playerId;
      if (!matchId || !playerId) return;

      const { match, deleted } = matchManager.leaveMatch(matchId, playerId);
      socket.leave(matchId);
      socketPlayerMap.delete(socket.id);

      socket.emit('match:left');

      if (!deleted && match) {
        io.to(match.id).emit('match:state', match);
      }
      io.emit('lobby:list_updated', matchManager.getPublicLobbies());
    });

    socket.on('lobby:update_settings', (settings: any) => {
      const info = socketPlayerMap.get(socket.id);
      const matchId = settings?.matchId || info?.matchId;
      const playerId = settings?.playerId || info?.playerId;
      if (!matchId || !playerId) return;

      socketPlayerMap.set(socket.id, { playerId, matchId });
      socket.join(matchId);

      const updated = matchManager.updateLobbySettings(matchId, playerId, settings);
      if (updated) {
        io.to(matchId).emit('match:state', updated);
        io.emit('lobby:list_updated', matchManager.getPublicLobbies());
      }
    });

    socket.on('lobby:start', (payload?: { matchId?: string; playerId?: string }) => {
      const info = socketPlayerMap.get(socket.id);
      const matchId = payload?.matchId || info?.matchId;
      const playerId = payload?.playerId || info?.playerId;
      if (!matchId || !playerId) return;

      socketPlayerMap.set(socket.id, { playerId, matchId });
      socket.join(matchId);

      const onTick = (m: MatchState) => {
        io.to(m.id).emit('match:tick', {
          phase: m.phase,
          timeRemainingSeconds: m.timeRemainingSeconds,
          namingTimeRemainingSeconds: m.namingTimeRemainingSeconds,
          revealTimeRemainingSeconds: m.revealTimeRemainingSeconds
        });
      };

      const onPhaseChange = async (m: MatchState) => {
        // Associate socket rooms with teams
        for (const [sockId, sInfo] of socketPlayerMap.entries()) {
          if (sInfo.matchId === m.id) {
            const player = m.players[sInfo.playerId];
            if (player?.teamId) {
              sInfo.teamId = player.teamId;
              const sock = io.sockets.sockets.get(sockId);
              if (sock) {
                // Team-scoped room for voice and canvas events
                sock.join(`${m.id}:${player.teamId}`);
              }
            }
          }
        }

        if (m.phase === 'verdict') {
          // Perform server-side AI judging
          const results = await judgeService.judgeMatch(m);
          m.results = results;
          io.to(m.id).emit('match:verdict', { results });

          // Persist match results, stats, and audit log to Supabase (Phase 6, 7 & 8)
          await DatabaseService.persistMatchVerdict(m, results);
          await DatabaseService.logAudit('match_completed', m.hostId, {
            matchId: m.id,
            mode: m.mode,
            challenge: m.challenge.id,
            teamsCount: Object.keys(m.teams).length,
            playersCount: Object.keys(m.players).length
          });
        }

        io.to(m.id).emit('match:state', m);
      };

      const match = matchManager.startMatch(matchId, playerId, onTick, onPhaseChange);
      if (match) {
        io.to(match.id).emit('match:state', match);
      }
    });

    // -------------------------------------------------------------
    // NAMING PHASE
    // -------------------------------------------------------------
    socket.on('naming:submit_word', ({ word }: { word: string }) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const updatedTeam = matchManager.submitNamingWord(info.matchId, info.playerId, word);
      if (updatedTeam) {
        // Broadcast to teammates in this team room
        io.to(`${info.matchId}:${updatedTeam.id}`).emit('team:naming_updated', {
          teamId: updatedTeam.id,
          contributions: updatedTeam.namingContributions
        });
      }
    });

    // -------------------------------------------------------------
    // CANVAS & DRAWING (Strict Teammate Isolation)
    // -------------------------------------------------------------
    socket.on('canvas:draw_stroke', (stroke: DrawStroke) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const match = matchManager.getMatch(info.matchId);
      if (!match || match.phase !== 'playing') return;

      const { stroke: validatedStroke, rejectedCount } = matchManager.addStroke(info.matchId, {
        ...stroke,
        playerId: info.playerId
      });

      if (rejectedCount > 0) {
        socket.emit('canvas:territory_rejected', { rejectedCount });
      }

      if (validatedStroke) {
        // CRITICAL INVARIANT: Broadcast ONLY to teammates! Never to opponents!
        io.to(`${info.matchId}:${validatedStroke.teamId}`).emit('canvas:stroke', validatedStroke);
      }
    });

    // -------------------------------------------------------------
    // PLAYER DONE STATUS
    // -------------------------------------------------------------
    socket.on('player:done', () => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const res = matchManager.setPlayerDone(info.matchId, info.playerId);
      if (res) {
        io.to(info.matchId).emit('player:done_status', {
          playerId: res.player.id,
          teamId: res.team.id,
          isTeamAllDone: res.team.isAllDone
        });
      }
    });

    // -------------------------------------------------------------
    // PRIVATE TEAM TEXT CHAT
    // -------------------------------------------------------------
    socket.on('chat:message', ({ text }: { text: string }) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const match = matchManager.getMatch(info.matchId);
      if (!match || !info.teamId) return;

      const player = match.players[info.playerId];
      const chatPayload = {
        senderId: info.playerId,
        senderName: player?.username || 'Teammate',
        text: text.substring(0, 300),
        timestamp: Date.now()
      };

      // Broadcast exclusively to teammates
      io.to(`${info.matchId}:${info.teamId}`).emit('chat:message', chatPayload);
    });

    // -------------------------------------------------------------
    // WEBRTC PRIVATE TEAM VOICE SIGNALING
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // CANVAS CLEAR TERRITORY (With player/team synchronization)
    // -------------------------------------------------------------
    socket.on('canvas:clear_territory', (data?: { matchId?: string; playerId?: string; teamId?: string }) => {
      const info = socketPlayerMap.get(socket.id);
      const matchId = data?.matchId || info?.matchId;
      const playerId = data?.playerId || info?.playerId;
      if (!matchId || !playerId) return;

      const match = matchManager.getMatch(matchId);
      if (!match || match.phase !== 'playing') return;

      const player = match.players[playerId];
      const teamId = data?.teamId || info?.teamId || player?.teamId;
      if (!teamId || !match.teams[teamId]) return;

      const team = match.teams[teamId];
      team.strokes = team.strokes.filter(s => s.playerId !== playerId);

      io.to(`${matchId}:${teamId}`).emit('canvas:territory_cleared', {
        playerId,
        teamId,
        strokes: team.strokes
      });
    });

    // -------------------------------------------------------------
    // WEBRTC PRIVATE TEAM VOICE SIGNALING
    // -------------------------------------------------------------
    socket.on('voice:signal', ({ targetPlayerId, signal, matchId, senderPlayerId: clientSenderId }: { targetPlayerId: string; signal: any; matchId?: string; senderPlayerId?: string }) => {
      const senderInfo = socketPlayerMap.get(socket.id);
      const effectiveMatchId = matchId || senderInfo?.matchId;
      if (!effectiveMatchId) return;

      const match = matchManager.getMatch(effectiveMatchId);
      if (!match || match.phase === 'naming' || match.phase === 'lobby') return;

      const senderPlayerId = clientSenderId || senderInfo?.playerId;
      if (!senderPlayerId) return;

      const senderPlayer = match.players[senderPlayerId];
      const senderTeamId = senderInfo?.teamId || senderPlayer?.teamId;

      // Find target socket in this match
      for (const [targetSockId, tInfo] of socketPlayerMap.entries()) {
        if (tInfo.matchId === effectiveMatchId && tInfo.playerId === targetPlayerId) {
          const targetPlayer = match.players[tInfo.playerId];
          const targetTeamId = tInfo.teamId || targetPlayer?.teamId;
          // In cooperative mode or matching team, forward signal
          if (match.mode === 'cooperative' || !senderTeamId || !targetTeamId || senderTeamId === targetTeamId) {
            io.to(targetSockId).emit('voice:signal', {
              senderPlayerId,
              signal
            });
            break;
          }
        }
      }
    });

    socket.on('voice:state', ({ isMuted, isDeafened, matchId }: { isMuted: boolean; isDeafened: boolean; matchId?: string }) => {
      const info = socketPlayerMap.get(socket.id);
      const effectiveMatchId = matchId || info?.matchId;
      if (!effectiveMatchId) return;

      const match = matchManager.getMatch(effectiveMatchId);
      if (!match) return;

      const player = info ? match.players[info.playerId] : null;
      const teamId = info?.teamId || player?.teamId;
      const playerId = info?.playerId || player?.id;
      if (!teamId || !playerId) return;

      io.to(`${effectiveMatchId}:${teamId}`).emit('voice:state_change', {
        playerId,
        isMuted,
        isDeafened
      });
    });

    // -------------------------------------------------------------
    // MODERATION & REPORTS (Phase 9)
    // -------------------------------------------------------------
    socket.on('report:submit', async (report: { reportedPlayerId: string; reason: string; details?: string }) => {
      const info = socketPlayerMap.get(socket.id);
      const reporterId = info?.playerId || 'anonymous';
      const success = await DatabaseService.submitReport({
        reporterId,
        reportedPlayerId: report.reportedPlayerId,
        matchId: info?.matchId,
        reason: report.reason,
        details: report.details
      });
      socket.emit('report:result', { success });
      await DatabaseService.logAudit('report_filed', reporterId, {
        reported: report.reportedPlayerId,
        reason: report.reason
      });
    });

    // -------------------------------------------------------------
    // LEADERBOARD & STATS (Phase 8)
    // -------------------------------------------------------------
    socket.on('stats:get_leaderboard', async () => {
      const leaderboard = await DatabaseService.getLeaderboard();
      socket.emit('stats:leaderboard', { leaderboard });
    });

    socket.on('stats:get_history', async ({ playerId }: { playerId: string }) => {
      const history = await DatabaseService.getPlayerHistory(playerId);
      socket.emit('stats:history', { history });
    });

    // -------------------------------------------------------------
    // DISCONNECT (with grace period for lobby transport upgrades)
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      const info = socketPlayerMap.get(socket.id);
      if (info) {
        socketPlayerMap.delete(socket.id);
        const { playerId, matchId } = info;

        // Grace period before removing from lobby so transient reconnections don't drop the player
        setTimeout(() => {
          let hasReconnected = false;
          for (const mapped of socketPlayerMap.values()) {
            if (mapped.playerId === playerId && mapped.matchId === matchId) {
              hasReconnected = true;
              break;
            }
          }
          if (!hasReconnected) {
            const match = matchManager.getMatch(matchId);
            if (match && match.phase === 'lobby') {
              matchManager.leaveMatch(matchId, playerId);
              io.to(match.id).emit('match:state', match);
              io.emit('lobby:list_updated', matchManager.getPublicLobbies());
            }
          }
        }, 10000);
      }
    });
  });
}
