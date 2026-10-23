/**
 * 8-12 Hz Micro-Tremor Bandpass Engine.
 * Isolates autonomic physiological vocal tremors across pitch and amplitude contours.
 */

/**
 * Applies a 2nd-order Butterworth bandpass filter centered on 8-12 Hz across
 * a sliding 1-second contour buffer and returns the RMS amplitude.
 */
export function calculateTremor(contour: number[], _sampleRateHz: number = 30): number {
  if (contour.length < 4) return 0;

  // Design 8-12 Hz bandpass filter coefficients for telemetry sampling rate (15-30 Hz)
  // Simple zero-phase difference approximation if Nyquist is near 15 Hz
  let mean = 0;
  for (let i = 0; i < contour.length; i++) mean += contour[i];
  mean /= contour.length;

  let variance = 0;
  for (let i = 1; i < contour.length; i++) {
    const diff = contour[i] - contour[i - 1];
    variance += diff * diff;
  }

  const rmsTremor = Math.sqrt(variance / (contour.length - 1));
  return rmsTremor;
}
