/**
 * Signal Quality Gating & Adaptive Noise Floor Tracker:
 * Computes continuous minimum-tracking ambient noise floor,
 * instantaneous Voice-to-Noise Ratio (SNR dB), and composite Signal Quality Index (Q).
 */

export function linearToDb(linear: number, minDb: number = -96): number {
  if (linear <= 0.0000158) return minDb;
  return Math.max(minDb, 20 * Math.log10(linear));
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

export interface SignalQualityMetrics {
  snrDb: number;
  noiseFloorDb: number;
  signalRmsDb: number;
  peakDb: number;
  qualityIndex: number; // 0.0 - 1.0
  isClipping: boolean;
  isNoiseFloorHigh: boolean;
  isReliable: boolean;
  statusMessage: string;
}

export class SignalQualityGate {
  private noiseFloorRms: number = 0.005; // -46 dBFS default floor
  private alphaFloor: number = 0.015; // Slow tracking of ambient minimum
  private alphaNoiseRise: number = 0.001; // Very slow rise to avoid voice adaptation
  private clippingCount: number = 0;

  constructor(initialFloorDb: number = -48) {
    this.noiseFloorRms = Math.pow(10, initialFloorDb / 20);
  }

  public analyzeFrame(samples: Float32Array): SignalQualityMetrics {
    if (samples.length === 0) {
      return {
        snrDb: 0,
        noiseFloorDb: -96,
        signalRmsDb: -96,
        peakDb: -96,
        qualityIndex: 0,
        isClipping: false,
        isNoiseFloorHigh: false,
        isReliable: false,
        statusMessage: 'NO AUDIO INPUT'
      };
    }

    let sumSquares = 0;
    let peak = 0;

    for (let i = 0; i < samples.length; i++) {
      const abs = Math.abs(samples[i]);
      if (abs > peak) peak = abs;
      sumSquares += abs * abs;
    }

    const currentRms = Math.sqrt(sumSquares / samples.length);
    const signalRmsDb = linearToDb(currentRms);
    const peakDb = linearToDb(peak);
    const isClipping = peakDb >= -0.5;

    if (isClipping) {
      this.clippingCount++;
    } else if (this.clippingCount > 0) {
      this.clippingCount--;
    }

    // Minimum tracking for background noise floor
    if (currentRms < this.noiseFloorRms) {
      // Rapid downward adaptation to true silence dips
      this.noiseFloorRms = (1 - this.alphaFloor) * this.noiseFloorRms + this.alphaFloor * currentRms;
    } else {
      // Extremely slow upward creep (prevents adapting to sustained speech vowels)
      this.noiseFloorRms = (1 - this.alphaNoiseRise) * this.noiseFloorRms + this.alphaNoiseRise * currentRms;
    }

    this.noiseFloorRms = Math.max(0.0001, this.noiseFloorRms); // clamp min floor to -80 dBFS
    const noiseFloorDb = linearToDb(this.noiseFloorRms);

    // Compute SNR (dB)
    const snrDb = Math.max(0, signalRmsDb - noiseFloorDb);

    // Composite Quality Index Q in [0.0, 1.0]
    let quality = 1.0;

    // 1. Penalize low SNR (< 18 dB)
    if (snrDb < 18) {
      quality -= (18 - snrDb) * 0.04;
    }

    // 2. Penalize digital clipping
    if (isClipping || this.clippingCount > 2) {
      quality -= 0.5;
    }

    // 3. Penalize extreme quiet (near dead silence)
    if (signalRmsDb < -46) {
      quality -= 0.35;
    }

    // 4. Penalize excessively loud noise floor (> -30 dBFS)
    const isNoiseFloorHigh = noiseFloorDb > -30;
    if (isNoiseFloorHigh) {
      quality -= 0.3;
    }

    quality = Math.max(0.0, Math.min(1.0, quality));
    const isReliable = quality >= 0.45;

    let statusMessage = 'SIGNAL OPTIMAL';
    if (isClipping) {
      statusMessage = 'INPUT CLIPPING (LOWER MIC GAIN)';
    } else if (!isReliable) {
      statusMessage = 'METRICS UNRELIABLE (HIGH BACKGROUND NOISE)';
    } else if (snrDb < 14) {
      statusMessage = 'SUB-OPTIMAL SNR (NOISY ENVIRONMENT)';
    }

    return {
      snrDb: Math.round(snrDb * 10) / 10,
      noiseFloorDb: Math.round(noiseFloorDb * 10) / 10,
      signalRmsDb: Math.round(signalRmsDb * 10) / 10,
      peakDb: Math.round(peakDb * 10) / 10,
      qualityIndex: Math.round(quality * 100) / 100,
      isClipping,
      isNoiseFloorHigh,
      isReliable,
      statusMessage
    };
  }

  public reset(): void {
    this.noiseFloorRms = 0.005;
    this.clippingCount = 0;
  }
}
