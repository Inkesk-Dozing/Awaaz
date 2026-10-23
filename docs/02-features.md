# 02 — Master Feature List

Tags: **`[v1]`** = Week-1 scope · **`[post-v1]`** = designed, parked for later.

## Pillar 1 — Voice Changer Studio

### A. Morph presets (one-click voices)

| ID | Feature | Tag |
|----|---------|-----|
| A1 | Male ↔ Female gender morph (pitch + formant combined) | v1 |
| A2 | Androgyny slider (continuous masculine↔neutral↔feminine) | v1 |
| A3 | Age morph (Child / Adult / Elderly) | post-v1 |
| A4 | Chipmunk / Demon (±12 semitone extremes) | v1 |
| A5 | Robot / Cyborg (ring-mod + bitcrush + metallic EQ) | v1 |
| A6 | Radio Operator (300–3000 Hz band + static + squelch) | v1 |
| A7 | Alien / Monster (pitch-down + growl + reverb) | post-v1 |
| A8 | Ghost / Whisper-demon | post-v1 |
| A9 | Character presets (News Anchor, DJ, Villain, Wizard) | post-v1 |
| A10 | Novelty spaces (Underwater, Muffled, Far-phone) | post-v1 |

### B. Pro controls

| ID | Feature | Tag |
|----|---------|-----|
| B1 | Independent pitch (semitones) + formant (VTL) sliders | v1 |
| B2 | Tempo/speed without pitch change (time-stretch) | post-v1 |
| B3 | Breathiness / rasp dial | post-v1 |
| B4 | Reverb space picker (cave, hall, bathroom) | post-v1 |
| B5 | Harmony / detuned double | post-v1 |
| B6 | Vocoder mode (synth carrier) | post-v1 |

### C. Studio UX

| ID | Feature | Tag |
|----|---------|-----|
| C1 | Live monitor (headphones-only, feedback-safe) | v1 |
| C2 | Instant preset switching (hotkeys) | v1 |
| C3 | Smooth crossfade between presets (no clicks) | v1 |
| C4 | Record + export morphed audio (.webm/.wav) | v1 |
| C5 | Voice Print Card (spectrogram art, real vs masked) | post-v1 |
| C6 | Preset sharing via URL/code | v1 |
| C7 | Background sound beds (static, crowd, thunder) | post-v1 |
| C8 | Soundboard stingers while talking | post-v1 |

### G. Celebrity & character packs

| ID | Feature | Tag |
|----|---------|-----|
| G1 | "Inspired-by" archetypes (Wise Narrator, Action Hero, Posh Royal, Cowboy, Auctioneer, Opera Star, Cartoon Mouse, Villain) — DSP presets, **no real celebrity names/likenesses** | v1 |
| G2 | Pack UI with 1-tap audition tiles | v1 |
| G3 | Vibrato / growl / pace sub-dials per pack | post-v1 |

### H. Voice Twin Matcher

| ID | Feature | Tag |
|----|---------|-----|
| H1 | Sample-to-preset matcher: analyze 5–10 s of any voice → generate nearest-match DSP recipe for your mic | v1 |
| H2 | Match-confidence meter (honest "vibe match" rating) | v1 |
| H3 | Community preset-code export/import | v1 |

### I. True AI voice cloning (roadmap, flagged)

| ID | Feature | Tag |
|----|---------|-----|
| I1 | On-device RVC-style voice conversion (WebGPU/WASM) — heavy, not in $0 v1 | post-v1 |
| I2 | Consent/likeness guardrails, AI-clone audible watermark, ban clones in lie-detector mode | post-v1 (mandatory if I1 ships) |

## Pillar 2 — Lie Detector Arena

### D. Polygraph engine

