ColoCo Development Master Prompts • Revision 2

ColoCo • Competitive Coloring • Revision 2

Global Coding-AI Rules

Build a responsive browser-first website, not a native app.

Next.js + TypeScript frontend; Node.js + TypeScript backend on Render.

Socket.IO/WebSockets for realtime; WebRTC for private teammate voice.

Supabase Auth, PostgreSQL and Storage.

Gemini only from the server.

GitHub is the source of truth; Vercel and Render deploy from GitHub.

Never trust client team, timer, territory, score or match-state data.

Never leak opponent live canvas data.

Use modular services, tests for important multiplayer rules, environment variables for secrets, and small rollback-safe commits.

Do not rewrite stable systems unnecessarily.

Phase 1: Foundation + Accounts + Realtime + Voice

Create the frontend/backend structure and deployment configuration.

Connect GitHub, Vercel, Render and Supabase.

Implement Supabase email/password auth, verification and reset.

Configure production auth redirects for https://coloco.vercel.app and localhost development.

Create authenticated Socket.IO sessions.

Implement initial WebRTC signaling and private teammate voice.

Add environment validation and secret-safe configuration.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 2: Matchmaking + Teams + Naming + Preparation

Implement lobby state and random equal-sized team assignment.

Prevent host team stacking.

Implement 10–30 second preparation and 20-character team naming.

Keep voice disabled during naming, then enable private team voice.

Add private text chat.

Make the lobby cap a hardcoded configuration value, finalized after load testing.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 3: Shared Canvas + Drawing + Territories

Create independent shared canvas per team.

Implement compact ordered stroke events.

Generate simple irregular player territories.

Reject/clip drawing outside the player's territory.

Protect the full canvas including background.

Implement snapshots and reconnect-safe recovery.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 4: Challenges + Coloring + Drawing + Freestyle

Implement curated challenges and random selection.

Implement all three creative modes.

Ensure every team receives the exact same challenge/reference/template/instructions.

Allow Drawing references to be shown/hidden repeatedly.

Support host-selected built-in challenges.

Keep future custom-challenge support modular.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 5: Timers + DONE + Reconnect + Completion

Implement server-authoritative timers.

DONE locks only that player's territory.

Allow teammates to continue.

Add early full-team completion bonus without penalizing slower teams.

Lock all canvases at zero.

Implement configurable reconnect grace and secure membership validation.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 6: Showdown Isolation + Telemetry + Results

Enforce strict team data isolation.

Capture contribution, rejected actions, DONE, timing, presence, reconnect and final-artwork telemetry.

Reveal all artworks together.

Implement score-hidden appreciation period.

Implement Final Verdict ranking pipeline.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 7: Gemini Judging + Scoring

Implement six scoring categories with weights 25/20/20/15/10/10.

Separate objective telemetry from subjective AI judgment.

Validate structured Gemini output server-side.

Store judge/rubric version.

Implement retry/backoff and multi-project credential failover where legitimately configured.

Delay/retry judging if all capacity is temporarily unavailable.

Generate concise score explanations and special awards.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 8: Friends + Profiles + History + Leaderboards

Implement friends, requests and invites.

Implement profiles, statistics and match history.

Implement leaderboards with privacy-safe display.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 9: Moderation + Reports + Penalties + Anti-Cheat

Implement evidence-backed reports and moderator queue.

Implement warnings and escalating matchmaking restrictions.

Implement only narrow minimum automatic punishment after configured repeated-report/no-review conditions.

Add rate limiting, invalid-action checks, reconnect validation and audit logs.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Phase 10: QA + Performance + Security + Polish + Production

Test mobile and desktop end-to-end.

Load-test realtime matches.

Set the hardcoded lobby cap to no more than about 50% of measured safe capacity.

Stress-test WebRTC, reconnects, simultaneous joins, timers and reveal.

Audit secrets and security boundaries.

Optimize canvas/network performance.

Polish branding, themes, accessibility and responsive UI.

Deploy production and document rollback.

Acceptance criteria: the phase must pass its tests and multiplayer/security invariants before moving forward.

Human Setup Checklist

Create the GitHub ColoCo repository.

Create/import the Vercel project.

Create the Render backend service.

Create/configure Supabase Auth, PostgreSQL and Storage.

Configure Gemini API access.

Add secrets through environment variables only.

Load-test before final lobby-cap configuration.