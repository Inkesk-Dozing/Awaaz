/**
 * Synthetic Signal Generators for Headless DSP Testing:
 * Generates mathematically calibrated signals for pitch, jitter, shimmer,
 * harmonic noise, and unvoiced noise testing without DOM/browser dependencies.
 */

export interface GeneratorOptions {
  sampleRate?: number;
  durationSec?: number;
  amplitude?: number;
}

/**
 * Pure Sine wave generator: x[n] = A * sin(2 * pi * f * n / fs)
 */
export function generatePureSine(
  frequency: number,
  options: GeneratorOptions = {}
): Float32Array {
  const sampleRate = options.sampleRate ?? 48000;
  const durationSec = options.durationSec ?? 1.0;
  const amplitude = options.amplitude ?? 0.8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);

  const omega = (2 * Math.PI * frequency) / sampleRate;
  for (let n = 0; n < numSamples; n++) {
    buffer[n] = amplitude * Math.sin(omega * n);
  }

  return buffer;
}

/**
 * Frequency-Modulated Sine for calibrated jitter testing:
 * x[n] = A * sin(2*pi*f0*n/fs + beta * sin(2*pi*fm*n/fs))
 */
export function generateFrequencyModulatedSine(
  carrierFreq: number,
  modFreq: number,
  modIndexBeta: number,
  options: GeneratorOptions = {}
): Float32Array {
  const sampleRate = options.sampleRate ?? 48000;
  const durationSec = options.durationSec ?? 1.0;
  const amplitude = options.amplitude ?? 0.8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);

  const omegaC = (2 * Math.PI * carrierFreq) / sampleRate;
  const omegaM = (2 * Math.PI * modFreq) / sampleRate;

  for (let n = 0; n < numSamples; n++) {
    const phaseMod = modIndexBeta * Math.sin(omegaM * n);
    buffer[n] = amplitude * Math.sin(omegaC * n + phaseMod);
  }

  return buffer;
}

/**
 * Amplitude-Modulated Sine for calibrated shimmer testing:
 * x[n] = (1 + m * sin(2*pi*fm*n/fs)) * A * sin(2*pi*f0*n/fs)
 */
export function generateAmplitudeModulatedSine(
  carrierFreq: number,
  modFreq: number,
  modDepthM: number,
  options: GeneratorOptions = {}
): Float32Array {
  const sampleRate = options.sampleRate ?? 48000;
  const durationSec = options.durationSec ?? 1.0;
  const amplitude = options.amplitude ?? 0.8;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);

  const omegaC = (2 * Math.PI * carrierFreq) / sampleRate;
  const omegaM = (2 * Math.PI * modFreq) / sampleRate;

  for (let n = 0; n < numSamples; n++) {
    const envelope = 1.0 + modDepthM * Math.sin(omegaM * n);
    buffer[n] = amplitude * envelope * Math.sin(omegaC * n);
  }

  return buffer;
}

/**
 * Harmonic Pulse Train with configurable glottal period outliers (e.g. 2.0x step):
 */
export function generateGlottalPulseTrain(
  fundamentalFreq: number,
  outlierProbability: number = 0.0,
  options: GeneratorOptions = {}
): Float32Array {
  const sampleRate = options.sampleRate ?? 48000;
  const durationSec = options.durationSec ?? 1.0;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);

  const nominalPeriod = Math.floor(sampleRate / fundamentalFreq);
  let nextPulseIndex = 0;

  while (nextPulseIndex < numSamples) {
    // Generate exponential decay glottal pulse (~2ms width)
    const pulseLen = Math.min(Math.floor(sampleRate * 0.002), numSamples - nextPulseIndex);
    for (let k = 0; k < pulseLen; k++) {
      const decay = Math.exp(-k / (pulseLen * 0.3));
      buffer[nextPulseIndex + k] += Math.sin((Math.PI * k) / pulseLen) * decay;
    }

    // Step to next period, potentially injecting period doubling outlier
    const isOutlier = Math.random() < outlierProbability;
    const period = isOutlier ? nominalPeriod * 2 : nominalPeriod;
    nextPulseIndex += period;
  }

  return buffer;
}

/**
 * White Gaussian Noise generator via Box-Muller transform for unvoiced rejection testing:
 */
export function generateWhiteNoise(options: GeneratorOptions = {}): Float32Array {
  const sampleRate = options.sampleRate ?? 48000;
  const durationSec = options.durationSec ?? 1.0;
  const amplitude = options.amplitude ?? 0.5;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i += 2) {
    const u1 = Math.max(1e-15, Math.random());
    const u2 = Math.random();
    const radius = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;

    buffer[i] = amplitude * radius * Math.cos(theta);
    if (i + 1 < numSamples) {
      buffer[i + 1] = amplitude * radius * Math.sin(theta);
    }
  }

  return buffer;
}
