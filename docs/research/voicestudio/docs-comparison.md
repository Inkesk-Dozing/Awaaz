# Docs Comparison: VoiceStudio vs Awaaz

## VoiceStudio docs tree (reference)

```
docs/
  feature-catalog.md        # capability matrix
  audio-quality.md          # mastering, export precision, signal checks
  performance.md            # where time goes, knobs, budgets
  benchmarks.md             # measured engine numbers
  speech-platform.md        # local API
  engines/README.md + per-engine guides
  install/ (macos, windows, linux, docker, troubleshooting, agent)
  licensing/ (model inventory)
  mobile.md, mcp.md, electron-migration.md …
```

Strengths: every knob documented with *when it applies*; honest "measured vs claimed" labels; per-engine guides; signal-check semantics spelled out.

## Awaaz docs tree (current)

```
docs/
  README.md                 # index
  01-product-overview.md
  02-features.md
  03-roadmap.md
  04-architecture.md
  05-audio-dsp-spec.md
  06-multiplayer-net.md
  07-game-design.md
  08-testing-strategy.md
  09-deployment-and-cost.md
  10-risk-register.md
  11-voice-output-calibration.md      # NEW
  research/
    voicestudio/                     # NEW — this folder
      README.md
      audio-quality.md
      engine-catalog.md
      performance-and-metrics.md
      docs-comparison.md
```

## Gaps identified & actions

| Gap | Action |
|-----|--------|
| No dedicated **audio quality / calibration** guide | ✅ `docs/11-voice-output-calibration.md` |
| No research trail for external references | ✅ `docs/research/voicestudio/` |
| Architecture graph lagged code (Tone-only, phantom `vad.ts`) | ✅ updated `04-architecture.md` |
| DSP spec didn't document output stage / real FX wiring | ✅ updated `05-audio-dsp-spec.md` |
| No feature row for output mastering | ✅ `02-features.md` updated |
| No test coverage notes for new modules | ✅ `08-testing-strategy.md` updated |
| Per-engine guides | Future: per-mask "guides" only if catalog grows; DSP spec sections cover it for v1 |
| Honest measurement budgets | Post-v1: add to `08-testing-strategy.md` |
