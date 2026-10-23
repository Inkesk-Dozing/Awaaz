import { describe, it, expect } from 'vitest';
import { jitterLocal, jitterRAP } from '../../src/audio/dsp/jitter';
import { shimmerLocal, shimmerDB } from '../../src/audio/dsp/shimmer';
import { calculateHNR } from '../../src/audio/dsp/hnr';
import { calculateTremor } from '../../src/audio/dsp/tremor';
import { computeBaseline } from '../../src/audio/dsp/baseline';
import { computeStressComposite } from '../../src/audio/dsp/stress';

describe('Jitter Perturbation Engine', () => {
  it('returns near 0 jitter for identical cycle periods', () => {
    const steadyPeriods = [200, 200, 200, 200, 200, 200];
    expect(jitterLocal(steadyPeriods)).toBe(0);
    expect(jitterRAP(steadyPeriods)).toBe(0);
  });

  it('accurately computes local jitter on perturbed periods', () => {
    // 200 +/- 2 samples (1% jitter)
    const perturbed = [200, 202, 198, 202, 198, 200];
    const jLocal = jitterLocal(perturbed);
    expect(jLocal).toBeGreaterThan(0.5);
    expect(jLocal).toBeLessThan(2.0);
  });
});

describe('Shimmer Perturbation Engine', () => {
  it('returns 0 shimmer for unvarying amplitudes', () => {
    const steadyAmps = [0.8, 0.8, 0.8, 0.8, 0.8];
    expect(shimmerLocal(steadyAmps)).toBe(0);
    expect(shimmerDB(steadyAmps)).toBe(0);
  });

  it('detects amplitude modulation perturbation in dB', () => {
    const modulatedAmps = [0.8, 0.9, 0.75, 0.85, 0.78];
    const sDB = shimmerDB(modulatedAmps);
    expect(sDB).toBeGreaterThan(0.3);
  });
});

describe('HNR & Tremor Engines', () => {
  it('yields high HNR (> 25 dB) for clean harmonic correlation', () => {
    expect(calculateHNR(0.998)).toBeGreaterThan(25);
  });

  it('yields low HNR (< 5 dB) for noisy aspiration', () => {
    expect(calculateHNR(0.5)).toBeLessThan(5);
  });

  it('detects tremor variance in fluctuating contour', () => {
    const contour = [200, 205, 195, 208, 192, 204];
    expect(calculateTremor(contour)).toBeGreaterThan(5);
  });
});

describe('Baseline & Deception Composite Synthesis', () => {
  const mockSnapshots = [
    { pitch: 180, jitter: 0.6, shimmer: 2.5, hnr: 22 },
    { pitch: 182, jitter: 0.7, shimmer: 2.6, hnr: 21 },
    { pitch: 178, jitter: 0.65, shimmer: 2.4, hnr: 23 }
  ];

  const baseline = computeBaseline(mockSnapshots);

  it('produces TRUTH verdict when participant matches baseline calm metrics', () => {
    const calmInput = {
      pitch: 180,
      jitter: 0.65,
      shimmer: 2.5,
      hnr: 22,
      tremor: 0.5
    };
    const result = computeStressComposite(calmInput, baseline);
    expect(result.compositeScore).toBeLessThan(40);
    expect(result.verdict).toBe('TRUTH');
  });

  it('produces DECEPTION verdict when severe jitter and shimmer spikes occur', () => {
    const stressedInput = {
      pitch: 230,     // High pitch drift (+2.5 z-score)
      jitter: 2.8,    // High jitter spike (+7 z-score)
      shimmer: 8.5,   // High shimmer
      hnr: 12,        // Significant breathiness drop
      tremor: 4.2
    };
    const result = computeStressComposite(stressedInput, baseline);
    expect(result.compositeScore).toBeGreaterThanOrEqual(65);
    expect(result.verdict).toBe('DECEPTION');
  });

  it('bounds composite score strictly between 0 and 100 with drama noise', () => {
    const extremeInput = {
      pitch: 400,
      jitter: 15.0,
      shimmer: 25.0,
      hnr: 2,
      tremor: 20
    };
    const resultMax = computeStressComposite(extremeInput, baseline, 8.0);
    expect(resultMax.compositeScore).toBeLessThanOrEqual(100);

    const calmInput = {
      pitch: 180,
      jitter: 0.1,
      shimmer: 0.5,
      hnr: 35,
      tremor: 0.01
    };
    const resultMin = computeStressComposite(calmInput, baseline, -8.0);
    expect(resultMin.compositeScore).toBeGreaterThanOrEqual(0);
  });
});