| ID | Feature | Tag |
|----|---------|-----|
| D1 | YIN pitch tracking (F0), 20–40 ms, sub-sample precision | v1 |
| D2 | Jitter (local + RAP) with Praat-style outlier filters | v1 |
| D3 | Shimmer (local + dB) from per-period peak amplitudes | v1 |
| D4 | Pitch-drift vs personal baseline (Hz + semitones) | v1 |
| D5 | HNR (harmonics-to-noise) | v1 |
| D6 | 8–12 Hz micro-tremor band | v1 |
| D7 | F0 variability (1 s SD) | post-v1 |
| D8 | Spectral tilt / alpha ratio | post-v1 |
| D9 | VAD + pause analytics (silence %, longest pause, count) | v1 |
| D10 | Response latency (question display → mic onset) | v1 |
| D11 | Speech-rate estimator (envelope peaks) | v1 |
| D12 | Startle / FLINCH detection (>12 dB jump in 150 ms) | v1 |
| D13 | Signal-quality gate (adaptive noise floor, "metrics unreliable") | v1 |
| D14 | Per-player calibration (15 s baseline → z-scores) | v1 |
| D15 | Deception composite (sigmoid + bounded drama noise, 0–100) | v1 |
| D16 | Verdict engine (TRUTH / UNSTABLE / DECEPTION + confidence) | v1 |
| D17 | 15–30 Hz telemetry stream over DataChannel | v1 |
| D18 | Detector accuracy tracking (post-game) | v1 |
| D19 | Baseline re-anchoring across rounds | post-v1 |

### C-hud. Live polygraph HUD

| ID | Feature | Tag |
|----|---------|-----|
| HU1 | Jitter needle gauge (green/yellow/red) | v1 |
| HU2 | Pitch-drift dial | v1 |
| HU3 | Tremor strip-chart (polygraph-paper look) | v1 |
| HU4 | Deception probability bar with confidence shading | v1 |
| HU5 | Pause/hesitation timeline ribbon | v1 |
| HU6 | FLINCH event popups | v1 |
| HU7 | Spectrogram waterfall | post-v1 |
| HU8 | Hot-seat vs spectator ("fog of war") view toggle | v1 |
| HU9 | Signal-quality badge | v1 |
| HU10 | RELAY badge (TURN active) | v1 |
| HU11 | Mobile portrait layout | v1 |

### E. Multiplayer party games

| ID | Feature | Tag |
|----|---------|-----|
| E1 | The Masked Interrogation (flagship, 3–6 players, 4-letter codes) | v1 |
| E2 | Two Truths & a Lie | post-v1 |
| E3 | Lie-Off duel | post-v1 |
| E4 | Beat the Box (solo polygraph challenge) | post-v1 |
| E5 | Whisper Round | post-v1 |
| E6 | Cadence Duel | post-v1 |
| E7 | Impostor Mode (full social-deduction, scenario decks) | v1 (same as E1 core) |
| E8 | Mask-Crack real-voice leak mechanic | post-v1 |
| E9 | Player stats (composure, fooled-detector %, votes survived) | v1 |

### F. Solo coaching tools

| ID | Feature | Tag |
|----|---------|-----|
| F1 | Public-speaking trainer (fillers, pauses, rate, pitch variety) | post-v1 |
| F2 | Interview practice + composure report | post-v1 |
| F3 | Vocal-health diary (jitter/shimmer trend; not-a-medical-device) | post-v1 |
| F4 | Stress journal | post-v1 |

## Pillar 3 — Platform

| ID | Feature | Tag |
|----|---------|-----|
| P1 | Zero install / zero signup / one URL | v1 |
| P2 | $0 hosting (static + PeerJS Cloud + Open Relay TURN) | v1 |
| P3 | Privacy: audio only P2P; analysis local | v1 |
| P4 | 3–6 player rooms, instant 4-letter codes | v1 |
| P5 | Desktop-first, mobile works | v1 |
| P6 | Works solo (studio + matchmaking) | v1 |
| P7 | Host-authoritative state, auto-reconnect | v1 |
| P8 | ICE + TURN fallback with RELAY badge | v1 |

## v1 cut (Week-1 checklist)

A1, A2, A4–A6 · B1 · C1–C4, C6 · G1, G2, H1–H3 · D1–D6, D9–D18 · HU1–HU6, HU8–HU11 · E1, E7, E9 · P1–P8
