# 03 — Phase-wise Roadmap

**Total: ~6.5 days + ~1 day buffer.** Each phase ends with something runnable/demoable. Phases 1 and 2 can partially parallelize.

---

## Phase 0 — Scaffold & audio plumbing (~0.5 day)

**Goal:** repo skeleton + working mic pipeline.

- Vite + React + TypeScript + Zustand + Vitest; ESLint + Prettier.
- Folder structure per [04-architecture.md](04-architecture.md).
- `getUserMedia` with exact constraints (`echoCancellation`, `noiseSuppression`, `autoGainControl` all `false`).
- AudioContext gesture-resume handling (click-to-start gate).
- Live level meter + waveform canvas on a dev page.

**Exit criteria:** waveform + meter work in Chrome, Edge, Firefox, and Safari.

---

## Phase 1 — DSP telemetry core (~1.5 days) ★ riskiest

**Goal:** trustworthy stress measurements from the raw mic.

- **YIN** pitch tracker: difference function, cumulative-mean normalization (threshold ~0.13), parabolic interpolation for sub-sample period.
- Pulse-picking inside 0.5–1 s voiced segments; Praat-style outlier rejection (period ratio > 1.3, amplitude ratio > 1.6).
- Jitter (local + RAP), Shimmer (local + dB) over pulse sequences.
- VAD: energy + autocorrelation peak strength (r > 0.6) + adaptive noise floor.
- HNR, 8–12 Hz tremor band, pause analytics, response latency, speech rate, FLINCH detector.
- Calibration flow → per-player baseline; z-score engine.
- Deception composite: weighted sigmoid + bounded drama noise.

**Exit criteria (blocking):**
- Vitest suite green: sine → jitter < 0.2 %; FM-modulated sine → within 20 % of analytic value; white noise → mostly unvoiced; regression fixtures pass.
- Dev page shows sane live gauges on real speech.

---

## Phase 2 — Morph engine + Voice Twin Matcher (~1 day)

**Goal:** masks work; anyone can mimic a sample.

- Graph: `mic → analyser(raw)` (analysis) and `mic → pitch → 3 formant biquads → LP → FX → MediaStreamDestination` (transmit).
- Mask preset table (`masks.ts`): semitones, F1/F2/F3 anchors + gains, LP cutoff, ring-mod freq, bitcrush depth.
- Tune `Tone.PitchShift` (`windowSize` 0.04–0.06 s), cap ±6 semitones.
- v1 presets: Male, Female, Androgyny slider, Chipmunk/Demon, Robot, Radio, 4 celebrity-inspired archetypes.
- Smooth preset crossfade (50 ms).
- **Voice Twin Matcher:** run the analysis stack on a 5–10 s uploaded/played sample → extract F0 range, spectral tilt, rough formant anchors, pace, breathiness → emit a DSP recipe applied to the live mic; confidence meter.

**Exit criteria:** blind A/B male↔female perceptible at ±5 semitones; no feedback howl with headphones; CPU < 10 %; matcher produces a recognizable "vibe" preset.

---

## Phase 3 — Networking (~1 day)

**Goal:** rooms work across real networks.

- PeerJS host/join: host peer id = `awaaz-{CODE}` (4-letter code, collision-retry).
- Slot assignment; full-mesh audio (`peer.call()` with disguised `MediaStream`).
- Star telemetry: clients → host at 15 Hz; host re-broadcasts hot-seat at 10 Hz.
- ICE: Google STUN + Open Relay TURN (80 / 443 / `turns:443`); RELAY badge on TURN usage.
- Ping/pong clock-offset estimation.
- Reconnect: rejoin with same code → state snapshot, resume.

**Exit criteria:** 3 browsers on 2 different networks (one on mobile hotspot) hear each other and see live cross-client telemetry.

---

## Phase 4 — Game FSM & core loop (~1 day)

**Goal:** the flagship game is playable end-to-end.

- Host-authoritative FSM: `lobby → calibration → disguise → role deal → interrogation → verdict → vote → reveal → rematch/exit`.
- Roles: 1 Saboteur (truth card) + Crew; question deck engine (5 questions × 20–40 s, host-timed).
- ≥3 scenario decks ("Vault Breach," "The Leak," "Stolen Prototype").
- Vote UI (15 s, anonymous), reveal + scoring screens.
- Error handling: room full (max 6), host left, peer drop mid-round.

**Exit criteria:** full 3-player playthrough with no dead-ends; host-leave and mid-round drops handled gracefully.

---

## Phase 5 — Polygraph HUD & balance (~1 day)

**Goal:** the drama machine looks right and feels fair.

- Canvas HUD: jitter needle, pitch-drift dial, tremor strip-chart, deception bar w/ confidence shading, pause ribbon, FLINCH popups, quality badge.
- Hot-seat detail view vs spectator fog-of-war toggle.
- Mobile portrait layout.
- Colorblind-safe verdict colors + text labels.
- **Playtest protocol** (needs ≥3 humans, see 08-testing-strategy.md): 5 rounds; tune drama-noise weight and thresholds.
  - Sanity targets: calm-truth ≈ 25–40 composite; panicked-truth ≈ 50–70; calm-lying ≈ 45–75 (overlapping but biased).

**Exit criteria:** no dominant strategy after 5 rounds; verdicts feel "dramatic but arguable."

---

## Phase 6 — Resilience & ship (~0.5–1 day, with buffer)

**Goal:** deployable, honest, hard to break.

- Error states: mic denied, no ICE path, TURN-only, room full, host left, tab backgrounded ("keep tab active" warning — critical for iOS).
- In-lobby entertainment disclaimer + privacy note.
- Expanded root README; deploy to Vercel (or GH Pages).
- 6-player stress test.

**Exit criteria:** public URL live; 6-player test passes; $0 confirmed on all services.

---

## Phase 7 — Post-v1 backlog (designed, not scheduled)

Order of attack (suggested):
1. **Mask-Crack real-voice leak** (best emergent mechanic; needs echo care).
2. Celebrity pack sub-dials (G3) + more presets (A3, A7–A10).
3. Pro controls B2–B6; sound beds C7–C8; Voice Print Card C5.
4. Solo modes: Beat the Box, coaching tools (F1–F4).
5. Extra party modes: Lie-Off, Whisper Round, Cadence Duel, Two Truths & a Lie.
6. Baseline re-anchoring D19; spectrogram waterfall HU7.
7. WASM DSP upgrade if profiling demands; self-hosted PeerJS signaling fallback.
8. AI voice conversion tier I — only with consent/likeness guardrails (I2).

---

## Dependency graph

```
P0 ──► P1 ──► P5
  │      ▲
  └─► P2 ┘ (matcher reuses DSP)
  │
  └─► P3 ──► P4 ──► P5 ──► P6
```
