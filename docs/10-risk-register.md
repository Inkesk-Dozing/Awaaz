# 10 — Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Symmetric NAT / corporate firewall blocks P2P | Medium | High | Open Relay TURN on 80/443/`turns:443`; RELAY badge; test on hotspot in Phase 3 |
| R2 | PeerJS Cloud outage or rate limits | Low | High | Idempotent reconnect; README self-host signaling fallback; monitor status.peerjs.com |
| R3 | Metric noise across cheap mics / noisy rooms | High | High | Mandatory calibration; z-scores only (no global thresholds); signal-quality gate greys HUD |
| R4 | iOS Safari quirks (gesture-gated audio, tab suspension) | High | Medium | Test on Day 2 not Day 7; "keep tab active" warning; gesture Start button |
| R5 | Tone.PitchShift artifacts at large intervals | Medium | Medium | Cap ±6 semitones; tune windowSize; swap to SoundTouchJS worklet if needed |
| R6 | Feedback howl (speaker + open mic) | Medium | Medium | Headphone prompt; local monitor off by default |
| R7 | Not enough human playtesters for balance | Medium | Medium | Schedule Phase 5 early; pre-fill with fake-player mode if short |
| R8 | Host tab closes = room dead | High (accepted) | Medium | Clear "host closed room" + rematch; host migration is post-v1 |
| R9 | Telemetry spam / bufferbloat | Low | Low | 15 Hz cap; skip frames when `bufferedAmount` high |
| R10 | Players game the verdict (deliberate panic to frame someone) | Medium | Low | Part of the fun; vote layer is social correction; fog-of-war mode |
| R11 | Hot-seat client lies about its own composite score | Low (v1) | Medium | Host range-validates; full anti-cheat (server DSP) needs a server — out of $0 scope; social detection via implausible patterns |
| R12 | Celebrity-likeness legal issues | Low if v1 ships archetypes only | High | No real names/likenesses in presets; matcher = DSP recipes only; AI-clone tier gated behind consent guardrails (I2) |
| R13 | "Lie detector" misread as real | Medium | Medium | In-lobby disclaimer; post-game detector-accuracy stat; game-show verdict language |
| R14 | CPU spikes on low-end laptops | Low | Medium | 15 Hz analysis default; profile in Phase 6; WASM seam exists |

## Open assumptions

1. Desktop-first; mobile is "works, not optimized" in v1.
2. English decks for v1 (3 scenarios).
3. No anti-cheat against exotic abuse (e.g., playing a recording into the mic).
4. ≥3 human playtesters available for Phase 5.
5. "Awaaz" is the product name (voice/sound) — used in UI and room-code prefix `awaaz-`.
6. Composite score computed on hot-seat client (needs local baseline); host validates ranges only.
