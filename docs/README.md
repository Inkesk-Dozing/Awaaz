# Awaaz — Documentation

**Awaaz** is a browser-native Voice Changer Studio with a built-in Lie Detector party game. Zero servers hear your voice; everything runs client-side (Web Audio API) with free P2P networking (PeerJS/WebRTC).

## Reading order

| # | File | What it covers |
|---|------|----------------|
| 1 | [01-product-overview.md](01-product-overview.md) | Vision, pillars, users, honest framing |
| 2 | [02-features.md](02-features.md) | Master feature list (v1 vs post-v1) |
| 3 | [03-roadmap.md](03-roadmap.md) | Phase-wise plan (P0–P7), exit criteria |
| 4 | [04-architecture.md](04-architecture.md) | Modules, data flow, folder tree |
| 5 | [05-audio-dsp-spec.md](05-audio-dsp-spec.md) | Voice morphing + stress-measurement DSP |
| 6 | [06-multiplayer-net.md](06-multiplayer-net.md) | Rooms, WebRTC mesh, TURN, protocol |
| 7 | [07-game-design.md](07-game-design.md) | Game loop, roles, scoring, decks |
| 8 | [08-testing-strategy.md](08-testing-strategy.md) | Unit tests, browser matrix, playtests |
| 9 | [09-deployment-and-cost.md](09-deployment-and-cost.md) | $0 stack, deploy steps, privacy |
| 10 | [10-risk-register.md](10-risk-register.md) | Risks, mitigations, assumptions |
| 11 | [11-voice-output-calibration.md](11-voice-output-calibration.md) | Output staging, mastering profiles, pro calibration |

## Research notes

| Folder | Topic |
|--------|-------|
| [research/voicestudio/](research/voicestudio/README.md) | Analysis of [VoiceStudio](https://github.com/debpalash/VoiceStudio): mastering, signal checks, metrics, docs structure — and what Awaaz borrowed |

## One-line pitch

> Party game for 3–6 friends: everyone speaks through voice-morphing masks, one player gets grilled in the hot seat, and a real acoustic stress engine (jitter, shimmer, pitch-drift, hesitation) tries to catch the liar — $0 hosting, all peer-to-peer.

## Cost & privacy

- **Hosting:** $0 (static SPA + free PeerJS Cloud signaling + free Open Relay TURN).
- **Privacy:** No audio ever touches a server. Only disguised audio + small stress JSON travel P2P between players.
