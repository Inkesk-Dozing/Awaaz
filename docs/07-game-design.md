# 07 — Game Design

## Flagship mode: The Masked Interrogation (E1)

**Players:** 3–6. **One URL, 4-letter code, no signup.**

### Loop

```
Lobby → Calibration → Disguise → Role Deal → Interrogation → Verdict → Vote → Reveal → (Rematch | Exit)
```

1. **Lobby** — mic check, headphone check, nickname, roster, entertainment disclaimer.
2. **Calibration (15 s)** — everyone reads a neutral script; builds personal baselines (stays on-device).
3. **Disguise** — pick/lock a mask; live preview (headphones only).
4. **Role Deal** — host secretly assigns **1 Saboteur** (sees a truth card with the facts); rest are **Crew**.
5. **Interrogation** — hot seat answers a deck of **5 questions × 20–40 s**. Live polygraph HUD for everyone. Saboteur must lie; crew must answer truthfully.
6. **Verdict** — composite score flash: **TRUTH / UNSTABLE / DECEPTION DETECTED** with confidence shading.
7. **Vote** — 15 s anonymous room vote: eject or acquit.
8. **Reveal / Next** — ejected player's role revealed; scores update; hot seat rotates; play to N rounds (default 3).

### Win conditions
- Crew wins by ejecting the saboteur before the final round.
- Saboteur wins by surviving all rounds.
- Early eject of a crew member = dramatic setback for crew (detector was wrong — that's the joke).

### Individual scoring (E9)
| Stat | Source |
|------|--------|
| Composure | 100 − mean composite during your hot seat |
| Fooled-the-detector % | rounds where verdict said TRUTH but you were saboteur |
| Votes survived | count |
| Detector accuracy (global) | % of accusations matching true role — shown post-game |

### HUD views
- **Hot-seat view:** full gauges (their own live stress → meta-stress, intentional).
- **Spectator view:** composite bar + FLINCH events (+ optional fog-of-war mode: composite only).

### Scenario decks (≥3 in v1)
Each scenario = lore intro + 5 questions mixing factual, timing, and pressure beats.

1. **Vault Breach** — "The vault opened at 03:00. One of you had keycard access."
2. **The Leak** — "Confidential docs hit the net yesterday. Who had the files?"
3. **Stolen Prototype** — "The demo unit vanished from the lab. Everyone was in the building."

Question style guide: short, closed, escalating pressure ("Where were you?", "Did you touch the terminal?", "Why did your badge ping twice?"). Host can reorder randomly per round.

### Balance levers (Phase 5)
- Drama-noise amplitude (±8 default).
- Verdict band cutoffs (40 / 65).
- Weight vector w1..w5.
- Question time boxes.
- Sanity targets after playtests: calm-truth ≈ 25–40, panicked-truth ≈ 50–70, calm-lying ≈ 45–75.

---

## Post-v1 modes (designed)

| Mode | Twist |
|------|-------|
| **Mask-Crack (E8)** | z-stress > threshold for 400 ms → 300 ms crossfade leaks REAL unmasked voice |
| **Two Truths & a Lie (E2)** | meter tries to flag which statement was false |
| **Lie-Off (E3)** | two hot seats; comparative stress decides |
| **Beat the Box (E4)** | solo: stay calm under recorded grilling |
| **Whisper Round (E5)** | whispered answers; HNR/shimmer-weighted scoring |
| **Cadence Duel (E6)** | speech-rate/pause control contest |
| **Impostor Mode (E7)** | full multi-round social deduction (v1 E1 is the base implementation) |

---

## Tone & fairness rules

- The detector is an **imperfect dramatic accuser** — post-game accuracy stats celebrate (and deflate) it.
- Never present verdicts as fact: use game-show language ("The box says…").
- Baselines are per-player; no global thresholds that punish quiet mics.
- If signal quality is low, the HUD must say so rather than inventing drama.
