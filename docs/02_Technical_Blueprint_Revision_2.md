ColoCo Technical Blueprint • Revision 2

ColoCo • Competitive Coloring • Revision 2

1. Stack

GitHub: source control.

Vercel: Next.js + TypeScript frontend.

Render: Node.js + TypeScript backend and realtime server.

Socket.IO/WebSockets: realtime gameplay.

WebRTC: private teammate voice; Render backend provides signaling.

Supabase: Auth + PostgreSQL + Storage.

Gemini: server-side AI judging.

Redis: optional later for ephemeral state/presence/rate limiting if load testing requires it.

2. Auth

Supabase Auth with email/password.

Supabase email verification and password reset.

Production URL: https://coloco.vercel.app.

Development redirect: http://localhost:3000.

Production email flows must not default to localhost.

Service-role credentials remain server-side.

3. Realtime

Socket.IO/WebSockets with authenticated sessions.

Client sends compact drawing operations; server validates identity, match state, territory and rate limits.

Server broadcasts authorized events only to teammates.

Opponent canvas data is never sent to opposing teams.

Use sequence numbers/revisions and periodic snapshots.

Client rendering may be optimistic, but server state is authoritative.

4. Voice

WebRTC for teammate voice.

Backend signaling for session establishment.

Voice scoped to team/match.

Mute, deafen and microphone state.

No raw voice recording by default.

5. Data and Storage

PostgreSQL: users, profiles, lobbies, teams, matches, challenges, results, telemetry, reports, penalties and relationships.

Supabase Storage: reference images, coloring templates, uploaded assets and approved artwork assets.

Database stores metadata/object paths rather than large binaries.

Use private/signed asset access where appropriate.

6. Territories and Canvas

Independent shared canvas per team.

Automatic simple irregular territory generation.

Every player has a server-assigned territory.

Drawing outside territory is rejected or clipped.

Background is included in territory protection.

Keep V1 territory logic simple and maintainable.

7. Gemini Reliability

Gemini requests originate only from Render.

Support multiple configured Gemini project credentials where legitimately available.

Multiple API keys inside one project must not be treated as independent quotas.

Retry transient rate limits with backoff.

Mark exhausted projects temporarily unavailable and try another configured project when appropriate.

Recheck unavailable projects later.

If all configured capacity is unavailable, preserve the match and retry judging instead of losing the result.

Judge only after artwork is locked, not continuously during drawing.

Never expose Gemini credentials to clients.

8. Security

HTTPS/TLS.

Server-authoritative teams, timers, territories, score inputs and match state.

Rate limiting and invalid-action validation.

Opponent data isolation.

Reconnect validation.

Audit logs.

Secrets only in deployment environment variables.

Basic anti-cheat for V1, not over-engineered.

9. Deployment

GitHub is the source of truth.

Vercel deploys the frontend from GitHub.

Render deploys the backend from GitHub.

Supabase is the managed data/auth/storage layer.

Use separate development/staging/production configuration where practical.

Choose the final hardcoded lobby maximum after load testing, targeting <=50% of measured safe capacity.

10. Required Human Setup

Create/connect GitHub repository.

Create/import Vercel project.

Create Render service.

Create Supabase project and configure Auth redirects, database and Storage.

Configure Gemini API access.

Put all secrets in environment variables only.

Run load testing before finalizing the lobby cap.