ColoCo Document Set • Revision 2

ColoCo • Competitive Coloring • Revision 2

What changed

Game name is now ColoCo (Competitive Coloring).

Frontend: Next.js + TypeScript on Vercel, deployed from GitHub.

Backend: Node.js + TypeScript on Render.

Realtime: Socket.IO/WebSockets.

Voice: WebRTC with backend signaling.

Auth/database/storage: Supabase Auth, PostgreSQL and Storage.

AI judging: Gemini, server-side only, with configurable reliability/failover support.

Initial domain: coloco.vercel.app.

Light theme: light blue + white. Dark theme: navy/dark blue + white.

Logo direction: red, blue and green paintbrushes meeting/interlocking at the center, with natural brown brush/handle details.

Things the developer must do manually

Create/connect the GitHub ColoCo repository.

Create/import the Vercel project and configure production environment variables.

Create a Render backend service connected to GitHub.

Create the Supabase project, configure Auth redirects, database and Storage.

Create/configure Gemini API access and keep credentials server-side.

Never commit API keys, tokens or service-role keys.

Supabase production redirect

Production Auth must explicitly use https://coloco.vercel.app. Local development may use http://localhost:3000. Verification and password-reset flows must not accidentally default to localhost in production.