# VoiceStudio Research Notes

Notes from analyzing [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) (open-source local ElevenLabs alternative) to extract **professional voice-output practices** applicable to Awaaz.

> **License note:** VoiceStudio is AGPL-3.0. These are *ideas, parameter ranges, and process notes only* — no code is copied.

## What Awaaz borrows (implemented / planned)

| VoiceStudio practice | Awaaz adaptation | Status |
|----------------------|------------------|--------|
| Broadcast mastering ("Even out volume": EQ + compression + normalization) | `OutputStage` — compressor → makeup → soft-clip limiter (`src/audio/mastering/outputStage.ts`) | ✅ v1 |
| Plain-language quality tiers | Mastering profiles: Broadcast / Clean / Punchy (`targets.ts`) | ✅ v1 |
| "Check audio" signal checks (clipping/silence/volume drift) | Live metering (peak/RMS dBFS) + calibration notes/badges | ✅ v1 |
| Operating-level discipline | Output calibration: input pre-gain ≈ −18 dBFS RMS, output ≈ −16 dBFS, peak ≤ −1 dBFS | ✅ v1 |
| Engine catalog with progressive enhancement | Mask FX (robot/radio) as well-defined insert effects with bypass | ✅ v1 |
| Measurable metrics (ttfa/rtf, honest numbers) | Calibration confidence score + clamped/notes in UI | ✅ v1 |
| Export precision tiers | Post-v1: WAV export of morphed takes (16/24-bit) | 📋 post-v1 |
| Real-engine validation sweeps (compare_generation_quality.py) | Post-v1: offline fixture tests for morph chain | 📋 post-v1 |

## What Awaaz deliberately does NOT borrow

- **Neural TTS / voice cloning** — Awaaz morphs a live mic; cloning is out of scope (matcher emits DSP recipes only, never model clones).
- **Server/backend architecture** — Awaaz is 100% client-side, $0 hosting.
- **Sampling-step controls** — meaningless without a generative model.
- **Model marketplace / licensing inventory** — no model weights.

## Key files in this folder

| File | Contents |
|------|----------|
| [audio-quality.md](audio-quality.md) | VoiceStudio's mastering/export/signal-check model vs Awaaz chain |
| [engine-catalog.md](engine-catalog.md) | Engine list → analogy with Awaaz mask/FX presets |
| [performance-and-metrics.md](performance-and-metrics.md) | Metrics worth stealing (ttfa/rtf → calibration quality/latency) |
| [docs-comparison.md](docs-comparison.md) | Docs tree comparison and gaps |
