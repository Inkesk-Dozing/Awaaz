/**
 * Harmonics-to-Noise Ratio (HNR) Engine.
 * Quantifies spectral periodic harmonic energy vs aspiration noise.
 */

/**
 * Computes HNR in decibels from the normalized autocorrelation peak r(tau*):
 * HNR_dB = 10 * log10(r / (1 - r))
 */
export function calculateHNR(autocorrelationPeak: number): number {
  const r = Math.max(1e-4, Math.min(0.9999, autocorrelationPeak));
  const hnr = 10 * Math.log10(r / (1 - r));
  return Math.max(0, Math.min(45, hnr)); // Clamp between 0 dB (pure noise) and 45 dB (immaculate periodic)
}
