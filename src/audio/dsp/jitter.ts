/**
 * Jitter Perturbation Engine: Local & RAP Jitter.
 * Quantifies cycle-to-cycle frequency variations across validated glottal pulse periods.
 */

/**
 * Calculates local cycle-to-cycle relative jitter percentage:
 * Jitter_local = (1 / (N - 1) * sum(|T_{i+1} - T_i|)) / mean(T) * 100%
 */
export function jitterLocal(periods: number[]): number {
  const N = periods.length;
  if (N < 4) return 0;

  let sumDiff = 0;
  let sumPeriod = 0;

  for (let i = 0; i < N; i++) {
    sumPeriod += periods[i];
    if (i < N - 1) {
      sumDiff += Math.abs(periods[i + 1] - periods[i]);
    }
  }

  const meanPeriod = sumPeriod / N;
  if (meanPeriod === 0) return 0;

  return (sumDiff / (N - 1) / meanPeriod) * 100;
}

/**
 * Calculates Relative Average Perturbation (RAP) jitter percentage (3-point smoothed):
 * Jitter_RAP = (1 / (N - 2) * sum(|T_i - (T_{i-1} + T_i + T_{i+1}) / 3|)) / mean(T) * 100%
 */
export function jitterRAP(periods: number[]): number {
  const N = periods.length;
  if (N < 5) return 0;

  let sumPerturb = 0;
  let sumPeriod = 0;

  for (let i = 0; i < N; i++) {
    sumPeriod += periods[i];
    if (i >= 1 && i < N - 1) {
      const smoothed = (periods[i - 1] + periods[i] + periods[i + 1]) / 3;
      sumPerturb += Math.abs(periods[i] - smoothed);
    }
  }

  const meanPeriod = sumPeriod / N;
  if (meanPeriod === 0) return 0;

  return (sumPerturb / (N - 2) / meanPeriod) * 100;
}
