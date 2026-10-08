# ColoCo • Competitive Coloring (Revision 2)

Browser-first multiplayer creative competition game with cooperative territory canvases, WebRTC voice, and AI judging.

---

## 🎨 Overview & Rules

- **Equal-Sized Teams**: Players form balanced teams (e.g., 2v2). Opponent live canvases are strictly isolated.
- **Wavy Territories**: Canvas is procedurally divided into irregular/wavy territories per teammate. Drawing outside your territory is rejected/clipped.
- **Creative Modes**:
  1. **Coloring**: Supplied line art template where players color inside/outside the lines.
  2. **Drawing**: Guided reference image (can be shown/hidden anytime).
  3. **Freestyle**: Open creative interpretation based on a general prompt.
- **Match Flow**:
  1. **Lobby**: Host selects mode; players join with a 4-letter code. Teams are randomized on start (anti-stacking).
  2. **Naming Phase (10–30s)**: Players collaborate on a 20-character team name. Teammate voice is off during naming.
  3. **Playing Phase**: Server-authoritative timer, real-time shared team canvas, private teammate voice (WebRTC) and text chat.
  4. **DONE Lock**: Clicking DONE locks only that player's territory while teammates continue.
  5. **Showdown / Appreciation Period (20–25s)**: All team canvases are revealed together with scores hidden.
  6. **Verdict & AI Judging**: Server-side Gemini AI evaluates artwork across 6 weighted categories:
     - **Accuracy (25%)**
     - **Creativity (20%)**
     - **Cooperation (20%)**
     - **Completion (15%)**
     - **Cohesion (10%)**
     - **Efficiency / Time (10%)**
     - Special awards (*Most Creative*, *Most Accurate*, *Most Cooperative*).

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS (deployed on Vercel)
- **Backend**: Node.js + TypeScript + Express + Socket.IO (deployed on Render)
- **Voice**: WebRTC peer connections with backend signaling
- **AI Judging**: Google Gemini API (server-side only, retry backoff, multi-key failover, deterministic heuristics fallback)
- **Database & Storage**: Supabase Auth, PostgreSQL, and Storage ready

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm run test
```

### 3. Run Development Servers
- Backend server (Port 4000):
  ```bash
  npm run dev:server
  ```
- Frontend client (Port 3000):
  ```bash
  npm run dev:client
  ```

---

## 📦 Building for Production

- Build both client and server:
  ```bash
  npm run build
  ```
- Run production server:
  ```bash
  npm --workspace=server start
  ```
