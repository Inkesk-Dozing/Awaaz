/**
 * Composite Stress & Deception Scoring Engine.
 * Combines z-score perturbations into a bounded 0-100 tension index with bounded drama noise.
 * Configurable via externalized BalanceParameters.
 */

import { VocalBaseline, computeZScore } from './baseline';

export interface StressTelemetryInput {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  tremor: number;
  pauses?: number;
}

export interface BalanceParameters {
  weights: {
    jitter: number;       // default: 0.35
    shimmer: number;      // default: 0.20
    pitchDrift: number;   // default: 0.20
    tremor: number;       // default: 0.15
    pauses: number;       // default: 0.10
  };
  sigmoidMidpoint: number; // default: 1.5 z-score
  sigmoidSlope: number;    // default: 1.8
  dramaNoiseAmp: number;   // default: 8.0
  truthThreshold: number;  // default: 40
  deceptionThreshold: number; // default: 65
}

export const DEFAULT_BALANCE_PARAMETERS: BalanceParameters = {
  weights: {
    jitter: 0.35,
    shimmer: 0.20,
    pitchDrift: 0.20,
    tremor: 0.15,
    pauses: 0.10,
  },
  sigmoidMidpoint: 1.5,
  sigmoidSlope: 1.8,
  dramaNoiseAmp: 8.0,
  truthThreshold: 40,
  deceptionThreshold: 65,
};

export interface StressCompositeResult {
  compositeScore: number;     // Bounded 0 - 100
  verdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION';
  confidence: number;         // 0.0 - 1.0
  zScores: {
    pitch: number;
    jitter: number;
    shimmer: number;
    hnr: number;
    tremor: number;
  };
}

export function computeStressComposite(
  input: StressTelemetryInput,
  baseline: VocalBaseline,
  dramaNoise: number = 0,
  params: BalanceParameters = DEFAULT_BALANCE_PARAMETERS
): StressCompositeResult {
  const zPitch = computeZScore(input.pitch, baseline.meanPitch, baseline.stdPitch);
  const zJitter = computeZScore(input.jitter, baseline.meanJitter, baseline.stdJitter);
  const zShimmer = computeZScore(input.shimmer, baseline.meanShimmer, baseline.stdShimmer);
  // Negative z-score for HNR indicates stress (more noise/dysphonia)
  const zHNR = -computeZScore(input.hnr, baseline.meanHNR, baseline.stdHNR);
  // Tremor z-score approximation based on 8-12Hz amplitude deviation
  const zTremor = Math.max(0, input.tremor * 10);
  const zPauses = Math.max(0, (input.pauses || 0) * 5);

  // Weight vector w_k combining acoustic perturbation metrics
  const weightedSum =
    params.weights.jitter * Math.max(0, zJitter) +
    params.weights.shimmer * Math.max(0, zShimmer) +
    params.weights.pitchDrift * Math.max(0, zPitch) +
    params.weights.tremor * zTremor +
    params.weights.pauses * zPauses;

  // Logistic Sigmoid mapping with midpoint at configured z-score
  const rawSigmoid =
    100 / (1 + Math.exp(-(weightedSum - params.sigmoidMidpoint) * params.sigmoidSlope));

  // Add bounded drama tension noise (clamped to +/- dramaNoiseAmp)
  const clampedNoise = Math.max(
    -params.dramaNoiseAmp,
    Math.min(params.dramaNoiseAmp, dramaNoise)
  );
  const finalScore = Math.max(0, Math.min(100, Math.round(rawSigmoid + clampedNoise)));

  let verdict: 'TRUTH' | 'UNSTABLE' | 'DECEPTION' = 'TRUTH';
  if (finalScore >= params.deceptionThreshold) {
    verdict = 'DECEPTION';
  } else if (finalScore >= params.truthThreshold) {
    verdict = 'UNSTABLE';
  }

  // Confidence scales with distance from decision boundaries
  const distFromBoundary = Math.min(
    Math.abs(finalScore - params.truthThreshold),
    Math.abs(finalScore - params.deceptionThreshold)
  );
  const confidence = Math.min(1.0, 0.6 + distFromBoundary / 50);

  return {
    compositeScore: finalScore,
    verdict,
    confidence,
    zScores: {
      pitch: zPitch,
      jitter: zJitter,
      shimmer: zShimmer,
      hnr: zHNR,
      tremor: zTremor,
    },
  };
}
