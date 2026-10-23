import { describe, it, expect } from 'vitest';
import { computeBaseline, MetricSnapshot } from '../../src/audio/dsp/baseline';
import { CALIBRATION_SCRIPT } from '../../src/ui/pages/CalibrationPage';

describe('15-Second Guided Calibration Protocol (Issue #12)', () => {
  it('validates calibration reading script contents', () => {
    expect(CALIBRATION_SCRIPT.length).toBeGreaterThan(100);
    expect(CALIBRATION_SCRIPT).toContain('rainbow');
  });

  it('computes personal baseline and guarantees non-zero standard deviations', () => {
    const mockSnapshots: MetricSnapshot[] = [];
    for (let i = 0; i < 150; i++) {
      mockSnapshots.push({
        pitch: 130 + (i % 5) - 2,
        jitter: 0.006 + (i % 3) * 0.0005,
        shimmer: 0.035 + (i % 4) * 0.002,
        hnr: 21.0 + (i % 2) * 0.5,
      });
    }

    const baseline = computeBaseline(mockSnapshots);
    expect(baseline.sampleCount).toBe(150);
    expect(baseline.meanPitch).toBeGreaterThan(120);
    expect(baseline.stdPitch).toBeGreaterThan(0);
    expect(baseline.stdJitter).toBeGreaterThan(0);
    expect(baseline.stdShimmer).toBeGreaterThan(0);
    expect(baseline.stdHNR).toBeGreaterThan(0);
  });

  it('handles empty snapshots with safe fallback baseline', () => {
    const fallback = computeBaseline([]);
    expect(fallback.sampleCount).toBe(0);
    expect(fallback.meanPitch).toBe(180);
    expect(fallback.stdPitch).toBeGreaterThan(0);
  });
});
