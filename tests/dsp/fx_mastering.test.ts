import { describe, it, expect } from 'vitest';
import {
  buildTanhCurve,
  buildBitcrushCurve,
} from '../../src/audio/morph/fx/saturation';
import { OUTPUT_PROFILES, DEFAULT_OUTPUT_PROFILE } from '../../src/audio/mastering/targets';

describe('saturation curves', () => {
  it('tanh curve endpoints map near ±ceiling', () => {
    const curve = buildTanhCurve(1.5, 1);
    expect(curve[0]).toBeLessThanOrEqual(0);
    expect(curve[curve.length - 1]).toBeGreaterThan(0);
    expect(Math.abs(curve[0])).toBeCloseTo(1, 1);
    expect(Math.abs(curve[curve.length - 1])).toBeCloseTo(1, 1);
  });

  it('bitcrush curve is monotonic staircase within [-1,1]', () => {
    const curve = buildBitcrushCurve(4);
    expect(curve[0]).toBeGreaterThanOrEqual(-1.01);
    expect(curve[curve.length - 1]).toBeLessThanOrEqual(1.01);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1] - 1e-6);
    }
  });
});

describe('output profiles', () => {
  it('broadcast is default and has sane targets', () => {
    expect(DEFAULT_OUTPUT_PROFILE.id).toBe('broadcast');
    expect(DEFAULT_OUTPUT_PROFILE.targetOutputRmsDb).toBeLessThanOrEqual(0);
    expect(DEFAULT_OUTPUT_PROFILE.peakCeilingDb).toBeLessThanOrEqual(0);
  });

  it('all profiles have positive compressor ratios', () => {
    Object.values(OUTPUT_PROFILES).forEach((p) => {
      expect(p.compressorRatio).toBeGreaterThan(1);
      expect(p.saturationDrive).toBeGreaterThan(0);
    });
  });
});
