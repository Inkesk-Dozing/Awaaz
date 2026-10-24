# 11 — Voice Output Calibration (Pro Guide)

How Awaaz stages levels and masters the morphed voice for **consistent, clip-free, broadcast-style output** over WebRTC. Borrowed patterns from [VoiceStudio](research/voicestudio/README.md) research notes.

---

## 1. Why calibrate the output

The morph chain is not level-neutral:

- Formant peaking filters add **+2.5 to +6 dB** at specific bands.
- Pitch shifting redistributes energy; Robot ring-mod and Radio bandpass change loudness further.
- Different mics/devices sit at wildly different raw levels (−30 dBFS quiet lav vs −6 dBFS hot USB).

Without staging, WebRTC receives a signal that is either too quiet (peer cranks volume → hears noise floor) or slamming full-scale (encoder distortion).

## 2. Operating targets

| Point | Target | Notes |
|-------|--------|-------|
| Input (raw mic, voiced) | **−18 dBFS RMS** | Leaves headroom for formant boosts |
| Output (post-stage, spoken) | **−16 dBFS RMS** | Broadcast profile default |
| Peak ceiling | **≤ −1.0 dBFS** | Soft-limited; codec overshoot margin |

Profiles (`src/audio/mastering/targets.ts`):

| Profile | RMS | Peak ceiling | Compressor | Saturation |
|---------|-----|--------------|------------|------------|
| **Broadcast** (default) | −16 dBFS | −1.0 dBFS | 3:1 @ −18 dB, 10/200 ms | 1.15 |
| **Clean** | −18 dBFS | −1.5 dBFS | 2:1 @ −14 dB, 20/250 ms | 1.00 |
| **Punchy** | −14 dBFS | −0.5 dBFS | 4:1 @ −20 dB, 5/150 ms | 1.35 |

UI: **Studio → Manual DSP Overrides → Output Mastering Profile**.

## 3. Output stage signal path

```
pitch → F1 → F2 → F3 → LP → FX (robot | radio | bypass)
     → saturator (gentle tanh, drive 1.05)
     → OutputStage: preGain → compressor → makeup → soft-clip limiter
     → destination (WebRTC) + monitor tap
```

Implemented in `src/audio/morph/MorphChain.ts` + `src/audio/mastering/outputStage.ts`.

## 4. Calibration procedure

**Where:** Calibration page → section **2 · OUTPUT LEVEL (PRO MASTERING)**.

1. Unlock audio + grant mic (existing studio flow).
2. Press **Calibrate Output Level**.
3. Speak naturally for ~4 s (voiced frames only are measured).
4. `measureVoicedLevels` samples raw + morphed analysers in parallel.
5. `solveOutputCalibration` computes:
   - **preGainDb** = −18 − inputRms (clamped ±18 / −12 dB)
   - **makeupGainDb** = −16 − (outputRms + preGain) (clamped ±12 dB)
   - **peak guard**: if peak + gains > −1 dBFS, makeup is reduced
6. Profile is applied to `OutputStage`, saved to the Zustand store + `localStorage` (`awaaz.outputProfile`).

### Reading the result badge

```
✓ OUTPUT: pre +6.2 dB · makeup −1.0 dB · q=0.91
```

- **pre** — input staging gain.
- **makeup** — output makeup after compressor.
- **q** — quality heuristic 0..1 (penalizes clipping, silence, extreme clamps).
- Amber text → `clamped: true` → a gain hit a safety bound; check mic distance/gain.

## 5. Honest limitations

- **Clipping at the ADC cannot be fixed** by digital gains. If quality notes say “Mic may be clipping,” lower mic hardware gain.
- WebRTC peers may apply their own playback volume; our targets normalize *send* level only.
- Calibration assumes you speak near your normal game volume — screaming into the mic will still clamp.
- No true LUFS metering in v1 (RMS/peak approximation is sufficient for chat).

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Badge amber, “Input gain clamped” | Mic extremely quiet or hot | Fix mic gain, recalibrate |
| Peer hears distortion | Monitoring loop / clipping upstream | Reduce mic gain; check OS input level |
| Output jumps between masks | Mask FX loudness differences | Recalibrate after settling on a mask family; compressor absorbs most of it |
| No voiced frames measured | Silence threshold too high or didn't speak | Recalibrate, speak louder for the full 4 s |

## 7. Related

- [05 — Audio DSP spec](05-audio-dsp-spec.md) — morph algorithms
- [04 — Architecture](04-architecture.md) — graph wiring
- [Research: VoiceStudio audio quality](research/voicestudio/audio-quality.md)
