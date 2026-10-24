# 04 — Architecture

## High-level model

- **Client-only SPA** (Vite + React + TypeScript). No backend.
- **Audio:** Web Audio API; morphing on the transmit path, analysis on the raw path.
- **Networking:** PeerJS (WebRTC). Room host is authoritative for game state. Audio is full-mesh P2P; telemetry is a star to the host.
- **State:** Zustand store on each client; host mirrors the canonical game FSM.

```
[Player A browser]                          [Player B browser]
 ├─ Mic (raw)                                 ├─ Mic (raw)
 ├─ Analyser (raw → stress metrics)          ├─ Analyser (raw → stress metrics)
 ├─ Morph chain (pitch→formants→FX)          ├─ Morph chain
 ├─ HUD (local + remote telemetry)           ├─ HUD
 └─► WebRTC audio (disguised) ───────────────►┘
 └─► DataChannel telemetry (→ host, 15 Hz) ──► host ──re-broadcast──► all
 └─► DataChannel game events (bidirectional with host)
```

## Folder tree

```
src/
  audio/
    VoiceEngine.ts          // graph wiring, init, teardown, output taps
    calibration/
      outputCalibration.ts  // PURE solver: levels → pre-gain + makeup recipe
      measure.ts            // dual-analyser voiced measurement (rAF loop)
    mastering/
      outputStage.ts        // preGain → compressor → makeup → soft-clip limiter
      metering.ts           // peak/RMS dBFS helpers (pure)
      targets.ts            // Broadcast/Clean/Punchy profiles + default targets
    morph/
      masks.ts              // preset table (pitch, formants, FX)
      matcher.ts            // Voice Twin Matcher (sample → recipe)
      MorphChain.ts         // full routing graph incl. FX insert + OutputStage
      RubberBandNode.ts     // C++ WASM pitch/tempo worklet wrapper
      fx/
        robotFx.ts          // ring-mod + bitcrush insert
        radioFx.ts          // bandpass window + static bed
        saturation.ts       // tanh/bitcrush curve builders
    dsp/                    // PURE functions — unit-tested, future WASM seam
      yin.ts
      pulses.ts
      bands.ts              // RBJ bandpass + spectral tilt (matcher)
      jitter.ts
      shimmer.ts
      hnr.ts
      tremor.ts
      pauses.ts
      speechRate.ts
      flinch.ts
      baseline.ts           // calibration profiles (stress)
      stress.ts             // z-scores, sigmoid, dramaNoise composite
  net/
    PeerNet.ts              // PeerJS wrapper: host/join, mesh audio, star data
    protocol.ts             // typed, versioned message types
    clock.ts                // ping/pong offset estimation
  game/
    fsm.ts                  // host-authoritative state machine
    roles.ts
    scenarios/              // deck JSON/TS modules
    questions.ts
    scoring.ts
  ui/
    pages/                  // Home, Lobby, Calibration, Disguise, Game, Reveal
    hud/                    // PolygraphHUD, Gauge, StripChart, QualityBadge
  state/
    store.ts                // zustand slices (baseline + output profile, persisted)
tests/
  dsp/                      // vitest fixtures & synthetic-signal tests
```

## VoiceEngine graph (v1)

```
MediaStreamSource(mic, constraints all-false)
 ├─► AnalyserNode(fft 2048)                    // RAW path → dsp/* on main thread @ ~15 Hz
 ├─► PreMorphAnalyser                          // RAW tap for output calibration input RMS
 └─► PitchShift (RubberBand WASM preferred, Tone fallback ±6 st, window 0.05)
      └─► BiquadFilter F1 (peaking)            // formant anchors per mask
           └─► BiquadFilter F2 (peaking)
                └─► BiquadFilter F3 (peaking)
                     └─► BiquadFilter LP
                          └─► FX insert bus    // robot (ring-mod) | radio (bandpass+static) | bypass
                               └─► saturator   // gentle tanh warmth
                                    └─► OutputStage   // preGain → compressor → makeup → soft-clip
                                         ├─► MediaStreamDestination → WebRTC send
                                         ├─► OutputAnalyser (calibration output RMS/peak)
                                         └─► Monitor tap → (muted) Gain → speakers
```

Rules:
- Analysis **never** runs on the morphed signal.
- Local monitor (C1) is optional and off by default; if enabled, headphones-only, capped ≤ 0.7 gain.
- All DSP modules are pure functions over typed arrays → trivially portable to WASM later.
- Output stage & calibration: [11 — voice output calibration](11-voice-output-calibration.md).

## Data flow: telemetry → verdict

1. `dsp/*` produces `StressTelemetry` locally each frame.
2. Client sends `{type:'tel', ...}` to host (15 Hz).
3. Hot-seat client additionally renders its full local HUD in real time.
4. Host re-broadcasts hot-seat telemetry to spectators (10 Hz).
5. At question end, host computes nothing — **composite score is computed on the hot-seat client** (z-scores need its local baseline) and sent to host for verdict display; host validates plausibility (ranges) but trusts client numbers (accepted v1 tradeoff; noted in risks).

## State ownership

| State | Owner | Replication |
|-------|-------|-------------|
| Roster, slots, phase, question index, votes | Host | Snapshot on join + events |
| Baselines, private z-scores | Each client | Never leaves client |
| Composite score during answer | Hot-seat client | Sent to host at 10 Hz |
| Roles (saboteur) | Host | Private channel to saboteur only |

## Key types (sketch)

```ts
type Phase = 'lobby'|'calibration'|'disguise'|'deal'|'interrogation'|'verdict'|'vote'|'reveal';

interface StressTelemetry {
  pitch: number; jitter: number; shimmer: number; hnr: number;
  tremor: number; silenceRatio: number; quality: number; // 0..1
  isSpeaking: boolean;
}

interface Player { id: string; slot: number; name: string; maskId: string | null; connected: boolean; }
```
