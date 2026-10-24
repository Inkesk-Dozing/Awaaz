import { describe, it, expect } from 'vitest';
import { solveOutputCalibration } from '../../src/audio/calibration/outputCalibration';

describe('solveOutputCalibration', () => {
  it('raises a quiet mic toward the input target', () => {
    const p = solveOutputCalibration({
      inputRmsDb: -30,
      outputRmsDb: -30,
      outputPeakDb: -20,
    });
    // target -18 - (-30) = +12
    expect(p.preGainDb).toBeCloseTo(12, 1);
    expect(p.clamped).toBe(false);
  });

  it('lowers a hot mic (negative pre-gain)', () => {
    const p = solveOutputCalibration({
      inputRmsDb: -6,
      outputRmsDb: -6,
      outputPeakDb: -1,
    });
    // target -18 - (-6) = -12
    expect(p.preGainDb).toBeCloseTo(-12, 1);
  });

  it('clamps pre-gain to bounds', () => {
    const p = solveOutputCalibration({
      inputRmsDb: -60,
      outputRmsDb: -60,
      outputPeakDb: -50,
    });
    expect(p.preGainDb).toBeLessThanOrEqual(18);
    expect(p.clamped).toBe(true);
    expect(p.notes.length).toBeGreaterThan(0);
  });

  it('reduces makeup when peak would exceed ceiling', () => {
    const p = solveOutputCalibration({
      inputRmsDb: -18,
      outputRmsDb: -30,
      outputPeakDb: -3,
      peakCeilingDb: -1,
    });
    // projected peak = -3 + 0 + makeup; makeup raw would be -16-(-30)=14 → clamped 12
    // projected peak after makeup 12: -3+12=9 > -1 → reduce by 10 → makeup ~2
    expect(p.makeupGainDb).toBeLessThanOrEqual(2.5);
    expect(p.clamped).toBe(true);
    // verify peak after final gains ≤ ceiling
    const finalPeak = -3 + p.preGainDb + p.makeupGainDb;
    expect(finalPeak).toBeLessThanOrEqual(-1 + 0.05);
  });

  it('produces quality < 1 when mic is near silent', () => {
    const p = solveOutputCalibration({
      inputRmsDb: -55,
      outputRmsDb: -55,
      outputPeakDb: -50,
    });
    expect(p.quality).toBeLessThan(0.7);
  });

  it('handles non-finite inputs safely', () => {
    const p = solveOutputCalibration({
      inputRmsDb: Number.NaN,
      outputRmsDb: Number.NaN,
      outputPeakDb: Number.NaN,
    });
    expect(Number.isFinite(p.preGainDb)).toBe(true);
    expect(Number.isFinite(p.makeupGainDb)).toBe(true);
  });
});
