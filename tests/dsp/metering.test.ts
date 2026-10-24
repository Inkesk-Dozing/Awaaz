import { describe, it, expect } from 'vitest';
import {
  linearToDb,
  dbToLinear,
  rmsDbfs,
  peakDbfs,
  PeakRmsMeter,
} from '../../src/audio/mastering/metering';

describe('metering', () => {
  it('converts linear ↔ dBFS correctly', () => {
    expect(linearToDb(1)).toBeCloseTo(0, 5);
    expect(linearToDb(0.5)).toBeCloseTo(-6.02, 1);
    expect(dbToLinear(0)).toBeCloseTo(1, 5);
    expect(dbToLinear(-6.02)).toBeCloseTo(0.5, 2);
  });

  it('measures RMS of a full-scale sine near -3 dBFS', () => {
    const n = 4096;
    const sine = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      sine[i] = Math.sin((2 * Math.PI * i) / 64);
    }
    // RMS of unit sine = 1/√2 ≈ -3.01 dBFS
    expect(rmsDbfs(sine)).toBeCloseTo(-3.01, 1);
    expect(peakDbfs(sine)).toBeCloseTo(0, 2);
  });

  it('returns silence floor for empty buffers', () => {
    expect(rmsDbfs(new Float32Array(0))).toBeLessThanOrEqual(-160);
  });

  it('PeakRmsMeter accumulates peak and rms', () => {
    const m = new PeakRmsMeter();
    const buf = new Float32Array(100).fill(0.1);
    m.push(buf);
    expect(m.peakDb()).toBeCloseTo(-20, 1);
    expect(m.rmsDb()).toBeCloseTo(-20, 1);
    m.reset();
    expect(m.samples).toBe(0);
  });
});
