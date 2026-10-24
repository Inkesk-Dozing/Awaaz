# VoiceStudio → Performance & Metrics Notes

Source: `docs/performance.md`, `docs/benchmarks.md`, streaming docs in [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio).

## Metrics VoiceStudio treats as first-class

- **ttfa** — time to first audio (streaming TTS).
- **gen_time_s** — end-to-end wall clock.
- **rtf** — synthesis time ÷ audio duration (real-time factor).
- Per-stage render traces (`synthesis`, `join`, `effects`, `save`, `watermark`…) with correlation IDs.
- **Operation-count budgets in CI** (not wall-clock): e.g. "exactly one `generate` per chunk" — regressions fail CI deterministically.

## What Awaaz should measure (v1 → post-v1)

| Metric | Definition | Where |
|--------|------------|-------|
| **Calibration quality** | `OutputCalibrationProfile.quality` (0..1) — already computed | Calibration UI ✅ |
| **Clamp flags** | Whether pre/makeup/peak hit bounds | Calibration notes ✅ |
| **Morph latency** | Mic tap → monitor tap round-trip (rAF timestamp delta vs audio clock) | post-v1: hidden dev HUD |
| **Output level stability** | Rolling RMS variance of morphed stream while speaking | post-v1: strip chart |
| **Graph topology sanity** | Unit test: chain node order (pitch → filters → FX → stage) | tests (structural) |

## CI-style budget ideas (adapt VoiceStudio's op-count approach)

Instead of flaky timing tests:

1. `solveOutputCalibration` must be **pure & deterministic** (same input → same output). ✅ tested.
2. Metering must run **O(n)** per buffer (no accidental nested loops). Review + fixture size guards.
3. `MorphChain` must create FX nodes **only when the preset declares them** (robot/radio none → zero oscillators/noise buffers). Structural check via `getActiveFx()`.
4. Matcher tilt must respond to synthetic low vs high sine fixtures. ✅ tested.
