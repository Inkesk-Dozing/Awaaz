# Awaaz

**Browser-native Voice Changer Studio + Lie Detector party game.** Zero servers hear your voice — all audio processing runs client-side (Web Audio API), and rooms connect peer-to-peer (PeerJS/WebRTC). **$0 hosting.**

> Everyone speaks through voice-morphing masks (male↔female, robot, radio, celebrity-inspired archetypes). One player sits in the "hot seat" and gets grilled while a real acoustic stress engine — jitter, shimmer, pitch-drift, hesitation — tries to catch the liar. The mask hides *who* you are; the polygraph reads *how you feel.*

## Features (v1)

- **Voice Changer:** gender morph (pitch + formant), Chipmunk/Demon, Robot, Radio, celebrity-*inspired* presets, independent pitch/formant sliders, **Voice Twin Matcher** (feed it 5–10 s of any voice → DSP recipe for your mic).
- **Lie Detector Arena:** 3–6 players, 4-letter room codes, calibration baselines, live polygraph HUD (jitter needle, tremor strip-chart, deception bar), TRUTH/UNSTABLE/DECEPTION verdicts, voting, scenario decks, post-game detector-accuracy stats.
- **Privacy:** audio only P2P; analysis stays on your device; no accounts, no tracking.

*For entertainment. Measures vocal arousal, not deception. Not a scientific lie detector.*

## Documentation

Full docs live in [`docs/`](docs/README.md):

| Doc | Topic |
|-----|-------|
| [Product overview](docs/01-product-overview.md) | Vision, pillars, framing |
| [Features](docs/02-features.md) | Master list, v1 vs post-v1 |
| [Roadmap](docs/03-roadmap.md) | Phase-wise plan P0–P7 |
| [Architecture](docs/04-architecture.md) | Modules, graphs, data flow |
| [DSP spec](docs/05-audio-dsp-spec.md) | Morph + polygraph algorithms |
| [Networking](docs/06-multiplayer-net.md) | WebRTC, TURN, protocol |
| [Game design](docs/07-game-design.md) | Loop, roles, scoring |
| [Testing](docs/08-testing-strategy.md) | Unit tests, playtests |
| [Deploy & cost](docs/09-deployment-and-cost.md) | $0 stack, steps |
| [Risks](docs/10-risk-register.md) | Register + assumptions |
| [Output calibration](docs/11-voice-output-calibration.md) | Broadcast mastering, gain staging, pro levels |
| [VoiceStudio research](docs/research/voicestudio/README.md) | External reference notes |

## Stack

Vite · React · TypeScript · Tone.js · PeerJS · Zustand · Vitest — deploys free to Vercel/GitHub Pages.

## License

See [LICENSE](LICENSE).
