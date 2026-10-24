# 08 — Testing Strategy

## 1. DSP unit tests (Vitest) — blocking gate for Phase 1

All DSP is pure functions over `Float32Array` → testable without a browser audio graph.

| Test | Input | Expected |
|------|-------|----------|
| YIN accuracy | 220 Hz sine, 48 kHz | median F0 within ±1 Hz |
| YIN sub-sample | 220.3 Hz sine | error < 0.5 Hz (proves interpolation) |
| Jitter floor | clean sine | jitter_local < 0.2 % |
| Jitter sensitivity | sine with known FM (period mod ±0.5 %) | measured jitter within 20 % of analytic value |
| Shimmer | sine with amplitude modulation ±10 % | shimmer_local within 20 % of analytic |
| Voicing | white noise | > 90 % frames unvoiced |
| Voicing | silence | unvoiced |
| Outlier filter | pulse train + one 2× outlier period | outlier rejected, jitter stays low |
| HNR | sine (r≈1) | HNR high (> 25 dB) |
| VAD pauses | scripted speech-like bursts + gaps | pause count/durations match ground truth |
| Stress composite | synthetic z-score inputs | monotonic in each feature; bounded 0–100 |
| Matcher | synthetic "target" vs "source" sines | semitones ≈ 12·log2(f_t/f_s) |
| Metering | unit sine 1.0 amp | RMS ≈ −3.01 dBFS, peak ≈ 0 dBFS |
| Output calibration solver | quiet mic (−30 dBFS) | preGain ≈ +12 dB, not clamped |
| Output calibration solver | peak-exceeding case | makeup reduced so peak ≤ ceiling |
| Output calibration solver | NaN inputs | finite gains returned |
| Spectral tilt (`bands.ts`) | 200 Hz vs 3500 Hz sines | tilt(low) ≫ tilt(high) |
| Saturation curves | tanh + bitcrush builders | endpoints within ±1, monotonic staircase |
| Output profiles | Broadcast/Clean/Punchy | ratio > 1, peak ceiling ≤ 0 |

Regression fixtures: short recorded `.wav` blobs (committed) with stored expected feature snapshots (loose tolerances for cross-browser float variance).

New test files: `metering.test.ts`, `output_calibration.test.ts`, `bands.test.ts`, `fx_mastering.test.ts` (plus existing `masks.test.ts`, `matcher.test.ts`).

Run: `npm test` in CI (GitHub Actions on push).

## 2. Browser matrix (manual smoke, Phase 0/2/6)

| Browser | Mic | Morph audible | WebRTC call | Notes |
|---------|-----|---------------|-------------|-------|
| Chrome (latest) | ✓ | ✓ | ✓ | Primary dev target |
| Edge | ✓ | ✓ | ✓ | |
| Firefox | ✓ | ✓ | ✓ | |
| Safari macOS | ✓ | ✓ | ✓ | Test AudioContext gesture gate |
| Safari iOS | ✓ | ✓ | ✓ | Tab-active warning; sample-rate quirks |
| Chrome Android | ✓ | ✓ | ✓ | Portrait HUD |

## 3. Networking tests (Phase 3)

- 3 tabs on localhost (baseline).
- 2 machines on same LAN.
- 1 machine on mobile hotspot (different NAT) — forces TURN path; verify RELAY badge.
- Kill-host mid-round → all clients show "Host closed the room."
- Kill-client mid-answer → host marks disconnected; round continues.
- Rejoin within 60 s with same code → snapshot restore.

## 4. Playtest protocol (Phase 5) — needs ≥3 humans

- **5 full rounds**, rotating who is saboteur.
- After each round, one-word "felt fair?" vote (too harsh / fair / too soft).
- Record composite distributions per role → check sanity bands (calm-truth 25–40, panicked-truth 50–70, calm-lying 45–75).
- Tune drama-noise and weights until no dominant strategy emerges (e.g., "always vote the reddest" or "always acquit everyone" both fail).

## 5. Performance checks

- CPU < 10 % of one core with morph + analysis at 15 Hz (Chrome DevTools performance monitor).
- Telemetry send loop skips frames when `bufferedAmount` grows (no queue explosion).
- 6-player mesh: upstream < 250 kbps (chrome://webrtc-internals).

## 6. UI smoke (optional Playwright)

- Home → create room → lobby renders.
- Join with bad code → error state.
- Calibration countdown completes → phase advances (mock engine).
No audio in CI — mock `VoiceEngine` behind an interface.

## 7. Accessibility checks

- Verdict distinguishable without color (text label + pattern).
- Keyboard navigable lobby (Tab/Enter through roster, ready, start).
