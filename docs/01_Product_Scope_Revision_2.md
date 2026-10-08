ColoCo Product Scope • Revision 2

ColoCo • Competitive Coloring • Revision 2

1. Product

ColoCo is a browser-first multiplayer creative competition game. Players form equal-sized teams, collaborate on private shared canvases, and compete against other teams using the same challenge.

2. Brand and UI

Name: ColoCo.

Logo: three paintbrushes in red, blue and green meeting/interlocking around the center. Handles and brush tips use natural brown; the bristle area carries the respective color.

Light theme: light blue + white.

Dark theme: navy/dark blue + white.

Responsive mobile and desktop design is mandatory.

3. Modes

Coloring: supplied line art/template; players can color and draw over/outside it.

Drawing: supplied reference image is guidance, not exact tracing; reference can be shown/hidden repeatedly.

Freestyle: no fixed reference; a general theme guides free interpretation.

4. Competitive Lobby

Accounts are mandatory for multiplayer.

Default: 2 teams of 2. Other equal team sizes/counts are supported.

All teams receive exactly the same challenge, reference/template, difficulty, instructions and time limit.

Host plays and has no special non-player role.

Teams are assigned randomly by default; host cannot stack teams manually.

Each team has its own shared canvas. Players see the full team canvas but can edit only their territory.

Opponents never see another team's live canvas.

Territories are automatically generated and may use simple irregular/wavy boundaries.

A hardcoded lobby maximum is selected after load testing and targets no more than about 50% of measured safe server capacity.

5. Naming and Communication

Preparation period: roughly 10–30 seconds, configurable.

Voice is off during team naming.

Players contribute team-name portions; target maximum is 20 characters, with fallback names.

After naming, teammates can use private voice and text chat.

Voice is never global competitive-lobby voice.

Players can mute/deafen/toggle microphone.

6. Match Flow

Server controls the timer.

DONE locks only the player's territory; teammates continue.

Full-team early completion can receive a bonus.

Teams that take longer are not penalized because another team finished early.

When time reaches zero, every canvas locks immediately.

Reconnect grace is approximately 30 seconds for short matches and 60 seconds for longer matches, configurable.

Progress is preserved and reconnect requires verified account identity plus prior team membership.

7. Results

All team artworks are revealed together.

About 30 seconds of score-hidden appreciation/review.

Final Verdict reveals rankings.

Categories: Accuracy 25%, Creativity 20%, Cooperation 20%, Completion 15%, Consistency/Cohesion 10%, Efficiency/Time 10%. Weights remain tunable.

Each category provides a concise explanation.

Special awards: Most Creative, Most Accurate, Most Cooperative.

8. AI Judging

Gemini evaluates subjective artistic qualities. Server telemetry supplies objective facts such as valid contribution, rejected actions, DONE events, timing, presence and disconnect/reconnect. The judge receives the challenge/mode/reference, final artwork and normalized telemetry. Scores are structured, range-validated server-side and stored with a judge/rubric version.

9. Social and Moderation

Friends, invites, profiles, statistics, match history and leaderboards.

Reports for sabotage, harassment, cheating, inappropriate voice/text, repeated leaving and non-cooperation.

Reports retain match evidence.

Severe penalties normally require moderator/admin review.

Fallback automatic punishment is limited to the minimum punishment after a configured repeated-report/no-review condition.

Escalation: warning → temporary matchmaking restriction → stronger restrictions for repeated offenses.