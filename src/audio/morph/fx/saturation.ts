/**
 * Tanh soft-clip / saturation WaveShaper curve builder (pure).
 * Used for digital warmth and as a peak-safe soft limiter.
 */

/**
 * Builds a tanh-shaped transfer curve for WaveShaperNode.
 * @param drive Pre-gain into the nonlinearity (1 = gentle).
 * @param ceiling Optional hard linear scale so |out| stays ≤ 1.
 */
export function buildTanhCurve(drive: number, ceiling: number = 1, points: number = 2048): Float32Array {
  const n = points;
  const curve = new Float32Array(n);
  const d = Math.max(0.01, drive);
  const c = Math.max(0.05, ceiling);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    // tanh compresses toward ±1; scale so full-scale maps near ceiling.
    const y = Math.tanh(x * d) / Math.tanh(d);
    curve[i] = y * c;
  }
  return curve;
}

/**
 * Bitcrusher quantization curve (staircase) for robotic FX.
 */
export function buildBitcrushCurve(bitDepth: number, points: number = 2048): Float32Array {
  const bits = Math.max(1, Math.min(16, Math.floor(bitDepth)));
  const levels = Math.pow(2, bits) - 1;
  const curve = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const x = (i / (points - 1)) * 2 - 1;
    const quantized = Math.round(((x + 1) / 2) * levels) / levels;
    curve[i] = quantized * 2 - 1;
  }
  return curve;
}

/** Wire a WaveShaper with mild anti-alias oversample. */
export function createTanhShaper(ctx: BaseAudioContext, drive: number, ceiling: number = 1): WaveShaperNode {
  const shaper = ctx.createWaveShaper();
  shaper.curve = buildTanhCurve(drive, ceiling);
  shaper.oversample = '2x';
  return shaper;
}
