/**
 * Glottal pulse extraction and Praat-style outlier rejection.
 * Extracts consecutive pulse locations and rejects physiologically implausible jumps.
 */

export interface PulseSequence {
  pulseIndices: number[];     // Sample indices where pulses occurred
  periods: number[];          // Consecutive cycle durations in samples
  amplitudes: number[];       // Peak-to-peak amplitudes per pulse cycle
  valid: boolean;             // True if pulse sequence meets minimum sample count
}

/**
 * Extracts glottal pulse periods across a buffer given an estimated pitch period.
 * Filters pulse transitions via Praat-style ratio gates:
 * - Period jump threshold: 1.3x
 * - Amplitude jump threshold: 1.6x
 */
export function extractPulses(
  buffer: Float32Array,
  estimatedPeriodSamples: number,
  periodRatioThreshold: number = 1.3,
  amplitudeRatioThreshold: number = 1.6,
  minPulsesRequired: number = 6
): PulseSequence {
  if (estimatedPeriodSamples <= 2 || buffer.length < estimatedPeriodSamples * 2) {
    return { pulseIndices: [], periods: [], amplitudes: [], valid: false };
  }

  const pulseIndices: number[] = [];
  const amplitudes: number[] = [];
  const bufferLen = buffer.length;
  const searchWindow = Math.max(2, Math.floor(estimatedPeriodSamples * 0.4));

  // Find initial anchor peak in first expected cycle
  let currentIndex = 0;
  let maxVal = -Infinity;
  let maxIdx = 0;

  const initWindow = Math.min(bufferLen, Math.floor(estimatedPeriodSamples * 1.5));
  for (let i = 0; i < initWindow; i++) {
    if (buffer[i] > maxVal) {
      maxVal = buffer[i];
      maxIdx = i;
    }
  }

  pulseIndices.push(maxIdx);
  currentIndex = maxIdx;

  // Step forward by estimated period and seek local peak in small neighbourhood
  while (currentIndex + estimatedPeriodSamples < bufferLen) {
    const center = Math.round(currentIndex + estimatedPeriodSamples);
    const start = Math.max(0, center - searchWindow);
    const end = Math.min(bufferLen, center + searchWindow);

    let localPeak = -Infinity;
    let localPeakIdx = center;
    let localTrough = Infinity;

    for (let j = start; j < end; j++) {
      if (buffer[j] > localPeak) {
        localPeak = buffer[j];
        localPeakIdx = j;
      }
      if (buffer[j] < localTrough) {
        localTrough = buffer[j];
      }
    }

    // Record peak-to-peak amplitude for shimmer calculations
    const peakToPeak = Math.max(1e-5, localPeak - localTrough);
    amplitudes.push(peakToPeak);
    pulseIndices.push(localPeakIdx);
    currentIndex = localPeakIdx;
  }

  // Calculate successive period durations
  const rawPeriods: number[] = [];
  for (let i = 1; i < pulseIndices.length; i++) {
    rawPeriods.push(pulseIndices[i] - pulseIndices[i - 1]);
  }

  // Apply Praat-style outlier rejection
  const filteredPeriods: number[] = [];
  const filteredAmplitudes: number[] = [];
  const minPeriodRatio = 1 / periodRatioThreshold;
  const minAmpRatio = 1 / amplitudeRatioThreshold;

  for (let i = 0; i < rawPeriods.length; i++) {
    const currentPeriod = rawPeriods[i];
    const currentAmp = amplitudes[i] || 1e-4;

    if (i === 0) {
      filteredPeriods.push(currentPeriod);
      filteredAmplitudes.push(currentAmp);
      continue;
    }

    const lastAcceptedPeriod = filteredPeriods[filteredPeriods.length - 1];
    const lastAcceptedAmp = filteredAmplitudes[filteredAmplitudes.length - 1];

    const periodRatio = currentPeriod / lastAcceptedPeriod;
    const ampRatio = currentAmp / lastAcceptedAmp;

    // Reject transitions that exceed physiological boundary multipliers
    if (
      periodRatio > periodRatioThreshold ||
      periodRatio < minPeriodRatio ||
      ampRatio > amplitudeRatioThreshold ||
      ampRatio < minAmpRatio
    ) {
      continue; // Discard outlier cycle
    }

    filteredPeriods.push(currentPeriod);
    filteredAmplitudes.push(currentAmp);
  }

  return {
    pulseIndices,
    periods: filteredPeriods,
    amplitudes: filteredAmplitudes,
    valid: filteredPeriods.length >= minPulsesRequired
  };
}
