import { describe, it, expect } from 'vitest';
import {
  bandpassCoeffs,
  applyBiquad,
  bandEnergies,
  spectralTilt,
  meanSquare,
} from '../../src/audio/dsp/bands';

function sine(freq: number, sampleRate: number, seconds: number, amp = 1): Float32Array {
  const n = Math.floor(sampleRate * seconds);
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    buf[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

describe('spectral bands', () => {
  it('bandpass coefficients are finite', () => {
    const c = bandpassCoeffs(48000, 1000, 0.7);
    expect(Number.isFinite(c.b0)).toBe(true);
    expect(Number.isFinite(c.a1)).toBe(true);
  });

  it('applyBiquad preserves length', () => {
    const x = sine(440, 48000, 0.05);
    const y = applyBiquad(x, bandpassCoeffs(48000, 440, 1));
    expect(y.length).toBe(x.length);
    expect(meanSquare(y)).toBeGreaterThan(0);
  });

  it('low sine has higher low/high tilt than high sine', () => {
    const low = sine(200, 48000, 0.1);
    const high = sine(3500, 48000, 0.1);
    const tiltLow = spectralTilt(low, 48000);
    const tiltHigh = spectralTilt(high, 48000);
    expect(tiltLow).toBeGreaterThan(tiltHigh);
  });

  it('bandEnergies reports positive energy for mid sine', () => {
    const mid = sine(1500, 48000, 0.1);
    const e = bandEnergies(mid, 48000);
    expect(e.mid).toBeGreaterThan(0);
    expect(e.low).toBeGreaterThanOrEqual(0);
    expect(e.high).toBeGreaterThanOrEqual(0);
  });
});
