# 05 — Audio DSP Specification

Two engines share one mic: **Morph** (changes how you sound) and **Polygraph** (reads how you feel). Analysis always runs on the **raw** mic; only the morphed signal is transmitted.

---

## 1. Morph engine

### 1.1 Signal chain
```
mic → PitchShift → F1 peaking → F2 peaking → F3 peaking → LP → FX insert → saturator
    → OutputStage (preGain → compressor → makeup → soft-clip) → WebRTC + monitor tap
```

- **PitchShift:** RubberBand C++ WASM AudioWorklet preferred (`public/rubberband-processor.js`, `setHighQuality(true)`); Tone.js fallback with `windowSize = 0.05` s.
- **FX insert:** `robot` (ring-mod + bitcrush), `radio` (bandpass + static bed), or dry bypass — armed only when the preset declares it.
- **OutputStage:** broadcast-style mastering — see [11 — voice output calibration](11-voice-output-calibration.md).

### 1.2 Pitch shifting
- **Primary:** RubberBand WASM worklet (WSOLA/formant-aware) — ratio = `2^(st/12)`, high-quality mode.
- **Fallback:** Tone.js `PitchShift` (delay-line), `windowSize = 0.05` s for voice.
- **Range:** cap at **±6 semitones** in v1 (±8 artifacts audibly). Preset changes glide via `setTargetAtTime`.
- **Upgrade path:** SoundTouchJS AudioWorklet if needed; custom granular ("Jungle") as last resort.

### 1.3 Formant simulation (vocal-tract length)
Male tract ≈ 17 cm (lower resonances); female ≈ 14 cm (×1.15–1.20 higher). Approximate with 3 peaking biquads anchored near F1/F2/F3:

| Anchor | Male-ish | Female-ish (×1.18) | Q | Gain range |
|--------|----------|--------------------|----|------------|
| F1 | ~550 Hz | ~650 Hz | 4–6 | 0–6 dB |
| F2 | ~1500 Hz | ~1770 Hz | 4–6 | 0–6 dB |
| F3 | ~2500 Hz | ~2950 Hz | 4–6 | 0–4 dB |

- Gendershift = pitch shift + formant shift **together**; either alone sounds like helium/demon, not a gender.
- Each mask = a preset tuple: `{ semitones, f1:{freq,gain}, f2, f3, lp, ringMod?, bitcrush? }` in `masks.ts`.
- Preset changes glide with `setTargetAtTime(…, t, 0.05)` → no clicks.

### 1.4 FX modules
- **Radio:** `RadioFx` insert — highpass ~350 Hz + lowpass ~3 kHz + mid presence bump (~1.8 kHz, +4 dB) + looped white-noise static bed (~−32 dB). Squelch blip: post-v1.
- **Robot/Cyborg:** `RobotFx` insert — audio-rate ring modulator (`OscillatorNode` 30–80 Hz → `GainNode.gain` audio param) mixed 15 % dry / 85 % wet for intelligibility, plus optional 6-bit `WaveShaper` bitcrush staircase.
- **Saturation:** always-on gentle tanh `WaveShaper` (drive 1.05, 2× oversample) for warmth after the FX insert.
- **Preset changes** tear down and rebuild only the armed FX nodes; bypass is a direct `GainNode` through-path.

### 1.4b Output stage (mastering)
- Chain: **preGain → DynamicsCompressor → makeup gain → tanh soft-clip limiter → destination**.
- Targets: input ≈ −18 dBFS RMS, output ≈ −16 dBFS RMS, peak ≤ −1 dBFS (Broadcast profile).
- Profiles + calibration solver: `src/audio/mastering/targets.ts`, `src/audio/calibration/outputCalibration.ts`.
- Full guide: [11 — voice output calibration](11-voice-output-calibration.md).

### 1.5 Latency budget (honest)
| Stage | Latency |
|-------|---------|
| PitchShift window | ~40–60 ms |
| Web Audio render quantum | ~3 ms |
| WebRTC encode + jitter buffer | ~40–100 ms |
| Network | ~20–80 ms |
| **End-to-end** | **~100–200 ms** |

---

## 2. Polygraph engine (stress DSP)

### 2.1 Framing
- Analyser `fftSize = 2048`, `getFloatTimeDomainData` on main thread at ~15 Hz (30 Hz optional).
- Lag search range **40–800 samples** (≈60–1200 Hz at 48 kHz).

