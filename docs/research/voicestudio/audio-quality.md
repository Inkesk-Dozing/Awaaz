# VoiceStudio → Audio Quality Notes

Source: `docs/audio-quality.md` + feature catalog in [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio).

## What VoiceStudio does

1. **Broadcast mastering by default.** "Even out volume" runs an app-added chain of **EQ → compression → normalization** before export. Engines that already master skip the pre-stage.
2. **Export precision tiers:** 16-bit PCM (standard) / 24-bit PCM (editing) / 32-bit float (original) — with honest sizing tables (e.g. 2.9 MB/min at 24 kHz mono for 16-bit).
3. **Voice controls** separate from technical model controls: speed, duration, cleanup. Advanced sampling steps (8–64) only shown when the adapter actually honors them — *no fake knobs*.
4. **"Check audio" signal scan** post-generation: long silence, relative volume changes, **clipping**, empty audio, invalid samples. Advisory only; seekable timestamps; never modifies audio.
5. **Validation harness:** `scripts/compare_generation_quality.py` runs installed engines across steps × precisions, checks WAV integrity, runs Whisper intelligibility spot-checks, writes `results.json`.
6. **Float32 transport** between backend and UI where supported; PCM16 fallback.

## How Awaaz applies this

| Idea | Awaaz implementation |
|------|----------------------|
| EQ/compression/normalization mastering | `MorphChain` → `OutputStage` (DynamicsCompressor + makeup gain + tanh soft-clip limiter at −1 dBFS). Always-on gentle saturation for warmth. |
| Plain-language tiers | Three mastering profiles: **Broadcast** (default, 3:1, −16 dBFS RMS), **Clean** (2:1, −18 dBFS), **Punchy** (4:1, −14 dBFS) — `src/audio/mastering/targets.ts`. |
| Signal checks | `measureVoicedLevels` + `solveOutputCalibration` produce notes ("Mic may be clipping", "Makeup reduced X dB to hold peak") surfaced in Calibration UI. |
| Honest limits | Pitch clamped ±6 st; gains clamped; quality score in `OutputCalibrationProfile`; UI shows `clamped` state in amber. |
| No fake knobs | Mastering profile buttons only expose what the chain implements (threshold/ratio/saturation character) — not arbitrary sample-rate or bit-depth toggles (realtime WebRTC stream). |

## Awaaz-specific twist

VoiceStudio masters *rendered files*; Awaaz masters a **realtime stream** for WebRTC. Constraints:

- Latency: compressor + WaveShaper add ~1 render quantum (≈3 ms) — within the 100–200 ms budget.
- WebRTC does its own AGC-ish processing downstream — we stage *before* encode so the encoder sees a healthy −16 dBFS RMS, not a screaming 0 dBFS signal.
- No file export in v1 → precision tiers deferred to post-v1 (record morphed takes as WAV/Opus).

## Parameter ranges adopted

| Parameter | Awaaz value | Rationale |
|-----------|-------------|-----------|
| Input operating level | −18 dBFS RMS | Headroom for formant boosts (+5–6 dB) without clipping |
| Output target | −16 dBFS RMS (Broadcast) | Comfortable chat level with WebRTC downstream gain |
| Peak ceiling | −1.0 dBFS | True-peak margin for lossy codec overshoot |
| Compressor ratio | 2–4:1 | Vocal dynamics control without pumping |
| Attack | 5–20 ms | Fast enough for sibilant peaks, slow enough to keep transients |
| Release | 150–250 ms | Natural level recovery between phrases |
| Saturation drive | 1.0–1.35 | Analog-ish warmth; mild at Clean |
