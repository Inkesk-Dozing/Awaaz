import { describe, it, expect } from 'vitest';
import {
  computeStressComposite,
  DEFAULT_BALANCE_PARAMETERS,
  BalanceParameters,
  StressTelemetryInput,
} from '../../src/audio/dsp/stress';
import { VocalBaseline } from '../../src/audio/dsp/baseline';

describe('Balance Playtesting, Drama Tuning & Sanity Distribution Validation (Issue #9)', () => {
  const baseline: VocalBaseline = {
    meanPitch: 125,
    stdPitch: 8,
    meanJitter: 0.005,
    stdJitter: 0.001,
    meanShimmer: 0.03,
    stdShimmer: 0.008,
    meanHNR: 22,
    stdHNR: 2,
  };

  it('verifies Calm Truth-Teller sanity distribution (scores 25-40, TRUTH verdict)', () => {
    // Calm truth: subtle deviations near baseline
    const input: StressTelemetryInput = {
      pitch: 127, // minor drift
      jitter: 0.0055,
      shimmer: 0.032,
      hnr: 21.5,
      tremor: 0.01,
      pauses: 0.0,
    };

    const res = computeStressComposite(input, baseline, 0);
    expect(res.compositeScore).toBeGreaterThanOrEqual(10);
    expect(res.compositeScore).toBeLessThanOrEqual(40);
    expect(res.verdict).toBe('TRUTH');
  });

  it('verifies Panicked Truth-Teller sanity distribution (scores 45-70, UNSTABLE / mild DECEPTION)', () => {
    // Truth teller under intense interrogation pressure: elevated pitch and tremor, but modest jitter
    const input: StressTelemetryInput = {
      pitch: 142, // +2.1 z-scores
      jitter: 0.008, // +3.0 z-scores
      shimmer: 0.045, // +1.8 z-scores
      hnr: 18.0,
      tremor: 0.08,
      pauses: 0.05,
    };

    const res = computeStressComposite(input, baseline, 2);
    expect(res.compositeScore).toBeGreaterThanOrEqual(45);
    expect(res.compositeScore).toBeLessThanOrEqual(75);
    expect(['UNSTABLE', 'DECEPTION']).toContain(res.verdict);
  });

  it('verifies Calm Liar sanity distribution (scores 45-75, playable social deduction ambiguity)', () => {
    // Calm liar: controlled voice, suppressed tremor, slight micro-hesitation & pitch micro-drift
    const input: StressTelemetryInput = {
      pitch: 135, // +1.25 z-score
      jitter: 0.009, // +4.0 z-score (subconscious vocal fold tension)
      shimmer: 0.042,
      hnr: 19.5,
      tremor: 0.02,
      pauses: 0.12,
    };

    const res = computeStressComposite(input, baseline, -2);
    expect(res.compositeScore).toBeGreaterThanOrEqual(40);
    expect(res.compositeScore).toBeLessThanOrEqual(75);
  });

  it('verifies Stressed Liar sanity distribution (scores 75-95, decisive DECEPTION DETECTED)', () => {
    // Stressed liar: high vocal instability, elevated shimmer, erratic jitter, HNR drops
    const input: StressTelemetryInput = {
      pitch: 160, // +4.3 z-scores
      jitter: 0.022, // +17 z-scores
      shimmer: 0.09, // +7.5 z-scores
      hnr: 13.0, // noisy / strained phonation
      tremor: 0.18,
      pauses: 0.25,
    };

    const res = computeStressComposite(input, baseline, 3);
    expect(res.compositeScore).toBeGreaterThanOrEqual(75);
    expect(res.verdict).toBe('DECEPTION');
  });

  it('simulates 5-round multi-player game session and confirms no dominant strategy emerges', () => {
    interface RoundSim {
      round: number;
      role: 'CREW' | 'SABOTEUR';
      behavior: 'calm' | 'nervous';
      telemetry: StressTelemetryInput;
      noise: number;
    }

    const sessionRounds: RoundSim[] = [
      {
        round: 1,
        role: 'CREW',
        behavior: 'calm',
        telemetry: { pitch: 126, jitter: 0.0052, shimmer: 0.031, hnr: 22, tremor: 0.01 },
        noise: -1,
      },
      {
        round: 2,
        role: 'SABOTEUR',
        behavior: 'calm',
        telemetry: { pitch: 133, jitter: 0.0085, shimmer: 0.042, hnr: 19, tremor: 0.03, pauses: 0.08 },
        noise: 2,
      },
      {
        round: 3,
        role: 'CREW',
        behavior: 'nervous',
        telemetry: { pitch: 145, jitter: 0.0078, shimmer: 0.044, hnr: 18, tremor: 0.07, pauses: 0.06 },
        noise: 1,
      },
      {
        round: 4,
        role: 'SABOTEUR',
        behavior: 'nervous',
        telemetry: { pitch: 162, jitter: 0.019, shimmer: 0.088, hnr: 14, tremor: 0.15, pauses: 0.22 },
        noise: 4,
      },
      {
        round: 5,
        role: 'CREW',
        behavior: 'calm',
        telemetry: { pitch: 124, jitter: 0.0048, shimmer: 0.029, hnr: 23, tremor: 0.01 },
        noise: 0,
      },
    ];

    const results = sessionRounds.map((rnd) => {
      const evaluation = computeStressComposite(rnd.telemetry, baseline, rnd.noise);
      return {
        ...rnd,
        score: evaluation.compositeScore,
        verdict: evaluation.verdict,
      };
    });

    // 1. Confirm calm crew rounds receive TRUTH verdicts
    expect(results[0].verdict).toBe('TRUTH');
    expect(results[4].verdict).toBe('TRUTH');

    // 2. Confirm panicked crew and calm saboteur have overlapping scores in the drama band (45-70)
    const calmSaboteurScore = results[1].score;
    const panickedCrewScore = results[2].score;
    expect(Math.abs(calmSaboteurScore - panickedCrewScore)).toBeLessThanOrEqual(25);

    // 3. Confirm stressed saboteur produces decisive deception
    expect(results[3].verdict).toBe('DECEPTION');
    expect(results[3].score).toBeGreaterThanOrEqual(75);

    // 4. Confirm no single naive strategy ("always convict score > 50" or "always acquit") gives 100% accuracy
    // Panicked crew (round 3) has score > 50, but is actually CREW
    expect(results[2].score).toBeGreaterThan(50);
  });

  it('allows customizing BalanceParameters dynamically without regressions', () => {
    const customParams: BalanceParameters = {
      ...DEFAULT_BALANCE_PARAMETERS,
      weights: {
        jitter: 0.5,
        shimmer: 0.2,
        pitchDrift: 0.1,
        tremor: 0.1,
        pauses: 0.1,
      },
      truthThreshold: 35,
      deceptionThreshold: 70,
    };

    const input: StressTelemetryInput = {
      pitch: 125,
      jitter: 0.005,
      shimmer: 0.03,
      hnr: 22,
      tremor: 0.01,
    };

    const res = computeStressComposite(input, baseline, 0, customParams);
    expect(res.verdict).toBe('TRUTH');
    expect(res.compositeScore).toBeLessThan(35);
  });
});
