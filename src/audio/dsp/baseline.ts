/**
 * Personal Vocal Baseline & Z-Score Normalization Engine.
 * Normalizes acoustic perturbation metrics against per-participant 15-second neutral readings.
 */

export interface VocalBaseline {
  meanPitch: number;
  stdPitch: number;
  meanJitter: number;
  stdJitter: number;
  meanShimmer: number;
  stdShimmer: number;
  meanHNR: number;
  stdHNR: number;
  sampleCount: number;
}

export interface MetricSnapshot {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
}

export function computeBaseline(snapshots: MetricSnapshot[]): VocalBaseline {
  const N = snapshots.length;
  if (N === 0) {
    return {
      meanPitch: 180,
      stdPitch: 20,
      meanJitter: 0.8,
      stdJitter: 0.3,
      meanShimmer: 3.5,
      stdShimmer: 1.0,
      meanHNR: 20,
      stdHNR: 3.0,
      sampleCount: 0
    };
  }

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) =>
    Math.sqrt(arr.reduce((acc, val) => acc + (val - m) ** 2, 0) / Math.max(1, arr.length - 1));

  const pitches = snapshots.map((s) => s.pitch).filter((p) => p > 50);
  const jitters = snapshots.map((s) => s.jitter);
  const shimmers = snapshots.map((s) => s.shimmer);
  const hnrs = snapshots.map((s) => s.hnr);

  const mPitch = pitches.length > 0 ? mean(pitches) : 180;
  const mJitter = mean(jitters);
  const mShimmer = mean(shimmers);
  const mHNR = mean(hnrs);

  return {
    meanPitch: mPitch,
    stdPitch: Math.max(5.0, pitches.length > 1 ? std(pitches, mPitch) : 15.0),
    meanJitter: mJitter,
    stdJitter: Math.max(0.1, std(jitters, mJitter)),
    meanShimmer: mShimmer,
    stdShimmer: Math.max(0.2, std(shimmers, mShimmer)),
    meanHNR: mHNR,
    stdHNR: Math.max(0.5, std(hnrs, mHNR)),
    sampleCount: N
  };
}

export function computeZScore(value: number, mean: number, std: number): number {
  const safeStd = Math.max(1e-4, std);
  return (value - mean) / safeStd;
}
