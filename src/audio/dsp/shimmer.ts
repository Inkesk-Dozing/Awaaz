/**
 * Shimmer Perturbation Engine: Local & dB Shimmer.
 * Quantifies cycle-to-cycle peak-to-peak amplitude variations across glottal pulses.
 */

/**
 * Calculates local relative shimmer percentage:
 * Shimmer_local = (1 / (N - 1) * sum(|A_{i+1} - A_i|)) / mean(A) * 100%
 */
export function shimmerLocal(amplitudes: number[]): number {
  const N = amplitudes.length;
  if (N < 4) return 0;

  let sumDiff = 0;
  let sumAmp = 0;

  for (let i = 0; i < N; i++) {
    sumAmp += amplitudes[i];
    if (i < N - 1) {
      sumDiff += Math.abs(amplitudes[i + 1] - amplitudes[i]);
    }
  }

  const meanAmp = sumAmp / N;
  if (meanAmp === 0) return 0;

  return (sumDiff / (N - 1) / meanAmp) * 100;
}

/**
 * Calculates absolute amplitude perturbation in decibels:
 * Shimmer_dB = 1 / (N - 1) * sum(|20 * log10(A_{i+1} / A_i)|)
 */
export function shimmerDB(amplitudes: number[]): number {
  const N = amplitudes.length;
  if (N < 4) return 0;

  let sumLogDiff = 0;

  for (let i = 0; i < N - 1; i++) {
    const a1 = Math.max(1e-6, amplitudes[i]);
    const a2 = Math.max(1e-6, amplitudes[i + 1]);
    sumLogDiff += Math.abs(20 * Math.log10(a2 / a1));
  }

  return sumLogDiff / (N - 1);
}
