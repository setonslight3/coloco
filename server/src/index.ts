import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { CONFIG } from './config.js';
import { MatchManager, BUILT_IN_CHALLENGES } from './game/matchManager.js';
import { GeminiJudgingService } from './services/geminiJudge.js';
import { setupSocketHandlers } from './socket/index.js';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const matchManager = new MatchManager();
const judgeService = new GeminiJudgingService();

// Setup Socket.IO realtime gameplay & WebRTC signaling
setupSocketHandlers(io, matchManager, judgeService);

// Health check endpoint for Render / Vercel
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'ColoCo (Competitive Coloring)',
    version: '2.0.0',
    lobbyCap: CONFIG.LOBBY_CAP,
    timestamp: new Date().toISOString()
  });
});

// Challenges listing API
app.get('/api/challenges', (req, res) => {
  res.json(BUILT_IN_CHALLENGES);
});

// Single match status lookup
app.get('/api/matches/:id', (req, res) => {
  const match = matchManager.getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }
  res.json(match);
});

server.listen(CONFIG.PORT, () => {
  console.log(`===============================================`);
  console.log(`🎨 ColoCo Server running on port ${CONFIG.PORT}`);
  console.log(`   Health check: http://localhost:${CONFIG.PORT}/health`);
  console.log(`   Mode: Realtime Socket.IO + WebRTC Signaling`);
  console.log(`===============================================`);
});

export { app, server, matchManager, judgeService };