### 2.2 YIN pitch track (replaces naive autocorrelation)
1. Difference function: `d(τ) = Σ (x_j − x_{j+τ})²` over a 20–40 ms window.
2. Cumulative-mean normalized difference: `d'(τ) = d(τ) / ((1/τ) Σ d(j))`.
3. Absolute threshold ~**0.13**; first minimum below threshold wins; if none → unvoiced.
4. **Parabolic interpolation** around the winning τ → sub-sample period precision (critical: 1-sample quantization fakes ~0.5–2 % jitter, larger than real human jitter).
5. Voicing confidence = `1 − d'(τ*)`; require > ~0.6.

### 2.3 Pulse picking
- Within each 0.5–1 s voiced segment, mark glottal pulses at successive τ* steps.
- **Praat outlier filters:** drop pulse pairs with `T_{i+1}/T_i > 1.3` or `A_{i+1}/A_i > 1.6`.

### 2.4 Jitter (local + RAP)
```
jitter_local(%) = (1/N) Σ |T_{i+1} − T_i| / T̄ × 100
jitter_rap(%)   = (1/N) Σ |T_i − (T_{i−1}+T_i+T_{i+1})/3| / T̄ × 100
```
Ranges: normal ~0.1–1 %; stressed/pathological >1.5–2 %. Only over ≥10 valid pulses.

### 2.5 Shimmer (local + dB)
Per-period **peak-to-peak amplitude** A_i (not frame RMS!):
```
shimmer_local(%) = (1/N) Σ |A_{i+1} − A_i| / Ā × 100
shimmer_dB       = (1/N) Σ |20·log10(A_{i+1}/A_i)|
```

### 2.6 HNR
Normalized autocorrelation peak r at τ*:
```
HNR_dB = 10·log10( r / (1 − r) )
```
Low HNR = breathy/noisy (whisper, tension).

### 2.7 Micro-tremor (8–12 Hz band)
- Build F0 contour at frame rate; band-pass 8–12 Hz (zero-phase, offline over 1 s buffer); RMS of band output = tremor index.
- Also band-pass amplitude envelope for amplitude tremor.

### 2.8 VAD + pauses
- Energy above adaptive noise floor (running min-tracking) **and** YIN voiced flag.
- Silence ratio, pause count, longest pause within an utterance (gap > 250 ms counts as pause).

### 2.9 Event meters
- **Response latency:** host sends question event with host timestamp; client estimates host offset via ping/pong (±50 ms good enough); latency = mic onset − question display time.
- **FLINCH:** RMS jump > 12 dB within any 150 ms window while speaking.
- **Speech rate:** count energy-envelope peaks (syllable proxy) per second.

### 2.10 Calibration & scoring
- Calibration: 15 s neutral read → baseline {F0μ/σ, jitter, shimmer, HNR, silence ratio}.
- Each live feature → z-score vs baseline (σ floored to avoid divide-by-tiny).
- Composite:
```
z_total = w1·z(jitter) + w2·z(shimmer) + w3·z(F0drift) + w4·z(silence) + w5·z(latency)
score   = 100 · sigmoid(z_total + dramaNoise)     // dramaNoise ≈ ±8 bounded random
```
- Verdict bands (tunable in Phase 5): <40 TRUTH, 40–65 UNSTABLE, >65 DECEPTION + confidence from |z_total|.

### 2.11 Signal-quality gate
- SNR estimate from noise floor; if low → `quality ∈ [0,1]` low → HUD shows "METRICS UNRELIABLE," composite dithered toward neutral.

---

## 3. Voice Twin Matcher (sample → recipe)

Input: 5–10 s sample of any target voice (uploaded or played).

1. Run sections 2.2–2.8 on the sample.
2. Extract: median F0, F0 range, jitter/shimmer, HNR, spectral tilt (50–1000 Hz vs 1–5 kHz energy), pace (syllables/s), breathiness proxy (1 − HNR).
3. Same features on **your** mic (quick 5 s calibration).
4. Recipe:
   - `semitones = 12·log2(F0_target / F0_you)` (clamped ±6)
   - Formant shift ratio ≈ from spectral-centroid ratio (clamped 0.85–1.25) → distribute across F1/F2/F3 anchors.
   - LP cutoff, ring-mod amount, breathiness from HNR/tilt deltas.
5. Confidence = similarity-weighted match (F0 closeness, tilt, pace); display honestly ("Good vibe match" / "Rough match").

**Guardrail:** matcher emits DSP recipes only — never trained-model clones.
