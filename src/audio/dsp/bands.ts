/**
 * Pure IIR band helpers for spectral analysis (no Web Audio).
 * Used by the Voice Twin Matcher for real frequency-band energy ratios.
 */

export interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/**
 * RBJ audio EQ cookbook — constant 0 dB peak bandpass.
 */
export function bandpassCoeffs(sampleRate: number, freq: number, q: number): BiquadCoeffs {
  const w0 = (2 * Math.PI * freq) / sampleRate;
  const cosw = Math.cos(w0);
  const sinw = Math.sin(w0);
  const alpha = sinw / (2 * q);

  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * cosw;
  const a2 = 1 - alpha;

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0,
  };
}

/** Apply a biquad in-place (Direct Form I). */
export function applyBiquad(
  samples: Float32Array,
  coeffs: BiquadCoeffs,
  out?: Float32Array
): Float32Array {
  const dest = out ?? new Float32Array(samples.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  const { b0, b1, b2, a1, a2 } = coeffs;
  for (let i = 0; i < samples.length; i++) {
    const x0 = samples[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    dest[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return dest;
}

/** Mean square energy of a buffer. */
export function meanSquare(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return sum / samples.length;
}

export interface BandEnergies {
  low: number;
  mid: number;
  high: number;
}

/**
 * Split energy into low (80–1000 Hz), mid (1000–2500 Hz), high (2500–5000 Hz).
 */
export function bandEnergies(samples: Float32Array, sampleRate: number): BandEnergies {
  const low = applyBiquad(samples, bandpassCoeffs(sampleRate, 400, 0.7));
  const mid = applyBiquad(samples, bandpassCoeffs(sampleRate, 1600, 0.7));
  const high = applyBiquad(samples, bandpassCoeffs(sampleRate, 3500, 0.7));
  return {
    low: meanSquare(low),
    mid: meanSquare(mid),
    high: meanSquare(high),
  };
}

/**
 * Spectral tilt = low-band energy / high-band energy.
 * >1 means darker (more low energy); <1 means brighter.
 */
export function spectralTilt(samples: Float32Array, sampleRate: number): number {
  const e = bandEnergies(samples, sampleRate);
  return e.high > 1e-12 ? e.low / e.high : e.low > 1e-12 ? 1e6 : 1.0;
}
