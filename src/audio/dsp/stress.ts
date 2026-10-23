/**
 * Composite Stress & Deception Scoring Engine.
 * Combines z-score perturbations into a bounded 0-100 tension index with bounded drama noise.
 */

import { VocalBaseline, computeZScore } from './baseline';

export interface StressTelemetryInput {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  tremor: number;
}

export interface StressCompositeResult {
  compositeScore: number;     // Bounded 0 - 100
  verdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION';
  confidence: number;         // 0.0 - 1.0
  zScores: {
    pitch: number;
    jitter: number;
    shimmer: number;
    hnr: number;
  };
}

export function computeStressComposite(
  input: StressTelemetryInput,
  baseline: VocalBaseline,
  dramaNoise: number = 0
): StressCompositeResult {
  const zPitch = computeZScore(input.pitch, baseline.meanPitch, baseline.stdPitch);
  const zJitter = computeZScore(input.jitter, baseline.meanJitter, baseline.stdJitter);
  const zShimmer = computeZScore(input.shimmer, baseline.meanShimmer, baseline.stdShimmer);
  // Negative z-score for HNR indicates stress (more noise)
  const zHNR = -computeZScore(input.hnr, baseline.meanHNR, baseline.stdHNR);

  // Weight vector w_k emphasizing jitter, shimmer, pitch perturbation, and HNR drop
  const weightedSum =
    0.35 * Math.max(0, zJitter) +
    0.25 * Math.max(0, zShimmer) +
    0.20 * Math.max(0, zPitch) +
    0.20 * Math.max(0, zHNR);

  // Logistic Sigmoid mapping with midpoint at z = 1.5
  const rawSigmoid = 100 / (1 + Math.exp(-(weightedSum - 1.5) * 1.8));

  // Add bounded drama tension noise (clamped between -8 and +8)
  const boundedNoise = Math.max(-8, Math.min(8, dramaNoise));
  const finalScore = Math.max(0, Math.min(100, Math.round(rawSigmoid + boundedNoise)));

  let verdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION' = 'TRUTH';
  if (finalScore >= 65) {
    verdict = 'DECEPTION';
  } else if (finalScore >= 40) {
    verdict = 'UNSTABLE';
  }

  // Confidence scales with distance from decision boundaries
  const distFromBoundary = Math.min(Math.abs(finalScore - 40), Math.abs(finalScore - 65));
  const confidence = Math.min(1.0, 0.6 + distFromBoundary / 50);

  return {
    compositeScore: finalScore,
    verdict,
    confidence,
    zScores: {
      pitch: zPitch,
      jitter: zJitter,
      shimmer: zShimmer,
      hnr: zHNR
    }
  };
}
