import { Server, Socket } from 'socket.io';
import { MatchManager } from '../game/matchManager.js';
import { GeminiJudgingService } from '../services/geminiJudge.js';
import { DrawStroke, GameMode, MatchState } from '../types/index.js';

export function setupSocketHandlers(io: Server, matchManager: MatchManager, judgeService: GeminiJudgingService) {
  // Map socket ID to player & match info
  const socketPlayerMap = new Map<string, { playerId: string; matchId: string; teamId?: string }>();

  io.on('connection', (socket: Socket) => {
    // -------------------------------------------------------------
    // LOBBY EVENTS
    // -------------------------------------------------------------
    socket.on('lobby:create', ({ playerId, username, mode }: { playerId: string; username: string; mode?: GameMode }) => {
      const match = matchManager.createMatch(playerId, username, mode || 'coloring');
      socketPlayerMap.set(socket.id, { playerId, matchId: match.id });
      socket.join(match.id);
      socket.emit('match:state', match);
    });

    socket.on('lobby:join', ({ playerId, username, lobbyCode }: { playerId: string; username: string; lobbyCode: string }) => {
      const match = matchManager.getMatchByCode(lobbyCode);
      if (!match) {
        socket.emit('error:message', { message: `Lobby code "${lobbyCode}" not found.` });
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
    });

    socket.on('lobby:ready', ({ isReady }: { isReady: boolean }) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const updated = matchManager.setPlayerReady(info.matchId, info.playerId, isReady);
      if (updated) {
        io.to(info.matchId).emit('match:state', updated);
      }
    });

    socket.on('lobby:change_mode', ({ mode }: { mode: GameMode }) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const updated = matchManager.setGameMode(info.matchId, info.playerId, mode);
      if (updated) {
        io.to(info.matchId).emit('match:state', updated);
      }
    });

    socket.on('lobby:update_settings', (settings: any) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

      const updated = matchManager.updateLobbySettings(info.matchId, info.playerId, settings);
      if (updated) {
        io.to(info.matchId).emit('match:state', updated);
      }
    });

    socket.on('lobby:start', () => {
      const info = socketPlayerMap.get(socket.id);
      if (!info) return;

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
        }

        io.to(m.id).emit('match:state', m);
      };

      const match = matchManager.startMatch(info.matchId, info.playerId, onTick, onPhaseChange);
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
    socket.on('voice:signal', ({ targetPlayerId, signal }: { targetPlayerId: string; signal: any }) => {
      const senderInfo = socketPlayerMap.get(socket.id);
      if (!senderInfo || !senderInfo.teamId) return;

      const match = matchManager.getMatch(senderInfo.matchId);
      // Voice is strictly disabled during naming phase!
      if (!match || match.phase === 'naming' || match.phase === 'lobby') return;

      // Find target socket
      for (const [targetSockId, tInfo] of socketPlayerMap.entries()) {
        if (
          tInfo.matchId === senderInfo.matchId &&
          tInfo.teamId === senderInfo.teamId &&
          tInfo.playerId === targetPlayerId
        ) {
          io.to(targetSockId).emit('voice:signal', {
            senderPlayerId: senderInfo.playerId,
            signal
          });
          break;
        }
      }
    });

    socket.on('voice:state', ({ isMuted, isDeafened }: { isMuted: boolean; isDeafened: boolean }) => {
      const info = socketPlayerMap.get(socket.id);
      if (!info || !info.teamId) return;

      io.to(`${info.matchId}:${info.teamId}`).emit('voice:state_change', {
        playerId: info.playerId,
        isMuted,
        isDeafened
      });
    });

    // -------------------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      const info = socketPlayerMap.get(socket.id);
      if (info) {
        socketPlayerMap.delete(socket.id);
        const match = matchManager.getMatch(info.matchId);
        if (match && match.phase === 'lobby') {
          delete match.players[info.playerId];
          io.to(match.id).emit('match:state', match);
        }
      }
    });
  });
}
