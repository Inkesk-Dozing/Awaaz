# VoiceStudio → Engine Catalog Notes

Source: `docs/feature-catalog.md` + `docs/engines/` in [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio).

## VoiceStudio's model

VoiceStudio ships **pluggable engines** (OmniVoice default, CosyVoice, IndexTTS, KittenTTS, sherpa-onnx, …), each with a guide, hardware notes, and capability flags. Engines advertise what they support (cloning? sampling steps? native rate?) so the UI never shows ineffective controls.

Features built on top: Voice Cloning, Voice Design, Video Dubbing, Dictation, Vocal Isolation, Diarization, Batch Queue, MCP Server.

## Awaaz analogy

Awaaz doesn't run models, but the *pattern* maps:

| VoiceStudio concept | Awaaz equivalent |
|---------------------|------------------|
| Engine (OmniVoice, CosyVoice…) | **Mask preset** (`masks.ts`: gender, creature, hardware, archetype) |
| Engine capability flags | `MaskPreset.fxType` / `fxParams` (robot, radio, none) — chain only arms FX the preset declares |
| Engine guide docs | DSP spec §1 (masks, FX, pitch) + [output calibration guide](../../11-voice-output-calibration.md) |
| Pitch-shift backend choice | RubberBand WASM worklet (preferred) → Tone.PitchShift fallback — engine-like progressive enhancement inside `MorphChain` |
| Vocal Isolation | post-v1: noise-gate / RNNoise-style gate on mic path |
| Batch export | post-v1: recorded morphed takes (`audioRecorder` already captures `MediaStream`) |

## Catalog design rules to copy

1. **Declare capabilities honestly** — if a mask has no ring-mod, don't render robot FX controls.
2. **Graceful fallback** — WASM worklet fails → Tone fallback → dry path; never a dead graph.
3. **One guide per engine-like unit** — keep `05-audio-dsp-spec.md` sections per FX family.
4. **Hardware/perf awareness** — Web Audio DSP is cheap; the expensive piece is RubberBand WASM; document CPU fallback behavior.
