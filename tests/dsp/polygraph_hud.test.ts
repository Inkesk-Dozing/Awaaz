import { describe, it, expect } from 'vitest';
import { computeStressComposite } from '../../src/audio/dsp/stress';

describe('Polygraph HUD integration tests', () => {
  it('computes expected composite stress score and confidence', () => {
    const baseline = {
      meanPitch: 120,
      stdPitch: 8,
      meanJitter: 0.005,
      stdJitter: 0.001,
      meanShimmer: 0.03,
      stdShimmer: 0.008,
      meanHNR: 22,
      stdHNR: 2,
    };

    const calmInput = {
      pitch: 122,
      jitter: 0.005,
      shimmer: 0.031,
      hnr: 21.8,
      tremor: 0.02,
    };

    const calmRes = computeStressComposite(calmInput, baseline);
    expect(calmRes.verdict).toBe('TRUTH');
    expect(calmRes.compositeScore).toBeLessThan(40);

    const stressedInput = {
      pitch: 165,
      jitter: 0.025,
      shimmer: 0.095,
      hnr: 12.0,
      tremor: 0.45,
    };

    const stressedRes = computeStressComposite(stressedInput, baseline);
    expect(stressedRes.verdict).toBe('DECEPTION');
    expect(stressedRes.compositeScore).toBeGreaterThanOrEqual(65);
    expect(stressedRes.confidence).toBeGreaterThan(0.5);
  });
});
