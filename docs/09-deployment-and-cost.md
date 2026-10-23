# 09 — Deployment & Cost

## Cost table — always $0

| Item | Service | Tier | Limit |
|------|---------|------|-------|
| Static hosting | Vercel (or GitHub Pages) | Free | generous bandwidth for a small SPA |
| Source | GitHub | Free | private/public repo |
| WebRTC signaling | PeerJS Cloud (`0.peerjs.com`) | Free | public best-effort; self-host fallback documented below |
| STUN | Google / Twilio | Free | unlimited practical use |
| TURN relay | Metered **Open Relay** | Free | ~20 GB/mo, ports 80/443, `turns:443` |
| Analytics / DB / API | none | — | nothing to pay |

Optional later: self-host PeerJS server (Express, ~10 lines) or coturn on Oracle Always-Free VPS — still $0, more ops.

## Deploy steps (Vercel)

1. Push repo to GitHub.
2. Vercel → Import → Framework: **Vite** → Build `npm run build` → Output `dist`.
3. Add env vars if using custom TURN creds: `VITE_OPENRELAY_USER`, `VITE_OPENRELAY_PASS` (Open Relay's public creds can also be hardcoded — they're published for public use).
4. Deploy; HTTPS is automatic (required for `getUserMedia`).
5. Smoke: mic prompt appears, create room code, join from second device.

GitHub Pages alternative: `vite build` → publish `dist/` via Actions; ensure relative base path.

## Environment

```bash
npm create vite@latest awaaz -- --template react-ts
npm i tone zustand peerjs
npm i -D vitest eslint prettier
```

- `AudioContext` must be created/resumed inside a user gesture (Start button).
- Secure context required (HTTPS or localhost).

## TURN credential notes

- Open Relay public credentials are published for demo use; fine for v1.
- For production reliability, create a free Metered account → dedicated Open Relay key (still $0, 20 GB/mo).
- Do **not** ship paid TURN secrets in the client bundle.

## Privacy statement (ship in-product)

- No audio is recorded or sent to any server.
- Disguised audio travels peer-to-peer (WebRTC) between room players only.
- Stress telemetry (numbers like jitter/pitch) is computed on your device; only small JSON summaries are shared with the room host for gameplay.
- No accounts, no analytics SDKs in v1.

## Compliance copy

- Lobby: *"For entertainment. Awaaz measures vocal arousal, not deception. Not a scientific lie detector."*
- Vocal-health views: *"Not a medical device."*
- If AI voice conversion ever ships: consent/likeness guardrails per feature list I2.
