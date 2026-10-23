/**
 * Pure YIN fundamental frequency (F0) estimation algorithm.
 * Operates on Float32Array buffers with zero DOM or Web Audio dependencies.
 */

export interface YinResult {
  pitch: number;      // Fundamental frequency in Hz (0 if unvoiced)
  confidence: number; // Voicing confidence score 0.0 - 1.0
  period: number;     // Period in samples
}

/**
 * Computes fundamental pitch using the 4-stage YIN algorithm:
 * 1. Difference function
 * 2. Cumulative mean normalized difference function (d')
 * 3. Absolute thresholding (dip under threshold delta)
 * 4. Parabolic interpolation for sub-sample precision
 */
export function yinPitch(
  buffer: Float32Array,
  sampleRate: number = 48000,
  threshold: number = 0.13,
  minFreq: number = 60,
  maxFreq: number = 1200
): YinResult {
  const bufferSize = buffer.length;
  const minLag = Math.max(1, Math.floor(sampleRate / maxFreq));
  const maxLag = Math.min(Math.floor(bufferSize / 2), Math.floor(sampleRate / minFreq));

  if (maxLag <= minLag) {
    return { pitch: 0, confidence: 0, period: 0 };
  }

  // Step 1: Difference Function d(tau)
  const d = new Float32Array(maxLag);
  for (let tau = minLag; tau < maxLag; tau++) {
    let sum = 0;
    const windowLen = bufferSize - maxLag;
    for (let j = 0; j < windowLen; j++) {
      const delta = buffer[j] - buffer[j + tau];
      sum += delta * delta;
    }
    d[tau] = sum;
  }

  // Step 2: Cumulative Mean Normalized Difference Function d'(tau)
  const dPrime = new Float32Array(maxLag);
  dPrime[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < maxLag; tau++) {
    runningSum += d[tau];
    if (tau < minLag) {
      dPrime[tau] = 1;
    } else {
      dPrime[tau] = runningSum > 0 ? (d[tau] * tau) / runningSum : 1;
    }
  }

  // Step 3: Absolute Thresholding
  let tauStar = -1;
  for (let tau = minLag; tau < maxLag; tau++) {
    if (dPrime[tau] < threshold) {
      // Find local minimum
      while (tau + 1 < maxLag && dPrime[tau + 1] < dPrime[tau]) {
        tau++;
      }
      tauStar = tau;
      break;
    }
  }

  // Fallback: If no value dropped below threshold, find global minimum
  if (tauStar === -1) {
    let globalMin = 1.0;
    for (let tau = minLag; tau < maxLag; tau++) {
      if (dPrime[tau] < globalMin) {
        globalMin = dPrime[tau];
        tauStar = tau;
      }
    }
    // If even the global minimum is high, the frame is unvoiced/noisy
    if (globalMin > 0.45) {
      return { pitch: 0, confidence: Math.max(0, 1 - globalMin), period: 0 };
    }
  }

  // Step 4: Parabolic Interpolation for sub-sample accuracy
  let betterTau = tauStar;
  if (tauStar > 0 && tauStar < maxLag - 1) {
    const s0 = dPrime[tauStar - 1];
    const s1 = dPrime[tauStar];
    const s2 = dPrime[tauStar + 1];
    const denominator = 2 * (2 * s1 - s2 - s0);
    if (Math.abs(denominator) > 1e-6) {
      const delta = (s2 - s0) / denominator;
      betterTau = tauStar + delta;
    }
  }

  const confidence = Math.max(0, Math.min(1, 1 - dPrime[tauStar]));
  const pitch = sampleRate / betterTau;

  return {
    pitch,
    confidence,
    period: betterTau
  };
}
